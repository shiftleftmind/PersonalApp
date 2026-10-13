import React, { useState } from 'react';
import {
  Compass,
  Briefcase,
  GraduationCap,
  Terminal,
  Code2,
  Database,
  FolderTree,
  ExternalLink,
  Copy,
  Check,
  CheckCircle,
  BookOpen,
  Volume2,
  FileText,
  ShieldCheck,
  Layers,
  Sparkles,
  Info,
  ChevronRight,
  Search,
} from 'lucide-react';

export const KnowledgeBaseDashboard: React.FC = () => {
  const [activeSection, setActiveSection] = useState<
    'overview' | 'jobs' | 'german' | 'playwright' | 'api' | 'db' | 'reference'
  >('overview');
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5 flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-sky-400 uppercase tracking-wider mb-1">
            <Compass size={14} />
            <span>Complete Project Documentation &amp; Knowledge Base</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">System Knowledge Base Portal</h2>
          <p className="text-xs text-slate-400 mt-1">
            Unified reference for <b>Karan Joshi</b> · Senior Software Test Engineer (Berlin, Chancenkarte Visa)
          </p>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1.5 rounded-xl overflow-x-auto">
          {[
            { id: 'overview', label: 'Architecture', icon: Compass },
            { id: 'jobs', label: 'Job Hunter Spec', icon: Briefcase },
            { id: 'german', label: 'German A0–B1 KB', icon: GraduationCap },
            { id: 'playwright', label: 'Playwright & Sandboxes', icon: Terminal },
            { id: 'api', label: 'REST APIs (18)', icon: Code2 },
            { id: 'db', label: 'SQLite Schema', icon: Database },
            { id: 'reference', label: 'Reference Materials', icon: FolderTree },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  activeSection === tab.id
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon size={13} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 1. ARCHITECTURE & OVERVIEW */}
      {activeSection === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400">Frontend Stack</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                  React 19 + Vite
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                React 19 with Tailwind CSS, Lucide Icons, and Web Speech API (native German speech synthesis and voice recognition). Dynamic code-splitting with <code>React.lazy()</code> ensures rapid initial load.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sky-400">Backend Server</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-950 text-sky-300 border border-sky-800">
                  Express + TS (:3001)
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Modular Express router architecture with multi-model Gemini AI fallback (<code>flash-latest</code>, <code>3.8</code>, <code>3.7</code>, <code>3.5</code>) plus an offline curated bilingual dictionary.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-400">Embedded Database</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800">
                  SQLite (better-sqlite3)
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Single-user embedded relational storage located at <code>src/server/db/personal_hub.db</code>. 100% offline persistence with automatic schema migrations.
              </p>
            </div>
          </div>

          {/* Core Modules Breakdown */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Layers size={16} className="text-sky-400" />
              <span>Core Operational Modules</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between font-bold text-emerald-400">
                  <span>1. Job Hunter CRM &amp; Career Automation</span>
                  <Briefcase size={14} />
                </div>
                <p className="text-slate-300">
                  Kanban application pipeline, live job URL extraction, candidate timeline notes, PDF CV parsing via <code>pdf-parse</code>, and tailored PDF cover letter generation matching Karan Joshi's layout.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between font-bold text-amber-400">
                  <span>2. German Learning Hub (A0 ➔ Goethe B1)</span>
                  <GraduationCap size={14} />
                </div>
                <p className="text-slate-300">
                  Stage 0 A0 German alphabet &amp; phonetics, Spaced Repetition vocabulary cards, 9 CEFR grammar topics with English/Gujarati script explanations, 4-skill practice, active recall quiz, and Goethe B1 exam simulator.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between font-bold text-purple-400">
                  <span>3. Playwright Lab &amp; Automation Hub</span>
                  <Terminal size={14} />
                </div>
                <p className="text-slate-300">
                  7 real-world QA challenge sandboxes, in-app test execution with live log streaming, failure artifact screenshot previews, trace viewer link, CRUD snippet vault, and Berlin job portal scraper.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between font-bold text-sky-400">
                  <span>4. Reference Materials &amp; Settings</span>
                  <FolderTree size={14} />
                </div>
                <p className="text-slate-300">
                  Dedicated local storage folder (<code>reference_materials/</code>) for large files (&gt;10MB textbook PDFs, PDF resumes, reference letters) with live folder path display and cover letter template editor.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. JOB HUNTER SPEC */}
      {activeSection === 'jobs' && (
        <div className="space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="font-bold text-sm text-white">Candidate Profile &amp; Standardized Layout</h3>
            <p className="text-xs text-slate-400">
              Generated cover letters and PDF exports strictly follow Karan Joshi's reference contact header and typography:
            </p>

            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl text-xs font-mono text-slate-300 space-y-2">
              <div className="text-sky-400 font-bold">Contact Header (Karan Joshi):</div>
              <div className="text-white font-semibold">Karan Joshi</div>
              <div>Berlin, Germany | +49 179 1700714 | karan.joshi.87@outlook.com</div>
              <div className="text-slate-500">Links: LinkedIn · Portfolio · XING</div>
              <div className="pt-2 text-emerald-400 font-bold">QA Value Proposition:</div>
              <div className="text-slate-300 font-sans leading-relaxed">
                3+ years testing SaaS products, exploratory/functional QA, and developing Playwright automation skills in JavaScript/TypeScript.
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-2">
              <span className="font-bold text-emerald-400 block">Live URL Extraction</span>
              <p className="text-slate-300 leading-relaxed">
                <code>POST /api/jobs/extract</code> fetches job posting HTML directly and parses role title, company name, requirements, and salary range, with AI fallback.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-2">
              <span className="font-bold text-sky-400 block">Activity Timeline Notes</span>
              <p className="text-slate-300 leading-relaxed">
                The <code>job_timeline_notes</code> table records recruitment steps (HR call, tech assessment, on-site) with timestamps visible in the Job Details modal.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3. GERMAN KNOWLEDGE BASE */}
      {activeSection === 'german' && (
        <div className="space-y-6">
          {/* Stage 0: Alphabets */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-sm text-white">Stage 0: A0 German Alphabet &amp; Phonetics Reference</h3>
                <p className="text-xs text-slate-400">Complete pronunciation guide with English and Gujarati script equivalents.</p>
              </div>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
                36 Seeded Items
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-xs">
              {[
                { letter: 'Ä ä', sound: 'ae / [ɛː]', word: 'Äpfel', gu: 'એ (લાંબો)' },
                { letter: 'Ö ö', sound: 'oe / [øː]', word: 'Öl', gu: 'ઓ (ગોળ હોઠ)' },
                { letter: 'Ü ü', sound: 'ue / [yː]', word: 'Über', gu: 'ઈ (ગોળ હોઠ)' },
                { letter: 'ß', sound: 'sharp s / [s]', word: 'Straße', gu: 'તીક્ષ્ણ સ' },
                { letter: 'ei', sound: 'eye / [aɪ]', word: 'Eins', gu: 'આઈ' },
                { letter: 'ie', sound: 'ee / [iː]', word: 'Sieben', gu: 'ઈ (લાંબી)' },
                { letter: 'eu', sound: 'oy / [ɔʏ]', word: 'Euro', gu: 'ઓય' },
                { letter: 'ch (ich)', sound: 'soft ch / [ç]', word: 'Ich', gu: 'નરમ શ/ખ' },
                { letter: 'ch (ach)', sound: 'hard ch / [x]', word: 'Buch', gu: 'કડક ખ' },
                { letter: 'sch', sound: 'sh / [ʃ]', word: 'Schule', gu: 'શ' },
                { letter: 'sp / st', sound: 'shp / sht', word: 'Start', gu: 'શ્પ / શ્ટ' },
                { letter: 'w', sound: 'v / [v]', word: 'Wasser', gu: 'વ' },
              ].map((item, idx) => (
                <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center space-y-0.5">
                  <div className="text-base font-bold text-white">{item.letter}</div>
                  <div className="text-sky-400 font-mono text-[11px]">{item.sound}</div>
                  <div className="text-slate-400 text-[10px]">z.B. {item.word}</div>
                  <div className="text-amber-300 font-sans text-[11px] pt-1">{item.gu}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Grammar Rules Matrix */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="font-bold text-sm text-white">CEFR A0–B1 Grammar Rules Matrix</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="font-bold text-sky-400 block">1. V2 Word Order (Hauptsatz)</span>
                <p className="text-slate-300">
                  In German declarative main clauses, the conjugated finite verb <b>must occupy position 2</b>.
                </p>
                <p className="text-amber-300 font-sans text-[11px]">
                  ગુજરાતી: જર્મન મુખ્ય વાક્યમાં ક્રિયાપદ હંમેશા બીજા સ્થાને આવે છે.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="font-bold text-emerald-400 block">2. Nebensatz mit "weil" / "obwohl"</span>
                <p className="text-slate-300">
                  Subordinating conjunctions push the finite conjugated verb to the <b>very end</b> of the clause.
                </p>
                <p className="text-amber-300 font-sans text-[11px]">
                  ગુજરાતી: 'weil' કે 'obwohl' વાક્યમાં ક્રિયાપદ હંમેશા છેલ્લે જાય છે.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="font-bold text-purple-400 block">3. Wechselpräpositionen (Two-Way)</span>
                <p className="text-slate-300">
                  Akkusativ for movement towards a target (<b>Wohin?</b>), Dativ for static location (<b>Wo?</b>).
                </p>
                <p className="text-amber-300 font-sans text-[11px]">
                  ગુજરાતી: ગતિ હોય (Wohin?) તો Accusative, સ્થિર સ્થિતિ હોય (Wo?) તો Dative.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. PLAYWRIGHT LAB & SANDBOXES */}
      {activeSection === 'playwright' && (
        <div className="space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-sm text-white">7 Playwright Automation QA Sandboxes</h3>
                <p className="text-xs text-slate-400">Target challenge environments built directly into the Express backend.</p>
              </div>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800 font-mono">
                /sandbox/*
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {[
                { path: '/sandbox/async', title: '1. Asynchronous Spinners & Tables', focus: 'Auto-waiting, toBeVisible(), avoiding sleeps' },
                { path: '/sandbox/forms', title: '2. Form Validation & Controls', focus: 'Input constraints, drop-down selects, error toggles' },
                { path: '/sandbox/shadow-dom', title: '3. Shadow DOM Web Components', focus: 'Piercing open shadow roots with CSS locators' },
                { path: '/sandbox/iframe', title: '4. Nested Iframe Interactivity', focus: 'Cross-document switching via page.frameLocator()' },
                { path: '/sandbox/auth', title: '5. Login Flow & Session Tokens', focus: 'Credential verification, session badges, logout' },
                { path: '/sandbox/upload', title: '6. File Drag-and-Drop & Upload', focus: 'Automated file assignment using setInputFiles()' },
                { path: '/sandbox/popups', title: '7. Dialogs, Alerts & Popups', focus: 'page.on("dialog") and page.waitForEvent("popup")' },
              ].map((s, idx) => (
                <div key={idx} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{s.title}</span>
                    <a
                      href={s.path}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sky-400 hover:underline font-mono text-[11px] flex items-center gap-1"
                    >
                      <span>{s.path}</span>
                      <ExternalLink size={10} />
                    </a>
                  </div>
                  <p className="text-slate-400 text-[11px]">Focus: {s.focus}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-2 text-xs">
            <span className="font-bold text-amber-400 block">Playwright Trace Viewer Command</span>
            <p className="text-slate-300">
              When tests run or fail, Playwright traces and screenshots are stored in <code>test-results/</code>. Inspect traces step-by-step with:
            </p>
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono text-emerald-300 flex items-center justify-between">
              <code>npx playwright show-trace test-results</code>
              <button
                onClick={() => copyToClipboard('npx playwright show-trace test-results', 'trace')}
                className="text-slate-400 hover:text-white"
              >
                {copiedText === 'trace' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. REST APIS */}
      {activeSection === 'api' && (
        <div className="space-y-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-3">
            <h3 className="font-bold text-sm text-white">Complete REST API Catalog (18 Endpoints)</h3>
            <p className="text-xs text-slate-400">All routes exposed by the Express server on port 3001 (proxied via Vite):</p>
          </div>

          <div className="space-y-2 text-xs font-mono">
            {[
              { m: 'GET', path: '/api/jobs', desc: 'Retrieve all job listings with status filters' },
              { m: 'POST', path: '/api/jobs', desc: 'Create a new job record in SQLite' },
              { m: 'PUT', path: '/api/jobs/:id', desc: 'Update job listing details or stage' },
              { m: 'DELETE', path: '/api/jobs/:id', desc: 'Delete job listing and associated notes' },
              { m: 'POST', path: '/api/jobs/extract', desc: 'Scrape and extract job details from live URL' },
              { m: 'GET', path: '/api/jobs/:id/notes', desc: 'Fetch timeline activity notes for a job' },
              { m: 'POST', path: '/api/jobs/:id/notes', desc: 'Create new timeline note for a job' },
              { m: 'POST', path: '/api/jobs/upload-cv', desc: 'Upload and parse PDF CV via pdf-parse' },
              { m: 'POST', path: '/api/jobs/:id/cover-letter', desc: 'Generate tailored German/English cover letter' },
              { m: 'GET', path: '/api/jobs/:id/cover-letter/pdf', desc: 'Export formatted PDF cover letter' },
              { m: 'GET', path: '/api/german/alphabets', desc: 'Fetch 36 A0 alphabet & phonetic items' },
              { m: 'GET', path: '/api/german/vocab', desc: 'Fetch vocabulary list for SRS practice' },
              { m: 'POST', path: '/api/german/vocab/:id/review', desc: 'Update vocabulary Spaced Repetition level' },
              { m: 'GET', path: '/api/german/error-log', desc: 'Fetch logged grammar and comprehension mistakes' },
              { m: 'POST', path: '/api/german/error-log', desc: 'Log a new mistake to Spaced Repetition queue' },
              { m: 'POST', path: '/api/german/error-log/:id/review', desc: 'Review mistake in Active Recall Quiz' },
              { m: 'POST', path: '/api/german/explain', desc: 'Explain grammar concept in English or Gujarati' },
              { m: 'POST', path: '/api/playwright/run-test', desc: 'Execute Playwright test suite via child process' },
            ].map((api, idx) => (
              <div
                key={idx}
                className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-center justify-between hover:border-slate-700 transition"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                      api.m === 'GET'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : api.m === 'POST'
                        ? 'bg-sky-950 text-sky-400 border border-sky-800'
                        : api.m === 'PUT'
                        ? 'bg-amber-950 text-amber-400 border border-amber-800'
                        : 'bg-rose-950 text-rose-400 border border-rose-800'
                    }`}
                  >
                    {api.m}
                  </span>
                  <span className="text-white font-bold">{api.path}</span>
                </div>
                <span className="text-slate-400 font-sans text-[11px]">{api.desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. SQLITE SCHEMA */}
      {activeSection === 'db' && (
        <div className="space-y-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-3">
            <h3 className="font-bold text-sm text-white">SQLite Database Schema (src/server/db/personal_hub.db)</h3>
            <p className="text-xs text-slate-400">All tables initialized automatically via better-sqlite3 with foreign keys:</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
              <span className="font-bold text-emerald-400 block">TABLE jobs</span>
              <ul className="text-slate-400 space-y-1">
                <li>id INTEGER PRIMARY KEY AUTOINCREMENT</li>
                <li>title TEXT NOT NULL</li>
                <li>company TEXT NOT NULL</li>
                <li>location TEXT</li>
                <li>salary_range TEXT</li>
                <li>status TEXT DEFAULT 'bookmarked'</li>
                <li>job_url TEXT</li>
                <li>description TEXT</li>
                <li>cover_letter TEXT</li>
                <li>created_at DATETIME DEFAULT CURRENT_TIMESTAMP</li>
              </ul>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
              <span className="font-bold text-amber-400 block">TABLE german_alphabets</span>
              <ul className="text-slate-400 space-y-1">
                <li>id INTEGER PRIMARY KEY AUTOINCREMENT</li>
                <li>letter TEXT NOT NULL UNIQUE</li>
                <li>name_de TEXT NOT NULL</li>
                <li>phonetic_en TEXT NOT NULL</li>
                <li>phonetic_gu TEXT NOT NULL</li>
                <li>example_word TEXT NOT NULL</li>
                <li>audio_text TEXT NOT NULL</li>
                <li>category TEXT NOT NULL</li>
              </ul>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
              <span className="font-bold text-purple-400 block">TABLE german_error_log</span>
              <ul className="text-slate-400 space-y-1">
                <li>id INTEGER PRIMARY KEY AUTOINCREMENT</li>
                <li>wrong_sentence TEXT NOT NULL</li>
                <li>corrected_sentence TEXT NOT NULL</li>
                <li>grammar_rule TEXT NOT NULL</li>
                <li>explanation_en TEXT</li>
                <li>explanation_gu TEXT</li>
                <li>srs_level INTEGER DEFAULT 0</li>
                <li>next_review_at DATETIME</li>
              </ul>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
              <span className="font-bold text-sky-400 block">TABLE playwright_snippets</span>
              <ul className="text-slate-400 space-y-1">
                <li>id INTEGER PRIMARY KEY AUTOINCREMENT</li>
                <li>title TEXT NOT NULL</li>
                <li>category TEXT NOT NULL</li>
                <li>code TEXT NOT NULL</li>
                <li>explanation TEXT</li>
                <li>tags TEXT</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 7. REFERENCE MATERIALS */}
      {activeSection === 'reference' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <FolderTree size={16} className="text-sky-400" />
            <span>Dedicated Reference Materials Repository (Local Disk)</span>
          </h3>
          <p className="text-xs text-slate-400">
            Created for large files (&gt;10MB), candidate documents, and cheatsheets:
          </p>

          <div className="space-y-3 text-xs font-mono">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="font-bold text-sky-400 block">reference_materials/cv/</span>
              <p className="text-slate-400 font-sans">
                Place your master PDF CV here (e.g. <code>karan_joshi_resume.pdf</code>). Automatically read by <code>POST /api/jobs/upload-cv</code>.
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="font-bold text-emerald-400 block">reference_materials/cover_letter/</span>
              <p className="text-slate-400 font-sans">
                Contains <code>reference_cover_letter.txt</code> matching Karan Joshi's exact letter layout and profile.
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="font-bold text-amber-400 block">reference_materials/textbook/</span>
              <p className="text-slate-400 font-sans">
                Stores your <code>schritte-a11-2.pdf</code> course textbook (&gt;10MB). Scanned dynamically by <code>GET /api/german/textbook-files</code>.
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="font-bold text-purple-400 block">reference_materials/cheatsheets/</span>
              <p className="text-slate-400 font-sans">
                Quick reference guides for Playwright TypeScript syntax, locators, and Goethe B1 Redemittel.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default KnowledgeBaseDashboard;
