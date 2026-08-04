'use strict';

/*
 * Don't Fall In — room server.
 *
 * Deliberately thin. It does three things:
 *   1. serves index.html (the same file that still opens straight from disk),
 *   2. pairs two phones into a room behind a 4-digit code,
 *   3. relays messages between them, verbatim.
 *
 * It runs NO physics and holds NO game state. The device with the pencil is
 * authoritative for collisions; this process never learns where a hole is,
 * because hole positions are never sent. Both clients derive an identical
 * sheet from the one seed handed out below.
 *
 * KNOWN AND ACCEPTED: because the client is authoritative, a modified client
 * can simply declare that it crossed. That is inherent to having no
 * server-side physics, and it is the design that was asked for. It is a
 * friendly-play limitation, not something the code below can close.
 *
 *   node server.js          # then open the printed http://<lan-ip>:8420
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { WebSocketServer } = require('ws');

// 8080 collides with too much (nginx, dev servers, containers). Override with
// PORT=... if this one is busy too.
const PORT = Number(process.env.PORT) || 8420;
const ROOT = __dirname;

/* ── Limits ──────────────────────────────────────────────────────────────
   This binds to 0.0.0.0 so two phones can reach it, which means anything on
   the network can too. None of it is authenticated by design, so the job of
   these numbers is to keep a stranger from exhausting the box.
   ─────────────────────────────────────────────────────────────────────── */
const LIMITS = {
  MAX_PAYLOAD:      8 * 1024,  // bytes per frame; real messages are under 100
  MAX_CLIENTS:      64,        // total sockets
  MAX_PER_IP:       6,         // sockets from one address
  MAX_ROOMS:        32,        // open rooms
  MSG_BURST:        120,       // token bucket depth
  MSG_PER_SEC:      60,        // sustained rate (the tip stream is 20/sec)
  MAX_JOIN_FAILS:   8,         // wrong codes before the socket is dropped
};

/* ── Static files ────────────────────────────────────────────────────────
   An allowlist, not a directory server. Serving the folder handed out
   server.js, package.json, everything under node_modules and any dotfile
   sitting beside them — this app only ever needs one file.
   ─────────────────────────────────────────────────────────────────────── */

const PUBLIC = new Map([
  ['/', 'index.html'],
  ['/index.html', 'index.html'],
  ['/robots.txt', 'robots.txt'],
  ['/sitemap.xml', 'sitemap.xml'],
  ['/llms.txt', 'llms.txt'],
]);

const SECURITY_HEADERS = {
  // The game's only script is inline, so 'unsafe-inline' is unavoidable
  // without a build step; everything else is locked down. Google Fonts is the
  // one external origin the page touches.
  'Content-Security-Policy': [
    "default-src 'none'",
    "script-src 'unsafe-inline'",
    "style-src 'unsafe-inline' https://fonts.googleapis.com",
    "font-src https://fonts.gstatic.com",
    "img-src 'self' data:",
    "connect-src 'self' ws: wss:",
    "base-uri 'none'",
    "form-action 'none'",
    "frame-ancestors 'none'",
  ].join('; '),
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
  'Cross-Origin-Opener-Policy': 'same-origin',
};

const httpServer = http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD', ...SECURITY_HEADERS }).end();
    return;
  }

  const rel = (req.url || '/').split('?')[0].split('#')[0];
  const name = PUBLIC.get(rel);
  if (!name) {
    res.writeHead(404, { 'Content-Type': 'text/plain', ...SECURITY_HEADERS }).end('Not found');
    return;
  }

  const targetPath = fs.existsSync(path.join(ROOT, 'public', name))
    ? path.join(ROOT, 'public', name)
    : path.join(ROOT, name);

  fs.readFile(targetPath, (err, buf) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain', ...SECURITY_HEADERS }).end('Not found');
      return;
    }
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      // Phones cache aggressively on a LAN; this makes edit-and-reload work.
      'Cache-Control': 'no-store',
      ...SECURITY_HEADERS,
    });
    res.end(req.method === 'HEAD' ? undefined : buf);
  });
});

/* ── Rooms ───────────────────────────────────────────────────────────────
   In memory only, gone when the process ends. Codes and seeds come from the
   CSPRNG: Math.random() is predictable enough that watching a few codes would
   let you guess the next one.
   ─────────────────────────────────────────────────────────────────────── */

