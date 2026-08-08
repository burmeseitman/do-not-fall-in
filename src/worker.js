'use strict';

import { DurableObject } from 'cloudflare:workers';

/**
 * Cloudflare Durable Object for Don't Fall In.
 * Uses Cloudflare's native WebSocket Hibernation API (serializeAttachment & getWebSockets)
 * ensuring room states survive DO hibernation 100% reliably.
 */
export class GameRoomHub extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
  }

  async fetch() {
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    this.ctx.acceptWebSocket(server);
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws, message) {
    let m;
    try {
      m = JSON.parse(message);
    } catch {
      return;
    }
    if (!m || typeof m.t !== 'string') return;

    let attachment = ws.deserializeAttachment() || {};

    if (m.t === 'create') {
      if (attachment.code) this.leaveRoom(ws);

      const code = this.newCode();
      if (!code) {
        this.send(ws, { t: 'err', m: 'No rooms available right now.' });
        return;
      }
      const seed = (Math.random() * 0xFFFFFFFF) >>> 0;
      attachment = { code, role: 'host', seed };
      ws.serializeAttachment(attachment);

      this.send(ws, { t: 'room', code, role: 'host' });
      return;
    }

    if (m.t === 'join') {
      if (attachment.code) this.leaveRoom(ws);

      const code = String(m.code == null ? '' : m.code).trim();
      if (!/^\d{4}$/.test(code)) {
        this.send(ws, { t: 'err', m: 'Codes are four digits.' });
        return;
      }

      const allSockets = this.ctx.getWebSockets();
      let hostWs = null;
      let hostAttachment = null;
      let hasGuest = false;

      for (const s of allSockets) {
        if (s === ws) continue;
        const att = s.deserializeAttachment();
        if (att && att.code === code) {
          if (att.role === 'host') {
            hostWs = s;
            hostAttachment = att;
          } else if (att.role === 'guest') {
            hasGuest = true;
          }
        }
      }

      if (!hostWs || !hostAttachment || hasGuest) {
        this.send(ws, { t: 'err', m: 'No room with that code.' });
        return;
      }

      attachment = { code, role: 'guest', seed: hostAttachment.seed };
      ws.serializeAttachment(attachment);

      this.send(hostWs, { t: 'ready', role: 'host', seed: hostAttachment.seed });
      this.send(ws, { t: 'ready', role: 'guest', seed: hostAttachment.seed });
      return;
    }

    if (m.t === 'reseed') {
      if (!attachment.code || attachment.role !== 'host') return;
      const newSeed = (Math.random() * 0xFFFFFFFF) >>> 0;
      attachment.seed = newSeed;
      ws.serializeAttachment(attachment);

      const allSockets = this.ctx.getWebSockets();
      for (const s of allSockets) {
        const att = s.deserializeAttachment();
        if (att && att.code === attachment.code) {
          att.seed = newSeed;
          s.serializeAttachment(att);
          this.send(s, { t: 'seed', seed: newSeed });
        }
      }
      return;
    }

    if (m.t === 'msg') {
      if (!attachment.code) return;
      const targetRole = attachment.role === 'host' ? 'guest' : 'host';
      const allSockets = this.ctx.getWebSockets();
      for (const s of allSockets) {
        const att = s.deserializeAttachment();
        if (att && att.code === attachment.code && att.role === targetRole) {
          this.send(s, { t: 'msg', d: m.d });
          break;
        }
      }
      return;
    }
  }

  async webSocketClose(ws) {
    this.leaveRoom(ws);
  }

  async webSocketError(ws) {
    this.leaveRoom(ws);
  }

  send(ws, obj) {
    try {
      ws.send(JSON.stringify(obj));
    } catch {
      /* socket closed */
    }
  }

  leaveRoom(ws) {
    const att = ws.deserializeAttachment();
    if (!att || !att.code) return;
    const code = att.code;
    ws.serializeAttachment(null);

    const allSockets = this.ctx.getWebSockets();
    for (const s of allSockets) {
      if (s === ws) continue;
      const peerAtt = s.deserializeAttachment();
      if (peerAtt && peerAtt.code === code) {
        s.serializeAttachment(null);
        this.send(s, { t: 'gone' });
      }
    }
  }

  newCode() {
    const allSockets = this.ctx.getWebSockets();
    const usedCodes = new Set();
    for (const s of allSockets) {
      const att = s.deserializeAttachment();
      if (att && att.code) usedCodes.add(att.code);
    }
    if (usedCodes.size >= 1000) return null;
    for (let attempt = 0; attempt < 200; attempt++) {
      const code = String(Math.floor(1000 + Math.random() * 9000));
      if (!usedCodes.has(code)) return code;
    }
    return null;
  }
}

