# Proposal

## Why

Preparing for a Software Test Engineer career in Berlin on a Chancenkarte visa requires balancing three interdependent goals: applying to local tech jobs, progressing from beginner German (A0) to Goethe-Zertifikat B1 proficiency, and mastering modern test automation with Playwright. Existing separate tools either lack domain customization, incur subscription costs, or fail to connect language and QA workflows. A single, zero-cost, locally hosted personal productivity system directly targets this Berlin career roadmap.

## What Changes

Build a unified personal web application powered by TypeScript, React, Tailwind CSS, Node.js, SQLite, and Google Gemini API (Free Tier):
- **Job Hunting Hub**: Dual-view (Kanban and Table) job CRM featuring multimodal ingestion (URL and screenshot parsing), master CV fit and gap analysis, German level requirement extraction, tailored PDF cover letter generation, and follow-up timeline alerts.
- **German Learning Hub (A0 ➔ B1)**: Independent study dashboards aligned with *Schritte PLUS NEU* and Goethe B1 requirements, covering all 4 skills (*Lesen, Hören, Schreiben, Sprechen*), featuring an automated Error Log integrated with Spaced Repetition (SRS), bilingual English/Gujarati explanations for complex grammar, and German QA/testing scenarios.
- **Playwright Learning Lab & Automation Hub**: Built-in QA challenge sandbox simulating real-world automation bottlenecks (dynamic loaders, shadow DOM, iframes, auth), an in-app test runner dashboard with live logs and traces, a curated code snippet/cheatsheet vault, parameterized Berlin job scrapers, and a Gemini AI Playwright mentor.

## Capabilities

### New Capabilities
- `job-hunting`: Manages the job application pipeline, multimodal job parsing, CV match scoring, company background research, and tailored PDF cover letter generation.
- `german-learning`: Delivers a structured A0 to B1 curriculum, 4-skill interactive practice, automated error logging with SRS recall, English/Gujarati grammar toggles, QA domain dialogue simulations, and Goethe B1 mock exams.
- `playwright-lab`: Provides a QA challenge sandbox, browser-based test suite execution with artifacts, a reusable code/cheatsheet library, custom automation runners, and Gemini-assisted test troubleshooting.

### Modified Capabilities
None.

## Impact
- **Architecture**: Greenfield local client-server application (`src/client` React frontend, `src/server` Express backend, SQLite local database).
- **APIs**: Integrates Google Gemini API via `@google/genai` (requiring `GEMINI_API_KEY` in `.env`).
- **Browser APIs**: Utilizes native Web Speech API for German speech synthesis and speech recognition with zero external dependencies.
- **Testing**: Integrates `@playwright/test` for both target testing sandbox and local scraper execution.
