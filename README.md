# ✏️ Don't Fall In

> A minimalist, physics-based paper pencil precision web browser game featuring 12 single-player levels, unlockable skins, tactile 3D paper physics, local same-phone duels, and real-time 2-phone online races with Global Leaderboards over Cloudflare Durable Objects SQLite.

![Cloudflare Workers](https://img.shields.io/badge/Cloudflare_Workers-F38020?style=flat-square&logo=cloudflare&logoColor=white)
![HTML5 Canvas](https://img.shields.io/badge/HTML5_Canvas-E34F26?style=flat-square&logo=html5&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=flat-square&logo=sqlite&logoColor=white)
![PWA Ready](https://img.shields.io/badge/PWA-Ready-5A0FC8?style=flat-square&logo=pwa&logoColor=white)
![License](https://img.shields.io/badge/License-Source--Available-CC0000?style=flat-square)

---

## 📖 Overview

**Don't Fall In** is a responsive, paper-pencil precision browser game. Players control a pencil bump pressed up from underneath a printed sheet of paper filled with punched holes. 

The objective is to guide the paper bump from the **START line at the bottom** to the **FINISH line at the top** without touching or falling into any holes along the path.

---

## ✨ Features & Game Mechanics

### 🎯 1. Single Player Mode (12 Levels)
- Progress through **12 progressively challenging levels**.
- **Star Rating System**: Earn 1 to 3 Stars based on completion time thresholds.
- **Automated Solvability Verification**: Built-in flood-fill verifier ensures every generated sheet layout is 100% passable.
- **Pre-Level Hazard Briefings**: Interactive briefing cards informing players of level objectives, star targets, and physics hazards before starting.

### 🌀 2. Gravitational Suction Pull & 3D Paper Funnels (Level 2+)
- **Gravitational Suction Pull**: Starting at Level 2, holes exert magnetic gravitational attraction pulling pencil tips toward hole centers (even when stationary).
- **Tactile 3D Paper Funnel Shadows**: Holes feature realistic 3D paper indentation drop shadows and sleek contour lines, creating a tactile physical funnel look with zero motion flicker.

### ⚡ 3. Moving Holes & Shifting Corridors (Level 9–12)
- **Ultra-Hard Endgame Mode**: On Level 9–12, 15% to 45% of holes oscillate horizontally in real-time, creating dynamic shifting corridors where safety gaps constantly open and close.
- Real-time 60 FPS canvas rendering with dynamic collision and suction force tracking.

### 🎨 4. Unlockable Pencil Skins & Custom Colors
- Unlock custom pencil colors and glowing halos based on total stars earned across single-player levels:
  - 🔵 **Classic Blue** (0 Stars - Default): Classic royal blue tip with blue halo.
  - 🔴 **Crimson Ruby** (6 Stars): Ruby red tip with pink glow halo.
  - ⚡ **Electric Neon** (15 Stars): Cyan neon tip with electric glow.
  - 🌟 **Golden Master** (27 Stars): Metallic gold tip with gold shimmer.
  - 🌈 **Rainbow Cycle** (36 Stars - All 12 Levels 3-Starred!): Real-time HSL color-shifting rainbow pencil tip!

### 🏆 5. Scoreboard & Global Leaderboard (Cloudflare DO SQLite)
- **Local Stats Tracker**: Tracks level best times, star ratings, attempts/clears, 2P local duel wins/draws, and online race wins/losses in `localStorage`.
- **Global Leaderboard Backend**: Powered by Cloudflare Durable Objects SQLite (`LeaderboardHub`), upserting best player scores per level and returning real-time **World Rank Badges** (`🌍 Rank #X worldwide!`).

### 🔊 6. Web Audio Synthesizer & Mobile Vibration Haptics
- Pure Web Audio API sound effects (drop plop, victory chime arpeggio, suction hum, shake thud, tactile button clicks) with zero external file dependencies and HUD Mute toggle (`🔊 Sound` / `🔇 Muted`).
- **Native Mobile Haptics (`navigator.vibrate`)**: Provides physical vibration feedback when trapped in suction pull zones, falling through holes, or clearing levels.

### 📱 7. Two Players, One Phone (Local Shared Duel)
- Turn-based duel on a single phone or tablet screen.
- **Round 1**: Player 1 guides the pencil bump, while Player 2 taps side shake strips (or presses `Z`/`M` keys) to shake the paper sideways and knock the pencil into a hole.
- **Round 2**: Player 2 takes a turn running the **exact same sheet seed layout** for a 100% fair match.

### 🌐 8. Two Phones (Real-Time Online Race)
- Instant real-time race across two mobile devices over WebSockets.
- Host creates a room to generate a **4-digit room code**.
- Guest enters the room code to join. Both race simultaneously on identical sheet layouts in real-time.

---

## 🕹️ Controls Reference

| Input Device | Action |
| :--- | :--- |
| **Touchscreen (Mobile)** | Touch anywhere on the paper canvas to drag the pencil bump |
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
│   └── worker.js           # Cloudflare Worker + Durable Objects SQLite backend
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
   Open your browser at `http://localhost:9000` (or `http://localhost:8420`).

---

## ☁️ Deployment

Deploy to Cloudflare Workers with Static Assets and Durable Objects SQLite in a single command:

```bash
npm run deploy
```

*(Or `npx wrangler deploy`)*

---

## 📜 License

This project is available under the [Source-Available License (All Rights Reserved)](LICENSE). You are free to view, clone, and study the source code for personal and educational purposes, but commercial deployment, re-branding, or live re-publishing is strictly prohibited without authorization.
