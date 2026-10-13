# Design: Personal Career & Learning Hub

## Context

The user is pursuing a Software Test Engineer position in Berlin on a Chancenkarte visa timeline (~30 weeks). This requires building three independent modules (Job Hunting, German A0 ➔ B1, Playwright Lab) in a single local workspace using free, open-source technology and the Google Gemini API. See `proposal.md` for background and motivation.

## Goals / Non-Goals

**Goals:**
- Provide a zero-cost, locally self-contained application requiring no cloud infrastructure subscriptions.
- Support multimodal job parsing from URLs or screenshots via Google Gemini API.
- Deliver an automated German Error Log and Spaced Repetition recall system with English and Gujarati explanations.
- Run Playwright test executions and custom scrapers directly from a web UI with live console logs and artifact links.
- Persist data reliably in a single local SQLite database (`personal_hub.db`).

**Non-Goals:**
- Multi-user authentication, cloud synchronization, or remote multi-tenant hosting (designed exclusively for single-user local use).
- Third-party paid text-to-speech services (browser Web Speech API is utilized instead).
- Full automated submission of job applications (automation assists in discovery and tailoring; final submission remains manual).

## Decisions

### Decision 1: Single-Page Application (React + Vite + Tailwind CSS) with Node.js/Express Backend
- **Context**: The app needs an intuitive desktop-friendly UI with real-time feedback and direct access to local system processes (like running Playwright CLI).
- **Choice**: React (Vite) for the frontend and Express.js in TypeScript for the backend.
- **Rationale**: Vite provides instantaneous HMR. Express allows running local Node.js child processes for `@playwright/test` and directly interfacing with SQLite.
- **Alternatives Considered**: Next.js (heavier server configuration and slower startup on Windows) vs. Electron/Tauri (adds unnecessary wrapper complexity when a local browser tab suffices).

### Decision 2: SQLite via `better-sqlite3` for Data Storage
- **Context**: Storage must be lightweight, persistent, and 100% free with zero daemon configuration.
- **Choice**: `better-sqlite3` synchronous database operations.
- **Rationale**: Single file (`personal_hub.db`), ultra-fast read/write, zero memory footprint when inactive, and easily backable by copying the database file.
- **Alternatives Considered**: PostgreSQL/MySQL (requires running local Docker or services) vs. LocalStorage (cannot be accessed by backend test runners or scrapers).

### Decision 3: Google Gemini API (`gemini-2.5-flash`) via `@google/genai`
- **Context**: Multimodal parsing (reading screenshots of job descriptions), intelligent CV match scoring, bilingual German/Gujarati explanations, and Playwright code generation.
- **Choice**: Google Gemini API Free Tier (`gemini-2.5-flash`).
- **Rationale**: High rate limits on the free tier, low latency, native multimodal image-and-text comprehension, and fluent multilingual output (German, English, Gujarati).
- **Alternatives Considered**: Local LLMs (Ollama) (requires heavy GPU hardware) vs. OpenAI API (requires paid credit billing).

### Decision 4: Playwright Execution Architecture via Child Process and SSE
- **Context**: Users need to trigger Playwright tests and scrapers from the UI and observe live progress.
- **Choice**: Express backend spawns `npx playwright test` with custom JSON/line reporters and streams stdout/stderr over Server-Sent Events (SSE). Test artifacts (trace zips, screenshots) are stored in `test-results/` and statically served.
- **Rationale**: Gives full access to genuine Playwright features (Trace Viewer, screenshots, video) without restricting users to simulated mock runners.

### Decision 5: Native Web Speech API for German Audio
- **Context**: B1 German learning requires listening (*Hören*) and speaking (*Sprechen*).
- **Choice**: Browser `window.speechSynthesis` (for German TTS) and `window.webkitSpeechRecognition` (for German STT).
- **Rationale**: 100% free, low latency, built into all modern Chromium browsers on Windows, and zero API keys required.

## Risks / Trade-offs

- **[Risk]**: Job board websites may update DOM structures or block automated scrapers.
  - **Mitigation**: Scrapers use resilient accessibility locators and randomized user agents; manual URL and screenshot parsing via Gemini remains the primary resilient fallback.
- **[Risk]**: Windows path escaping issues with child process execution.
  - **Mitigation**: Use Node.js `path.resolve()` and sanitize execution arguments in the test runner service.
- **[Risk]**: Gemini API rate limits on free tier.
  - **Mitigation**: Cache CV match scores, generated cover letters, and grammar explanations in SQLite to avoid duplicate API calls.

## Migration Plan

Greenfield local project. Scaffolding proceeds through `package.json`, database initialization script, server API routes, frontend components, and Playwright test suites. No rollback or database schema migration from previous versions is required.
