# 🧙‍♂️ Spelling Bee Wizard

An interactive, educational, and parent-friendly spelling practice application designed to help children and spelling champions master vocabulary. Combining playful, accessible learning with a distraction-free environment, standard web standards, and advanced speech features.

---

## 🎨 Visual Identity & Theme Choices

The **Spelling Bee Wizard** is meticulously designed with a beautiful, high-contrast, pediatric-friendly **Natural Canvas** palette. Instead of noisy or overstimulating game graphics, the UI focuses on promoting focused, long-form learning sessions:
- **Earthy and Cozy Accents**: Hand-selected hues featuring soft backgrounds (`#FBF9F4`), elegant sandstone structures (`#F0EAE1`), rich terracotta highlights (`#C9684C`), and focused sage green interaction triggers (`#768672`).
- **Typography Pairing Pairing**: Elegant **Fredoka** display headings for a playful yet legible look, coupled with structural **Inter** for gameplay lists, and high-contrasting **JetBrains Mono** for status logs.
- **Fluid Micro-Animations**: Smooth entry transitions powered by `motion/react`, gentle interactive scales, and custom rewards with gold coin counters and confetti explosions.

---

## 🚀 Key Features & Architectural Capabilities

### 🎮 Adaptive Play Arena
* **Spoken Inquiries**: Real-time browser-native Text-to-Speech (TTS) introduces the target word clearly with context, following the custom-tailored prompt structure: *"Can you spell [word]... [context sentence]."*
* **Flexible Practice Sessions**: Choose between custom list sizes (Quick Runs, Marathons, or full lists (Spelling Book)) to practice at any pace.
* **Segmented Progress Indicators**: Live interactive segment trackers with active animations keeping the user updated on their spelling streaks.

### 📚 Diverse Level Boundaries & Expert Support
* **Easy Level**: Focused phonics and CVC words tailored for early childhood development.
* **Medium Level**: Perfect vocabulary list size for primary and grammar scholars.
* **Hard Level**: Advanced spelling tests for senior elementary students.
* **Adult & Expert Mode (Ages 18+)**: Brand new high-difficulty spelling tier containing complex, highly orthographed, and sophisticated terms (e.g., *schadenfreude*, *synecdoche*, *idiosyncrasy*, *sesquipedalian*, etc.).

### 📱 Full Progressive Web App (PWA) Support
* **Fully Installable**: Meets comprehensive progressive standards! Installable directly from the modern browser to any iOS, Android, or desktop screen.
* **Custom SVG App Icons**: Handcrafted wizard bee high-fidelity vector icons configured as raw SVG, including clean full-bleed safe-zone maskable assets.
* **Intelligent Guidance Banner**: Smarter, non-intrusive installation banner with tailored step-by-step guidance for iOS Safari users (Share → "Add to Home Screen").
* **Service Worker Caching**: Immediate page assets caching via `/sw.js` supporting lightning-fast load times and seamless offline transitions.

### 🛠️ Dedicated Parent & Teacher Zone
* **Custom Homework Builder**: Create high-quality custom lists directly inside the client interface and specify custom sentences to distinguish problematic homophones (e.g., *"there"* vs. *"their"*).
* **Live Word Manager**: Edit, trim, or clear custom lists easily.
* **Persistent Leaderboard**: Tracks top student records with names, high-score rankings, correct percentage rates, and cute custom master titles (e.g., "Grand Spellcaster").

---

## 💻 Tech Stack

- **Frontend**: React 18+ (Vite, TypeScript, Tailwind CSS, Motion)
- **Backend Server**: Express Node.js application (bundled via `esbuild` for CJS compatibility)
- **Deployment & Security**: Full-stack design restricting API assets to backend layers and serving through robust ports.
- **Client Storage**: Persistent local database store mapping directly to `/data/spellings.json`.

---

## 🛠️ Local Development & Quick Setup

Follow these steps to set up the project locally:

### 1. Prerequisites
Ensure you have **Node.js** (v18 or higher) and **npm** installed on your system.

### 2. Install Dependencies
In the root directory, install the required node modules:
```bash
npm install
```

### 3. Run the Development Server
Fire up the integrated development container (Vite + Express):
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser to view and interact with the application.

### 4. Build for Production
To bundle the frontend single-page application and compile the server endpoints:
```bash
npm run build
```
This script builds the React assets into `dist/` and compiles the Node backend into a self-contained, high-performance CJS file at `dist/server.cjs` via esbuild.

### 5. Start the Production Server
```bash
npm run start
```
The server will boot and serve the production application securely on port **3000**.

---

## 🐳 Running with Docker

This application is fully Dockerized and optimized. To accommodate different deployment pipelines (with or without generated package lockfiles), the Dockerfile automatically checks for the existence of `package-lock.json` and gracefully falls back between clean installation commands:
- **With Lockfile**: Runs deterministic `npm ci` for ultra-fast, consistent production builds.
- **Without Lockfile (e.g., zip exports, custom forks)**: Automatically falls back to standard `npm install` to prevent setup crashes.

### Option A: Using the Local Cached Image (Recommended for Compose troubleshooting)

1. **Build the image first** to ensure your local Docker registry has the complete production binary available:
   ```bash
   docker build -t goudada/spelling-bee .
   ```

2. **Boot the stack and bind volumes** using Docker Compose:
   ```bash
   docker-compose up -d
   ```
   *Note: Under this configuration, Docker Compose will immediately pull and run the fully built `goudada/spelling-bee:latest` image.*

### Option B: Building inline from Source Code via Compose

If you wish to configure Docker Compose to compile the source code directly (instead of referencing a pre-built tag), simply open `docker-compose.yml` and uncomment the `build` parameters:

```yaml
version: '3.8'

services:
  spelling-app:
    # Option B: building straight from composer context
    build:
      context: .
      dockerfile: Dockerfile
    # image: goudada/spelling-bee:latest   # Comment this line out
    container_name: practice_spellings_wizard
    restart: unless-stopped
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
```

Once updated, you can build and run in a single command:
```bash
docker-compose up -d --build
```

The server will compile and expose the app. You can safely access it via:
👉 **[http://localhost:3000](http://localhost:3000)**

### Option C: Standalone Docker CLI (No Compose required)

If you don't use Docker Compose, you can build and bind storage directories directly using standard Docker CLI:

```bash
# 1. Build the production image
docker build -t goudada/spelling-bee .

# 2. Run container mapping host port 3000 to container 3000 and bind the persistence slot
docker run -d \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  --name spelling-wizard \
  goudada/spelling-bee:latest
```

---

## 🗄️ Persistence & Data Safety
No external complex databases are required! Everything is handled filesafe:
- Spelling lists and leaderboards are written to `/app/data/spellings.json` inside the container.
- By binding your local folder via the `-v` flag or Docker Compose volumes, your spelling progress, custom lists, and scores are fully persisted across container builds, host maintenance, and updates.

Enjoy playing, learning, and spelling! 🐝✨
