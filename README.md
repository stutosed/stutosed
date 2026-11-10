<div align="center">

<br/>

<img src="https://raw.githubusercontent.com/stutosed/stutosed/main/public/logo.svg" alt="stutosed logo" width="120" height="120" />

<br/>
<br/>

# ✦ stutosed

### Next-gen open academic ecosystem engineered for B.Tech & Competitive Exam aspirants.

<br/>

[![Launch Portal](https://img.shields.io/badge/🌐%20Live%20Portal-stutosed.7atva.workers.dev-F38020?style=for-the-badge&logoColor=white)](https://stutosed.7atva.workers.dev/)
[![GitHub Repo](https://img.shields.io/badge/Source-stutosed%2Fstutosed-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/stutosed/stutosed)

<br/>

[![Next.js](https://img.shields.io/badge/Next.js-15.1_App_Router-000000?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers_Edge-F38020?style=flat-square&logo=cloudflare&logoColor=white)](https://workers.cloudflare.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict_Mode-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Streaming](https://img.shields.io/badge/Streaming-Abyss_%26_HLS-6366f1?style=flat-square&logo=vlc&logoColor=white)](https://abyss.to)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS_4.0-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-All%20Rights%20Reserved-red?style=flat-square)](LICENSE)

<br/>

> **⚡ High-speed video streaming · Crystal-clear PDF notes · Offline study memory · 100% Free & Zero Ads.**

<br/>

</div>

---

## 📖 Welcome to stutosed

**stutosed** is an ad-free, open-access academic learning platform built to deliver university engineering curricula and premier government exam series directly to students with zero friction, paywalls, or algorithm clutter.

Running entirely at the Edge via **Cloudflare Workers** and powered by **Abyss Cloud Streaming**, stutosed organizes thousands of structured video lectures, handwritten notes, and topic-wise practice modules into streamlined hubs for:
- 🏛️ **Bihar Engineering University (BEU) B.Tech**: All branches across all academic semesters.
- 🎯 **Government Competitive Exams**: Comprehensive SSC CGL, CHSL, Parmar GK, Quantitative Aptitude, English, and Reasoning batches.
- ⚙️ **GATE Engineering**: Dedicated subject tracks including Made Easy Signal & System 36-lecture master series.

---

## ✨ Flagship Capabilities

| | Capability | Description |
|---|---|---|
| 🎬 | **Abyss Cloud Video Engine** | High-definition, buffer-free video lectures with native iframe streaming and HTTP Range support (`bytes=0-`) |
| 📑 | **Lossless Vector PDF Reader** | Crystal-clear in-browser PDF notes previewer with native typography, full-screen reading & single-click downloads |
| 🌐 | **Zero-Egress Edge Proxy** | Cloudflare Worker media proxies routing high-volume video and PDF traffic with 0 egress bandwidth limits |
| 📊 | **Study Dashboard & Resume Memory** | Instant last-played lecture resume tracking and watch completion memory stored securely in local browser storage |
| 📱 | **Mobile Touch Player & Gestures** | True fullscreen touch mode, glassmorphism bottom navigation, and double-tap seek (-10s / +10s) |
| 📁 | **Instant Title-Based Catalog** | Lightning-fast, lightweight lecture explorer stripped of heavy thumbnails to minimize mobile data consumption |
| 🏛️ | **BEU Engineering Hub** | Syllabus-aligned modules for Civil, CSE, Mechanical, EEE/ECE, and 1st Year (Math-II, Physics, Chemistry) |
| 🎯 | **Govt Exams Portal** | Curated batches for Parmar GK 3.0 & 4.0, Foundation, Maths Special, English Vocab & Reasoning |
| ⚙️ | **GATE Workspace** | Complete 36-lecture Signal & System (Made Easy) playlist with real-time topic search filter |
| 👤 | **Frictionless Guest Access** | Instant access for all students with zero forced sign-ups, tracking telemetry, or cookie banners |
| 🌓 | **Adaptive Theme Engine** | Fluid dark/light theme switching with CSS variables and zero page flicker |
| 🛡️ | **Edge SSRF Security** | Strict upstream hostname allowlists and origin verification protecting all media streams |

---

## 🎓 Academic Portals Tree View

```
stutosed
 ├── 🏛️ BEU B.Tech Engineering Portal
 │    ├── 📘 1st Year All Branches (Engineering Physics, Chemistry, Math-II)
 │    ├── 🏗️ Civil Engineering Batch (Umeed & Esteem Modules)
 │    ├── 💻 Computer Science & Engineering (Core CS, Data Structures, Algorithms)
 │    ├── ⚙️ Mechanical Engineering (Fluid Mechanics, Thermodynamics, Machine Design)
 │    └── ⚡ EE / ECE / EEE Core Engineering Foundation
 │
 ├── 🎯 Government Exams Portal
 │    ├── 🧠 Parmar SSC GK 3.0 Complete Series (Topic-wise GK & PYQs)
 │    ├── 🔬 Parmar Academy GK 4.0 (Biology, Economics, Static GK, History, Geography, Polity)
 │    ├── 📖 Pratham Foundation Complete Subject Batch
 │    ├── 🔢 Quantitative Aptitude (Gagan Pratap, Abhinay Sharma, Loki Special Batches)
 │    ├── 🗣️ English Practice & Vocab Mastery (Turbo Practice & VOD Batches)
 │    └── 🧩 Logical Reasoning Special (Piyush Varshney & Selection Batches)
 │
 └── ⚙️ GATE Engineering Portal
      └── 📡 ECE Made Easy — Signal and System (Complete 36-Lecture Structured Course)
```

---

## ⚡ Core Engineering Breakdown

### 1. Abyss Cloud Video Streaming Pipeline
- **Abyss Native Player**: High-definition video playback hosted on resilient cloud infrastructure with HTTP Range support (`bytes=0-`).
- **HLS Segment Bridge**: Adaptive bitrate playback via `hls.js` ensuring smooth playback on low-bandwidth mobile networks.
- **Dedicated Watch Workspace**: Split-view player with interactive syllabus queue, lecture search filter, and instant next/previous controls.

### 2. Lossless Crystal-Clear PDF Reading
- Direct in-browser viewing with native vector typography rendering.
- Integrated download triggers with fallback proxied caching.
- Zero blurry canvas rendering or broken print stylesheets.

### 3. Layered Hardware & Gesture Navigation
Designed specifically for mobile ergonomics:
$$\text{Player [Layer 4]} \xrightarrow{\text{Back}} \text{Subfolder [Layer 3]} \xrightarrow{\text{Back}} \text{Course [Layer 2]} \xrightarrow{\text{Back}} \text{Portal [Layer 1]} \xrightarrow{\text{Back}} \text{Home [Layer 0]}$$
Pressing the Android back gesture or browser back arrow steps cleanly through each modal layer without exiting the application.

### 4. Cloudflare Worker Media Proxy
- Offloads heavy video streams and high-resolution PDF bandwidth to Cloudflare Workers (`seiryu.stutosed.workers.dev`).
- Preserves 0 Egress Bandwidth costs and ensures 100% free, unmetered streaming across the platform.

### 5. Offline-First Student State
- Watch completion checkmarks, resume timestamps (seconds), last-played courses, and bookmarks sync instantly to `localStorage`.
- No forced account creation, cookies wall, or tracking telemetry.

---

## 🏗️ System Architecture

```
                                 ┌────────────────────────┐
                                 │   Student Browser /    │
                                 │  Mobile App (Client)   │
                                 └───────────┬────────────┘
                                             │
                                     HTTPS + Next.js SPA
                                             │
                                             ▼
                             ┌───────────────────────────────┐
                             │    Cloudflare Workers Edge    │
                             │ (stutosed.7atva.workers.dev)  │
                             └───────────────┬───────────────┘
                                             │
                ┌────────────────────────────┼────────────────────────────┐
                │                            │                            │
                ▼                            ▼                            ▼
    ┌───────────────────────┐   ┌───────────────────────────┐   ┌───────────────────────┐
    │  Layered REST API     │   │  Security & Protection    │   │  Streaming & Worker   │
    │  - /api/v1/stream     │   │  - SSRF Domain Allowlist  │   │  - Cloudflare Worker  │
    │  - /api/v1/pdf        │   │  - In-Memory Rate Limiter │   │  - HLS Segment Bridge │
    │  - /api/v1/thumbnail  │   │  - Zod Request Validation │   │  - Edge Range Offload │
    │  - /api/health        │   │  - Server-Only Isolation  │   │  - 0 Egress Bandwidth │
    └───────────┬───────────┘   └─────────────┬─────────────┘   └───────────┬───────────┘
                │                             │                             │
                ▼                             ▼                             ▼
    ┌───────────────────────┐   ┌───────────────────────────┐   ┌───────────────────────┐
    │  Server Repositories  │   │  Server Services Logic    │   │  External Media CDNs  │
    │  - course.repo        │   │  - stream.service         │   │  - Abyss Video Player │
    │  - coursesData json   │   │  - pdf.service            │   │  - Cloudflare Workers │
    │  - Static Manifests   │   │  - hls-proxy.service      │   │  - Vidmoly / HLS      │
    └───────────────────────┘   └───────────────────────────┘   └───────────────────────┘
```

---

## ⌨️ Video Player Keyboard Shortcuts

| Shortcut | Action | Scope |
|---|---|---|
| <kbd>Space</kbd> / <kbd>K</kbd> | Play / Pause video | Video Player |
| <kbd>→</kbd> / <kbd>L</kbd> | Seek Forward 10 seconds | Video Player |
| <kbd>←</kbd> / <kbd>J</kbd> | Seek Backward 10 seconds | Video Player |
| <kbd>↑</kbd> / <kbd>↓</kbd> | Increase / Decrease volume | Video Player |
| <kbd>F</kbd> | Toggle Fullscreen mode | Video Player |
| <kbd>M</kbd> | Mute / Unmute audio | Video Player |
| <kbd>0</kbd> – <kbd>9</kbd> | Jump to 0% – 90% timeline | Video Player |
| <kbd>Esc</kbd> | Close active modal / step back | Global |

---

## 🛠 Tech Stack Spec

```yaml
Live Endpoint:       https://stutosed.7atva.workers.dev/
Frontend Framework:  Next.js 15.1 (Turbopack, React 19, App Router)
Language:            TypeScript 5.0 (Strict Type Checking)
Styling & Design:    Tailwind CSS 4.0 · Custom CSS Variables · Plus Jakarta Sans
Hosting Platform:    Cloudflare Workers (via @opennextjs/cloudflare)
Database & Auth:     Turso (libSQL Edge SQLite) · Better Auth
Media Streaming:     Abyss Player (Iframe) · HLS.js (Adaptive Bitrate)
Smart Proxy:         Cloudflare Workers (0 Egress Media Forwarder)
Icons:               Lucide React
Data Management:     Turso Cloud Sync · Offline LocalStorage
```

---

## 🔒 Copyright & Proprietary Notice

**ALL RIGHTS RESERVED.**

Unauthorized copying, cloning, redistribution, commercialization, or reverse-engineering of this codebase or its streaming architecture is strictly prohibited. See [`LICENSE`](LICENSE) for complete terms.

---

<div align="center">
  <sub>✦ Built with precision for students. Designed &amp; Maintained by <b>stutosed</b>.</sub>
</div>
