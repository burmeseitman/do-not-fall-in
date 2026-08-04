# ✏️ Don't Fall In

> A minimalist, physics-based paper pencil precision web game.

[![Deploy to Cloudflare Workers](https://img.shields.io/badge/Deploy-Cloudflare%20Workers-orange?logo=cloudflare)](https://workers.cloudflare.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Built with HTML5 Canvas](https://img.shields.io/badge/Built%20with-HTML5%20Canvas-red)](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)

---

## 📖 Overview

**Don't Fall In** is a responsive, precision-focused web browser game. Players control a pencil tip pressed up from underneath a sheet of paper full of holes. The objective is to guide the paper bump from the start line at the bottom to the finish line at the top without touching or falling through any holes.

---

## 🎮 Game Modes

### 1. 🎯 One Player (Single Player)
- Progress through **12 levels** of increasing difficulty.
- Levels feature progressively smaller hole radii, denser staggered patterns, and tighter corridors.
- Features level-clearing particle fireworks and grand victory celebrations upon completing all 12 levels.

### 2. 📱 Two Players, One Phone (Local Shared Duel)
- Turn-based duel played on a single device.
- **Player 1** drags the pencil bump.
- **Player 2** holds the paper and uses the side touch strips (or `Z` / `M` keys on a keyboard) to shake the printed paper surface sideways and attempt to knock the pencil into a hole.
- Player 2 then takes a turn running the exact same sheet layout for a fair comparison.

### 3. 🌐 Two Phones (Real-Time Online Race)
- Instant multiplayer race across two mobile devices over WebSockets.
- Host creates a room to generate a **4-digit room code**.
- Guest joins using the code.
- Both players race simultaneously on the identical sheet seed layout in real-time.
- Features **Instant Victory** when crossing the finish line first and real-time bump position synchronization.

---

## ⌨️ Controls

| Input Device | Action |
| :--- | :--- |
| **Touchscreen** | Tap and drag the paper bump upwards |
| **Mouse** | Click and drag the paper bump |
| **Keyboard** | `Arrow Keys` or `WASD` to move the pencil bump |
| **Paper Shaker (2-Player Local)** | Side touch strips, or `Z` (Left Shake) and `M` (Right Shake) keys |

---

## ✨ Features

- **🎆 Canvas Particle Fireworks**: Dynamic, physics-driven particle explosions with vibrant color palettes (Gold, Neon Cyan, Crimson, Magenta, Emerald) when clearing levels or winning matches.
- **🌐 Cloudflare Workers & Durable Objects**: Zero-latency, stateful WebSocket room relay using Cloudflare Durable Objects and WebSocket Hibernation attachments for 100% reliable global room pairing.
- **🤖 Generative Engine Optimization (GEO)**: Built-in `JSON-LD` schemas (`VideoGame` and `FAQPage`), `llms.txt` context file, and AI agent crawler directives (`robots.txt`) optimized for ChatGPT, Google Gemini, Perplexity, and Claude.
- **🔍 Full SEO & Social Sharing**: Open Graph and Twitter Card tags for rich previews when shared on Discord, Twitter, or messaging apps.
- **💬 Accessible Plain English UI**: Simple, welcoming text designed for players of all ages and language backgrounds.

---

## 🛠️ Project Structure

```
.
├── public/                 # Static web assets served to browsers & AI crawlers
│   ├── index.html          # Main HTML5 Canvas app frontend & UI
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
├── README.md               # Project documentation
└── .gitignore              # Git exclusion rules
```

---

## 🚀 Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/do-not-fall-in.git
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
