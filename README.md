<div align="center">

<br/>

<img src="https://raw.githubusercontent.com/stutosed/stutosed/main/public/logo.svg" alt="stutosed logo" width="115" height="115" />

<br/>
<br/>

# stutosed

### The all-in-one high-performance learning ecosystem for B.Tech & Competitive Exam aspirants.

<br/>

[![Launch App](https://img.shields.io/badge/⚡%20Launch%20App-course.stutosed.in-ff6b4a?style=for-the-badge&logoColor=white)](https://course.stutosed.in/)
[![GitHub Repo](https://img.shields.io/badge/GitHub-stutosed%2Fstutosed-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/stutosed/stutosed)

<br/>

[![Next.js](https://img.shields.io/badge/Next.js-15.1_App_Router-000000?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict_Mode-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Cloudflare](https://img.shields.io/badge/Cloudflare-Pages_%26_Workers-F38020?style=flat-square&logo=cloudflare&logoColor=white)](https://workers.cloudflare.com)
[![Video Engine](https://img.shields.io/badge/Streaming-Abyss_%26_HLS-6366f1?style=flat-square&logo=vlc&logoColor=white)](https://abyss.to)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS_4.0-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-All%20Rights%20Reserved-red?style=flat-square)](LICENSE)

<br/>

> High-speed video streaming · Crystal-clear PDF notes · Offline study progress · 100% Free & Zero Ads — engineered for students.

<br/>

</div>

---

## 📖 About stutosed

**stutosed** is an ad-free, open-access academic portal built to deliver university syllabus courses and premier competitive exam batches directly to students with zero friction, paywalls, or distracting algorithms.

Organized into structured portals for **Bihar Engineering University (BEU) B.Tech**, **Government Exams (SSC, CGL, CHSL)**, and **GATE (ECE & Core Engineering)**, stutosed provides instant access to thousands of curated video lectures, topic-wise practice sheets, and verified handwritten notes.

---

## ✨ Features

| | Feature | Description |
|---|---|---|
| 📊 | **Study Dashboard** | Dynamic greeting banner, progress memory, and last-played lecture resume tracking |
| 🚀 | **Dynamic Academic Portals** | Centralized category architecture supporting Government Exams, BEU B.Tech & GATE engineering |
| 🎬 | **Native Video Streaming** | High-speed, lag-free lecture streaming powered by Abyss cloud infrastructure with HLS adaptive streaming |
| ⚡ | **Speed Regulation & Controls** | Granular playback regulation from **0.5x to 3.0x** with keyboard navigation shortcuts |
| 📑 | **Lossless PDF Reader** | Crystal-clear in-browser PDF notes viewer with native typography, full-screen mode & single-click downloads |
| 🌐 | **Zero-Egress Cloudflare Proxy** | Smart worker proxies routing media and high-volume PDF bandwidth for unlimited, 100% free streaming |
| 📱 | **Mobile Navigation & PWA** | Pinned glassmorphism bottom navigation, true fullscreen touch playback, and double-tap seek (-10s / +10s) |
| 📁 | **Clean Title-Based Browsing** | Instant-load lecture lists and syllabus browsers optimized for speed with zero bandwidth waste |
| 🏛️ | **BEU Engineering Hub** | Organized semester modules for Civil, CSE, Mech, EEE/ECE, and 1st Year (Math-II, Physics, Chemistry) |
| 🎯 | **Govt Exams Archive** | Complete structured batches for SSC CGL/CHSL (Parmar GK 3.0 & 4.0, Foundation, Math, English, Reasoning) |
| ⚙️ | **GATE Engineering Track** | Complete 36-lecture Signal & System series (Made Easy) with dedicated workspace and search filter |
| 👤 | **Offline-First Guest Access** | Frictionless instant access without forced login walls; study progress persists reliably in local storage |
| 🌓 | **Adaptive Theme System** | Instant dark/light mode toggle with smooth CSS variable transitions and zero page flicker |
| 🛡️ | **Edge SSRF Security Layer** | High-performance proxy routes with strict upstream hostname whitelisting to block unauthorized proxying |

---

## 🎓 Academic Portals Tree View

stutosed organizes curricula into dedicated, structured academic hubs:

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

### 4. Cloudflare Pages & Worker Smart Proxy
- **Cloudflare Pages / OpenNext**: Next.js 15 App Router running on global edge network with sub-50ms latency worldwide.
- **Worker Media Proxy**: Offloads heavy video streams and PDF bandwidth to Cloudflare Workers (`seiryu.stutosed.workers.dev`), maintaining 0 Egress Bandwidth costs and 100% free operation.

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
                             │    Cloudflare Pages Edge      │
                             │  (OpenNext Next.js 15 Engine) │
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
Frontend Framework:  Next.js 15.1 (Turbopack, React 19, App Router)
Language:            TypeScript 5.0 (Strict Type Checking)
Styling & Design:    Tailwind CSS 4.0 · Custom CSS Variables · Plus Jakarta Sans
Hosting & Edge:      Cloudflare Pages (via @opennextjs/cloudflare)
Media Streaming:     Abyss Player (Iframe) · HLS.js (Adaptive Bitrate)
Smart Proxy:         Cloudflare Workers (0 Egress Media Forwarder)
Icons:               Lucide React
Data Management:     Static Manifests · Offline LocalStorage Sync
```

---

## 📁 Project Structure

```
stutosed/
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md              # Bug reporting template
│   │   └── feature_request.md         # Feature request template
│   └── PULL_REQUEST_TEMPLATE.md       # Pull request contribution template
├── docs/
│   ├── ARCHITECTURE.md                # System design & media streaming pipeline
│   └── SECURITY.md                    # Threat model & SSRF protection
├── workers/
│   └── cloudflare_worker_secure.js    # Edge streaming proxy worker code
├── public/
│   ├── assets/                        # Portal banners and graphics
│   ├── favicon.svg                    # Vector brand spike logo
│   └── favicon.ico                    # Browser favicon
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── health/                # GET /api/health
│   │   │   └── v1/                    # Layered REST API endpoints
│   │   │       ├── stream/            # GET /api/v1/stream
│   │   │       ├── pdf/               # GET /api/v1/pdf
│   │   │       ├── thumbnail/         # GET /api/v1/thumbnail
│   │   │       └── hls-proxy/         # GET /api/v1/hls-proxy
│   │   ├── login/                     # Student account profile page
│   │   ├── watch/                     # Dedicated lecture watch portal
│   │   ├── globals.css                # Design tokens, typography & animations
│   │   ├── layout.tsx                 # Root layout & OpenGraph metadata
│   │   └── page.tsx                   # Main dashboard, portals & modal orchestration
│   ├── schemas/                       # Zod request validation schemas
│   │   ├── stream.schema.ts
│   │   ├── pdf.schema.ts
│   │   ├── thumbnail.schema.ts
│   │   └── hls-proxy.schema.ts
│   ├── server/                        # Server-only backend layer (import 'server-only')
│   │   ├── auth/                      # Pluggable user authentication layer
│   │   ├── http/                      # withApi wrapper, response envelopes, error classes
│   │   ├── security/                  # SSRF allowlists and in-memory rate limiting
│   │   ├── services/                  # Pure business logic (stream, pdf, hls-proxy)
│   │   └── repositories/              # Course data repositories
│   ├── components/
│   │   ├── CourseGrid.tsx             # Interactive course card grid
│   │   ├── CourseModal.tsx            # Clean syllabus explorer & lecture list
│   │   ├── GateEngineeringView.tsx    # GATE 36-lecture browser
│   │   ├── GovernmentExamsView.tsx    # SSC / Govt exam discipline hubs
│   │   ├── LibraryView.tsx            # Saved videos & bookmarked batches
│   │   ├── VideoPlayer.tsx            # Video player & speed controls
│   │   └── WatchClient.tsx            # Unified watch workspace
│   ├── lib/
│   │   ├── api-client.ts              # Typed client wrapper for frontend components
│   │   ├── abyss.ts                   # Abyss video hosting API integration
│   │   ├── coursesData.ts             # Course querying & progress helpers
│   │   └── proxyConfig.ts             # Cloudflare Worker configuration
│   └── types/                         # TypeScript interfaces
├── AGENTS.md                          # Architecture contract & LLM developer guide
├── package.json                       # Dependencies & scripts
└── tsconfig.json                      # Strict TypeScript configuration
```

---

## ⚡ Quick Start

### 1 · Clone the repository
```bash
git clone https://github.com/stutosed/stutosed.git
cd stutosed
```

### 2 · Configure Environment Variables
Create a `.env.local` file in the root directory:

```env
ABYSS_API_KEY=your_abyss_api_key_here
NEXT_PUBLIC_STREAM_PROXY_URL=https://seiryu.stutosed.workers.dev
```

### 3 · Install & Run Locally
```bash
# Install dependencies
npm install

# Run local development server
npm run dev
```
Open [`http://localhost:3000`](http://localhost:3000) in your browser.

### 4 · Deploy to Cloudflare Pages
1. Push your repository to GitHub:
   ```bash
   git push origin main
   ```
2. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/) → **Compute (Workers & Pages)** → **Create application** → **Pages** → **Connect to Git**.
3. Select the `stutosed/stutosed` repository.
4. Set Build Settings:
   - **Framework preset**: `None` (or `Next.js`)
   - **Build command**: `npm run build:cf`
   - **Output directory**: `.worker-next`
5. Under **Environment variables**, add:
   - `NODE_VERSION`: `20` (or `22`)
   - `ABYSS_API_KEY`: *(your api key)*
6. Click **Save and Deploy** ✅

---

## 🔒 Copyright & Proprietary Notice

**ALL RIGHTS RESERVED.**

Unauthorized copying, cloning, redistribution, commercialization, or reverse-engineering of this codebase or its streaming architecture is strictly prohibited. See [`LICENSE`](LICENSE) for complete terms.

---

<div align="center">
  <sub>✦ Built with precision for students. Designed &amp; Maintained by <b>stutosed</b>.</sub>
</div>
