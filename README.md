# Personal Career & Learning Hub
> **All-in-one personal productivity platform for Software Test Engineers in Berlin (Chancenkarte Visa Runway).**

Unified web application combining three core goals:
1. **Job Hunting Hub**: Kanban & Table CRM, multimodal job description extraction (URL & Screenshot), CV fit & gap scoring, German requirement detection, and tailored PDF cover letter generation.
2. **German Learning Hub (A0 ➔ B1)**: 30-week curriculum aligned with *Schritte PLUS NEU* and Goethe-Zertifikat B1 requirements, Spaced Repetition (SRS) Flashcards, dual-language grammar explanations (English & ગુજરાતી), QA & bug reporting drills, and Goethe B1 mock exam grading.
3. **Playwright Learning Lab**: Target QA challenge sandboxes (Async tables, forms, shadow DOM, iframes, auth), in-app test runner with live terminal logs and trace links, code snippet vault, Berlin job scrapers, and Gemini Playwright mentor.

---

## 🛠️ Tech Stack (100% Free & Open Source)
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons
- **Backend**: Node.js, Express, TypeScript, `better-sqlite3`
- **Testing**: Playwright (`@playwright/test`)
- **AI**: Google Gemini API (`@google/generative-ai` via Google AI Studio free tier)
- **Audio & Speech**: Browser-native Web Speech API (zero external subscription fees)

---

## 🚀 Quick Start

### 1. Configure Environment
Copy `.env.example` to `.env` and add your Google Gemini API key:
```env
PORT=3001
GEMINI_API_KEY=your_gemini_api_key_here
```
*(Note: If no API key is provided, the application runs in smart mock mode so all features remain functional out of the box).*

### 2. Run Locally
```bash
# Start both server and client in development mode:
npm run dev

# Or build and start production server:
npm run build
npm start
```
- **App Dashboard**: `http://localhost:5173` (dev) or `http://localhost:3001` (prod)
- **QA Challenge Sandboxes**: `http://localhost:3001/sandbox`

### 3. Run Playwright Tests
```bash
# Run headless sandbox challenge tests:
npm run test:pw

# Open interactive Playwright UI:
npm run test:ui
```
