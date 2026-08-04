# ✏️ Don't Fall In

> A minimalist, physics-based paper pencil precision web game with real-time multiplayer, Web Audio synth sound effects, and Progressive Web App (PWA) support.

[![Deploy to Cloudflare Workers](https://img.shields.io/badge/Deploy-Cloudflare%20Workers-orange?logo=cloudflare)](https://workers.cloudflare.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Built with HTML5 Canvas](https://img.shields.io/badge/Built%20with-HTML5%20Canvas-red)](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-brightgreen)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)

---

## 📖 Overview

**Don't Fall In** is a responsive, precision-focused web browser game. Players control a pencil tip pressed up from underneath a sheet of paper full of holes. The objective is to guide the paper bump from the start line at the bottom to the finish line at the top without touching or falling through any holes.

---

## 🎮 Game Modes

### 1. 🎯 One Player (Single Player)
- Progress through **12 levels** of increasing difficulty.
- Levels feature progressively smaller hole radii, denser staggered patterns, and tighter corridors.
- Solvability verification algorithm ensures every generated level is 100% winnable.
- Features level-clearing particle fireworks and grand victory celebrations upon completing all 12 levels.

### 2. 📱 Two Players, One Phone (Local Shared Duel)
- Turn-based duel played on a single device screen.
- Powered by a custom **Global Multi-Touch Engine**: Player 1 drags the pencil bump anywhere in the center paper area while Player 2 taps side shake strips to shake the paper sideways—both running simultaneously on mobile touchscreens without pointer cancellation or touch drops.
- **Player 1** drags the pencil bump.
- **Player 2** holds the paper and taps the side touch strips (or presses `Z` / `M` keys on a keyboard) to shake the printed paper surface sideways and attempt to knock the pencil into a hole.
- Player 2 then takes a turn running the exact same sheet seed layout for a fair comparison.

### 3. 🌐 Two Phones (Real-Time Online Race)
- Instant multiplayer race across two mobile devices over WebSockets.
- Host creates a room to generate a **4-digit room code**.
- Guest joins using the room code and optional guest name.
- Both players race simultaneously on identical sheet seed layouts in real-time.
- Features **Instant Finish-Line Victory**: Crossing the finish line wins immediately without waiting for non-moving opponents.
- Powered by Cloudflare Durable Objects with Native WebSocket Hibernation (`ws.serializeAttachment()`) for 100% reliable state persistence across DO wakeups.

---

## ⌨️ Controls

| Input Device | Action |
| :--- | :--- |
| **Touchscreen (Mobile)** | Touch anywhere on the paper canvas to seamlessly drag the pencil bump |
| **Mouse (Desktop)** | Click and drag the paper bump |
| **Keyboard** | `Arrow Keys` or `WASD` to move the pencil bump |
| **Paper Shaker (2-Player Local)** | Side touch strips on screen edges, or `Z` (Left Shake) and `M` (Right Shake) keys |
| **Sound Toggle** | Tap the top-right HUD button (`🔊 Sound` / `🔇 Muted`) |

---

## ✨ Features

- **📱 Global Multi-Touch Engine**: Seamlessly routes concurrent multi-touch events on mobile phones so pencil dragging and side-strip paper shaking happen simultaneously without touch cancellation.
- **🎵 Web Audio Synthesizer**: Pure Web Audio API sound effects (drop plop, victory chime arpeggio, shake thud, tactile button clicks) with zero external file dependencies and an interactive HUD Mute/Unmute toggle (🔊 / 🔇). Includes iOS Safari Web Audio auto-unlock.
- **📱 Progressive Web App (PWA)**: Includes Web App Manifest (`manifest.json`) and SVG favicon (`favicon.svg`) for seamless **"Add to Home Screen"** native-like playback on iOS and Android.
- **🎆 Canvas Particle Fireworks**: Dynamic, physics-driven particle explosions with vibrant color palettes (Gold, Neon Cyan, Crimson, Magenta, Emerald) when clearing levels or winning matches.
- **🌐 Cloudflare Workers & Durable Objects**: Zero-latency, stateful WebSocket room relay using Cloudflare Durable Objects and WebSocket Hibernation attachments for 100% reliable global room pairing.
- **🤖 Generative Engine Optimization (GEO)**: Built-in `JSON-LD` schemas (`VideoGame` and `FAQPage`), `robots.txt` AI crawler rules, `sitemap.xml`, and `/llms.txt` context document optimized for ChatGPT, Google Gemini, Perplexity, and Claude.
- **🔍 Full SEO & Social Sharing**: Open Graph and Twitter Card tags for rich previews when shared on Discord, Twitter, or messaging apps.
- **💬 Accessible Plain English UI**: Clear, welcoming text designed for players of all ages and language backgrounds.

---

## 🛠️ Project Structure

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
├── package-lock.json       # Node package lock
└── README.md               # Project documentation
```

---

## 🚀 Local Development

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

## ☁️ Cloudflare Deployment

Deploy to Cloudflare Workers with Static Assets in a single command:

1. **Authenticate Wrangler (First time only):**
   ```bash
   npx wrangler login
   ```

2. **Deploy:**
   ```bash
   npm run deploy
   ```

3. **Custom Subdomain Setup:**
   - Go to **Cloudflare Dashboard** > **Workers & Pages** > **dont-fall-in**.
   - Go to **Settings** > **Domains & Routes** > **Add Custom Domain** (e.g., `game.yourdomain.com`).

---

## 📜 License

This project is open-source and available under the [MIT License](LICENSE).
