# ✏️ Don't Fall In

> A minimalist, physics-based paper pencil precision web browser game featuring single player challenges, local same-phone duels, and real-time 2-phone online races over Cloudflare Durable Objects.

[![Deploy to Cloudflare Workers](https://img.shields.io/badge/Deploy-Cloudflare%20Workers-orange?logo=cloudflare)](https://workers.cloudflare.com/)
[![Built with HTML5 Canvas](https://img.shields.io/badge/Built%20with-HTML5%20Canvas-red)](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-brightgreen)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
[![License: Source-Available](https://img.shields.io/badge/License-Source--Available-red.svg)](LICENSE)

---

## 📖 Overview

**Don't Fall In** is a responsive, paper-pencil precision browser game. Players control a graphite pencil bump pressed up from underneath a printed sheet of paper filled with punched holes. 

The objective is to guide the paper bump from the **START line at the bottom** to the **FINISH line at the top** without touching or falling into any holes along the path.

---

## 🎮 Game Modes

### 1. 🎯 Single Player Mode
- Progress through **12 progressively challenging levels**.
- Features an automated solvability verification algorithm to guarantee every generated level is 100% winnable.
- Includes celebratory **Canvas Particle Fireworks** upon clearing levels and completing all 12 sheets.

### 2. 📱 Two Players, One Phone (Local Shared Duel)
- Turn-based duel played together on a single phone or tablet screen.
- **Round 1**: Player 1 guides the pencil bump up the paper, while Player 2 taps side shake strips (or presses `Z`/`M` keys) to shake the paper sideways and knock the pencil into a hole.
- **Round 2**: Player 2 takes a turn running the **exact same sheet seed layout** for a 100% fair match.
- Powered by a custom **Global Multi-Touch Engine** ensuring pencil dragging and paper shaking run concurrently on mobile touchscreens without pointer cancellation or touch drops.

### 3. 🌐 Two Phones (Real-Time Online Race)
- Instant real-time race across two mobile devices over WebSockets.
- Host creates a room to generate a **4-digit room code**.
- Guest enters the room code and optional player name to join.
- Both players race simultaneously on identical sheet seed layouts in real-time.
- Features **Instant Finish-Line Victory** (first across the finish line wins immediately) and real-time opponent position tracking.

---

## ✨ Highlights & Key Features

- **📱 Global Multi-Touch Engine**: Seamlessly routes concurrent touch events on mobile phones so pencil dragging and side-strip paper shaking happen simultaneously without touch cancellation.
- **🎵 Web Audio Synthesizer**: Pure Web Audio API sound effects (drop plop, victory chime arpeggio, shake thud, tactile button clicks) with zero external file dependencies and an interactive HUD Mute/Unmute toggle (`🔊 Sound` / `🔇 Muted`). Includes iOS Safari Web Audio auto-unlock.
- **📱 Progressive Web App (PWA)**: Includes Web App Manifest (`manifest.json`) and SVG favicon (`favicon.svg`) for **"Add to Home Screen"** native-like playback on iOS and Android.
- **🎆 HTML5 Canvas Fireworks**: Dynamic, physics-driven particle explosions with vibrant color palettes (Gold, Neon Cyan, Crimson, Magenta, Emerald) when clearing levels or winning matches.
- **🌐 Cloudflare Workers & Durable Objects**: Zero-latency, stateful WebSocket room relay using Cloudflare Durable Objects and WebSocket Hibernation attachments (`ws.serializeAttachment()`) for 100% reliable state persistence across DO wakeups.
- **🤖 Generative Engine Optimization (GEO)**: Built-in `JSON-LD` schemas (`VideoGame` and `FAQPage`), `robots.txt` AI crawler rules, `sitemap.xml`, and `/llms.txt` context document optimized for AI agents (ChatGPT, Google Gemini, Perplexity, Claude).

---

## 🕹️ Controls Reference

| Input Device | Action |
| :--- | :--- |
| **Touchscreen (Mobile)** | Touch anywhere on the paper canvas to seamlessly drag the pencil bump |
| **Mouse (Desktop)** | Click and drag the paper bump |
| **Keyboard** | `Arrow Keys` or `WASD` to move the pencil bump |
| **Paper Shaker (2-Player Local)** | Side touch strips on screen edges, or `Z` (Left Shake) and `M` (Right Shake) keys |
| **Sound Toggle** | Tap the top-right HUD button (`🔊 Sound` / `🔇 Muted`) |

---

## 📁 Project Structure

```
do-not-fall-in/
├── public/                 # Static web assets served to browsers & AI crawlers
│   ├── index.html          # Main HTML5 Canvas app frontend & UI
│   ├── favicon.svg         # Paper & pencil SVG favicon
│   ├── manifest.json       # PWA Web App Manifest
│   ├── robots.txt          # SEO & AI crawler rules
│   ├── sitemap.xml         # Search engine sitemap
│   └── llms.txt            # AI Agent open standard context document
│
├── src/                    # Backend server and worker source code
│   ├── server.js           # Local Node.js + WebSocket dev server
│   └── worker.js           # Cloudflare Worker + Durable Object backend
│
├── wrangler.json           # Cloudflare Wrangler project configuration
├── package.json            # Project manifest & npm scripts
└── README.md               # Project documentation
```

---

## 🚀 Getting Started

### Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/burmeseitman/do-not-fall-in.git
   cd do-not-fall-in
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run local server:**
   ```bash
   npm start
   ```
   Open your browser at `http://localhost:8420` (or `http://localhost:9000`).

---

## ☁️ Deployment

Deploy to Cloudflare Workers with Static Assets in a single command:

```bash
npm run deploy
```

*(Or `npx wrangler deploy`)*

---

## 📜 License

This project is available under the [Source-Available License (All Rights Reserved)](LICENSE). You are free to view, clone, and study the source code for personal and educational purposes, but commercial deployment, re-branding, or live re-publishing is strictly prohibited without authorization.