const rooms = new Map();   // code -> { host, guest, seed }
const perIp = new Map();   // address -> open socket count

function newCode() {
  if (rooms.size >= LIMITS.MAX_ROOMS) return null;
  for (let attempt = 0; attempt < 200; attempt++) {
    const code = String(crypto.randomInt(1000, 10000));
    if (!rooms.has(code)) return code;
  }
  return null;
}

const newSeed = () => crypto.randomInt(0, 0x100000000);

function send(ws, obj) {
  if (ws && ws.readyState === ws.OPEN) ws.send(JSON.stringify(obj));
}

function peerOf(ws) {
  const room = rooms.get(ws.code);
  if (!room) return null;
  return ws.role === 'host' ? room.guest : room.host;
}

function closeRoom(code, exceptWs) {
  const room = rooms.get(code);
  if (!room) return;
  rooms.delete(code);
  for (const side of [room.host, room.guest]) {
    if (side && side !== exceptWs) {
      send(side, { t: 'gone' });
      side.code = null;
      side.role = null;
    }
  }
  log(`room ${code} closed (${rooms.size} open)`);
}

/** Token bucket, so one peer cannot pin the other's phone with a flood. */
function allowMessage(ws) {
  const now = Date.now();
  ws.tokens = Math.min(
    LIMITS.MSG_BURST,
    ws.tokens + ((now - ws.lastRefill) / 1000) * LIMITS.MSG_PER_SEC
  );
  ws.lastRefill = now;
  if (ws.tokens < 1) return false;
  ws.tokens -= 1;
  return true;
}

/* ── WebSocket ───────────────────────────────────────────────────────────
   Origin is checked because a WebSocket handshake is not subject to the same
   origin rules as fetch: without this, any web page either player happened to
   visit could open a socket to this box and start claiming rooms.
   ─────────────────────────────────────────────────────────────────────── */

function originAllowed(req) {
  const origin = req.headers.origin;
  if (!origin) return true;                 // not a browser; cannot be a CSWSH
  try {
    return new URL(origin).host === req.headers.host;
  } catch {
    return false;
  }
}

const wss = new WebSocketServer({
  server: httpServer,
  maxPayload: LIMITS.MAX_PAYLOAD,
  verifyClient: (info, done) => {
    if (!originAllowed(info.req)) {
      log(`refused cross-origin handshake from ${info.origin}`);
      return done(false, 403, 'Forbidden');
    }
    if (wss && wss.clients.size >= LIMITS.MAX_CLIENTS) {
      return done(false, 503, 'Busy');
    }
    const ip = addressOf(info.req);
    if ((perIp.get(ip) || 0) >= LIMITS.MAX_PER_IP) {
      log(`refused ${ip}: too many connections`);
      return done(false, 429, 'Too many connections');
    }
    done(true);
  },
});

function addressOf(req) {
  return (req.socket.remoteAddress || '?').replace('::ffff:', '');
}