/**
 * Global Leaderboard — Durable Object with SQLite.
 * Stores top 20 scores per level (1–12). One entry per player per level (best only).
 * Anti-cheat: minimum 1.5s clear time, max 10-min, server-computed stars.
 */
export class LeaderboardHub extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.ctx.storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS scores (
        pid   TEXT    NOT NULL,
        name  TEXT    NOT NULL,
        level INTEGER NOT NULL,
        time  REAL    NOT NULL,
        stars INTEGER NOT NULL,
        date  TEXT    NOT NULL,
        PRIMARY KEY (pid, level)
      )
    `);
    this.ctx.storage.sql.exec(
      `CREATE INDEX IF NOT EXISTS idx_level_time ON scores(level, time ASC)`
    );
  }

  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === 'POST' && url.pathname === '/api/score') {
      return this.submitScore(request);
    }
    if (request.method === 'GET' && url.pathname === '/api/leaderboard') {
      return this.getLeaderboard();
    }
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  async submitScore(request) {
    try {
      const body = await request.json();
      const { pid, name, level, time } = body;

      // Validate
      if (!pid || typeof pid !== 'string' || pid.length > 20)
        return Response.json({ ok: false, error: 'Invalid pid' }, { status: 400 });
      if (!name || typeof name !== 'string' || name.trim().length === 0 || name.length > 14)
        return Response.json({ ok: false, error: 'Invalid name' }, { status: 400 });
      if (!Number.isInteger(level) || level < 1 || level > 12)
        return Response.json({ ok: false, error: 'Invalid level' }, { status: 400 });
      if (typeof time !== 'number' || time < 1500 || time > 600000)
        return Response.json({ ok: false, error: 'Invalid time' }, { status: 400 });

      const stars = this.getStars(level, time);
      const date = new Date().toISOString().slice(0, 10);
      const cleanName = name.trim().slice(0, 14);

      // Upsert: keep the better time per player per level
      this.ctx.storage.sql.exec(
        `INSERT INTO scores (pid, name, level, time, stars, date)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)
         ON CONFLICT(pid, level) DO UPDATE SET
           name  = excluded.name,
           time  = MIN(scores.time, excluded.time),
           stars = MAX(scores.stars, excluded.stars),
           date  = CASE WHEN excluded.time < scores.time
                        THEN excluded.date ELSE scores.date END`,
        pid, cleanName, level, time, stars, date
      );

      // Compute rank
      const row = this.ctx.storage.sql.exec(
        `SELECT COUNT(*) + 1 AS rank FROM scores
         WHERE level = ?1 AND time < (
           SELECT time FROM scores WHERE pid = ?2 AND level = ?1
         )`,
        level, pid
      ).one();

      return Response.json({ ok: true, rank: row ? Number(row.rank) : 1 });
    } catch (e) {
      return Response.json({ ok: false, error: 'Server error' }, { status: 500 });
    }
  }

  getLeaderboard() {
    const levels = {};
    for (let i = 1; i <= 12; i++) {
      const rows = this.ctx.storage.sql.exec(
        `SELECT pid, name, time, stars, date FROM scores
         WHERE level = ?1 ORDER BY time ASC LIMIT 20`,
        i
      ).toArray();
      levels[String(i)] = rows.map(r => ({
        pid: r.pid, n: r.name, t: r.time, s: r.stars, d: r.date
      }));
    }
    return Response.json({ levels }, {
      headers: { 'Cache-Control': 'public, max-age=30' }
    });
  }

  getStars(level, timeMs) {
    const base = 5000 + level * 1500;
    if (timeMs <= base) return 3;
    if (timeMs <= base * 2) return 2;
    return 1;
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Route ALL WebSocket requests to a single Durable Object instance globally
    if (url.pathname === '/ws' || request.headers.get('Upgrade') === 'websocket') {
      const id = env.HUB.idFromName('global-room-hub');
      const hub = env.HUB.get(id);
      return hub.fetch(request);
    }

    // Leaderboard API routes
    if (url.pathname.startsWith('/api/')) {
      const id = env.LEADERBOARD.idFromName('global-leaderboard');
      const lb = env.LEADERBOARD.get(id);
      return lb.fetch(request);
    }

    // Serve static assets
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('Not found', { status: 404 });
  }
};
