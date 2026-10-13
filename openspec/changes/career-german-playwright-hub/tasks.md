# Tasks

## 1. Project Scaffolding & Shared Infrastructure

- [x] 1.1 Initialize root project with `package.json`, Vite, React, TypeScript, Tailwind CSS, and Lucide icons; verify `npm run build` succeeds
- [x] 1.2 Setup Express.js TypeScript server structure with routes and CORS support; verify server starts on port 3001
- [x] 1.3 Initialize SQLite database schema with `better-sqlite3` migrations for jobs, cover letters, German vocabulary, error logs, and Playwright snippets; verify tables exist
- [x] 1.4 Create Google Gemini API client service with `.env` configuration for `gemini-2.5-flash`; verify test ping to Gemini API succeeds
- [x] 1.5 Implement main layout shell with collapsible sidebar navigation connecting all three modules; verify tab navigation renders without errors

## 2. Job Hunting Module Implementation

- [x] 2.1 Implement backend REST API endpoints (`/api/jobs`, `/api/jobs/:id`, `/api/jobs/extract`, `/api/jobs/cover-letter`); verify endpoint tests respond with valid JSON
- [x] 2.2 Build interactive Kanban board with stage transition drag-and-drop and dropdowns; verify stage changes persist to SQLite
- [x] 2.3 Build sortable Table view with full-text search, location/German level filtering, and follow-up badges (>7 days); verify filtering accuracy
- [x] 2.4 Implement Job Ingestion modal with URL input and screenshot upload processed via Gemini multimodal API; verify extracted fields populate the form
- [x] 2.5 Build Master CV manager and AI fit scoring card showing matching qualifications and skill gaps; verify score calculation returns 0-100%
- [x] 2.6 Implement tailored PDF cover letter generation using user reference layout; verify generated PDF downloads and renders correctly

## 3. German Learning Module (A0 ➔ B1) Implementation

- [x] 3.1 Implement German backend REST API endpoints (`/api/german/vocab`, `/api/german/error-log`, `/api/german/grade-exam`); verify API routes return valid status codes
- [x] 3.2 Build modular dashboard with open navigation across all 7 study sections; verify section links switch views instantaneously
- [x] 3.3 Implement Spaced Repetition (SRS) Flashcard system with noun genders, plurals, and browser Web Speech TTS audio; verify card flip and audio pronunciation
- [x] 3.4 Implement Grammar breakdown explorer with bilingual [English] / [ગુજરાતી (Gujarati)] toggle; verify language toggle switches text smoothly
- [x] 3.5 Build specialized German QA / Software Testing practice units (Bug reports, Jira tickets, sprint stand-ups); verify interactive scenarios render
- [x] 3.6 Implement automated Error Log capture from quiz failures and Active Recall review scheduler; verify failed questions log to database
- [x] 3.7 Build Goethe-Zertifikat B1 mock exam simulator with timed reading and AI-graded writing rubrics; verify evaluation score output out of 100

## 4. Playwright Learning Lab & Automation Hub Implementation

- [x] 4.1 Build internal QA Challenge Sandbox pages featuring dynamic loaders, shadow DOM, nested iframes, file uploads, and auth; verify pages load at `/sandbox/*`
- [x] 4.2 Configure `@playwright/test` runner backend service with child process execution and SSE log streaming; verify runner starts test execution
- [x] 4.3 Build in-app Test Runner dashboard displaying live test output, pass/fail status, test duration, failure screenshots, and trace links; verify real-time status updates
- [x] 4.4 Build Code Snippets & Cheatsheet Vault with syntax highlighting, search, and one-click copy; verify snippet retrieval
- [x] 4.5 Implement parameterized web scraper runner for Berlin job listings; verify scraper runs and populates results table
- [x] 4.6 Implement Gemini Playwright Mentor UI (Locator Doctor, Test Failure Debugger, POM Generator); verify AI suggestions return valid TypeScript snippets

## 5. End-to-End System Integration & Verification

- [x] 5.1 Write and run Playwright E2E tests verifying complete user flows across all 3 modules; verify all E2E tests pass
- [x] 5.2 Validate end-to-end workflow: ingest job ➔ generate cover letter ➔ review German QA drill ➔ execute Playwright sandbox challenge; verify full lifecycle integration
- [x] 5.3 Polish UI responsive styles, empty states, and local setup documentation in `README.md`; verify clean build and startup