wss.on('connection', (ws, req) => {
  const who = addressOf(req);
  ws.code = null;
  ws.role = null;
  ws.isAlive = true;
  ws.tokens = LIMITS.MSG_BURST;
  ws.lastRefill = Date.now();
  ws.joinFails = 0;
  ws.ip = who;

  perIp.set(who, (perIp.get(who) || 0) + 1);
  ws.on('pong', () => { ws.isAlive = true; });
  log(`connect ${who} (${wss.clients.size} open)`);

  ws.on('message', (raw) => {
    if (!allowMessage(ws)) return;          // over budget: drop silently

    let m;
    try { m = JSON.parse(raw); } catch { return; }
    if (!m || typeof m.t !== 'string') return;

    if (m.t === 'create') {
      if (ws.code) closeRoom(ws.code, ws);
      const code = newCode();
      if (!code) { send(ws, { t: 'err', m: 'No rooms available right now.' }); return; }
      rooms.set(code, { host: ws, guest: null, seed: newSeed() });
      ws.code = code;
      ws.role = 'host';
      send(ws, { t: 'room', code, role: 'host' });
      log(`room ${code} created (${rooms.size} open)`);
      return;
    }

    if (m.t === 'join') {
      if (ws.code) closeRoom(ws.code, ws);

      const code = String(m.code == null ? '' : m.code).trim();
      if (!/^\d{4}$/.test(code)) { send(ws, { t: 'err', m: 'Codes are four digits.' }); return; }

      const room = rooms.get(code);
      if (!room || !room.host || room.host.readyState !== 1 || room.guest || room.host === ws) {
        if (room && room.host && room.host.readyState !== 1) closeRoom(code);
        // One message for every failure, so a guess cannot be told apart from
        // a full room, and a budget so the 9000-code space cannot be swept.
        if (++ws.joinFails >= LIMITS.MAX_JOIN_FAILS) {
          log(`dropping ${who}: too many bad codes`);
          send(ws, { t: 'err', m: 'Too many attempts.' });
          ws.close(1008, 'too many attempts');
          return;
        }
        send(ws, { t: 'err', m: 'No room with that code.' });
        return;
      }

      room.guest = ws;
      ws.code = code;
      ws.role = 'guest';
      // Both sides learn the seed here, and generate the same sheet locally.
      send(room.host,  { t: 'ready', role: 'host',  seed: room.seed });
      send(room.guest, { t: 'ready', role: 'guest', seed: room.seed });
      log(`room ${code} paired`);
      return;
    }

    // A fresh sheet: the server stays the single source of seeds.
    if (m.t === 'reseed') {
      const room = rooms.get(ws.code);
      if (!room || !room.guest) return;
      room.seed = newSeed();
      send(room.host,  { t: 'seed', seed: room.seed });
      send(room.guest, { t: 'seed', seed: room.seed });
      return;
    }

    // Everything else is game traffic, passed through untouched. The peer
    // treats it as untrusted — see the client's readCoord / peerDone.
    if (m.t === 'msg') {
      const peer = peerOf(ws);
      if (peer) send(peer, { t: 'msg', d: m.d });
      return;
    }
  });

  ws.on('close', () => {
    const n = (perIp.get(who) || 1) - 1;
    if (n > 0) perIp.set(who, n); else perIp.delete(who);
    log(`disconnect ${who}`);
    if (ws.code) closeRoom(ws.code, ws);
  });

  ws.on('error', () => { /* close fires next; nothing to add */ });
});

// Phones drop off Wi-Fi when they sleep and the socket can hang half-open.
const heartbeat = setInterval(() => {
  for (const ws of wss.clients) {
    if (!ws.isAlive) { ws.terminate(); continue; }
    ws.isAlive = false;
    ws.ping();
  }
}, 30000);
wss.on('close', () => clearInterval(heartbeat));

/* ── Boot ────────────────────────────────────────────────────────────── */

function log(msg) {
  const t = new Date().toTimeString().slice(0, 8);
  console.log(`[${t}] ${msg}`);
}

function lanAddresses() {
  const out = [];
  for (const addrs of Object.values(os.networkInterfaces())) {
    for (const a of addrs || []) {
      if (a.family === 'IPv4' && !a.internal) out.push(a.address);
    }
  }
  return out;
}

httpServer.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n  Port ${PORT} is already in use by something else.`);
    console.error(`  Pick another:  PORT=9000 node server.js\n`);
    process.exit(1);
  }
  if (err.code === 'EACCES') {
    console.error(`\n  Not allowed to bind port ${PORT}. Try one above 1024.\n`);
    process.exit(1);
  }
  throw err;
});

httpServer.listen(PORT, '0.0.0.0', () => {
  const lan = lanAddresses();
  console.log('');
  console.log("  Don't Fall In — room server");
  console.log('  ─────────────────────────────────────────');
  console.log(`  this machine   http://localhost:${PORT}`);
  for (const ip of lan) {
    console.log(`  both phones    http://${ip}:${PORT}`);
  }
  if (!lan.length) console.log('  (no LAN address found — are you on Wi-Fi?)');
  console.log('');
  console.log('  Same Wi-Fi network. One phone hosts and reads out the');
  console.log('  4-digit code, the other joins with it.');
  console.log('');
  console.log('  Open to anyone on this network, by design — no accounts,');
  console.log('  no passwords. Do not port-forward it to the internet.');
  console.log('');
});
