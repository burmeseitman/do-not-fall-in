# ✏️ Don't Fall In

A paper & pencil precision browser game. Guide the pencil bump from start to finish without falling into any holes!

[![Deploy to Cloudflare Workers](https://img.shields.io/badge/Deploy-Cloudflare%20Workers-orange?logo=cloudflare)](https://workers.cloudflare.com/)
[![Built with HTML5 Canvas](https://img.shields.io/badge/Built%20with-HTML5%20Canvas-red)](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)

---

## 🎮 Game Modes

- 🎯 **Single Player**: 12 levels of increasing challenge.
- 📱 **2 Players (One Phone)**: Duel on a shared screen — one drags the pencil, one shakes the paper!
- 🌐 **2 Players (Two Phones)**: Real-time online race over a 4-digit room code.

---

## ✨ Features

- 🎆 **Particle Fireworks**: Celebratory fireworks on level clears and match wins.
- 🎵 **Web Audio Synth**: Sound effects (plop, victory chime, shake thud) & HUD mute button.
- 📱 **PWA Support**: Installable as a native-like app on mobile devices.
- 🤖 **SEO & GEO**: Built-in structured data and AI agent rules (`llms.txt`, `robots.txt`).

---

## 🕹️ Controls

| Control | Action |
| :--- | :--- |
| **Touch / Drag** | Move pencil bump |
| **Side Strips / Z & M Keys** | Shake paper (2-Player Mode) |
| **🔊 Button** | Toggle Mute / Unmute audio |

---

## 📁 Project Structure

```
do-not-fall-in/
├── public/                 # Web assets (index.html, manifest, favicon, SEO)
└── src/                    # Backend server & Cloudflare Worker
```

---

## 🚀 Commands

- **Local Dev Server**: `npm start`
- **Cloudflare Deploy**: `npm run deploy`

---

## 📜 License

[MIT License](LICENSE)
