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

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Route ALL WebSocket requests to a single Durable Object instance globally
    if (url.pathname === '/ws' || request.headers.get('Upgrade') === 'websocket') {
      const id = env.HUB.idFromName('global-room-hub');
      const hub = env.HUB.get(id);
      return hub.fetch(request);
    }

    // Serve static assets
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('Not found', { status: 404 });
  }
};
