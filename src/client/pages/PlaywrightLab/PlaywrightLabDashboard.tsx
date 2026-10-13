import React, { useState, useEffect } from 'react';
import {
  Terminal,
  Play,
  Copy,
  Check,
  Search,
  ExternalLink,
  Sparkles,
  Bug,
  ShieldCheck,
  Layers,
  Code2,
  RefreshCw,
  Plus,
  Briefcase,
  Pencil,
  Trash2,
  Image,
  Eye,
  X
} from 'lucide-react';

interface Snippet {
  id: number;
  title: string;
  category: string;
  code: string;
  explanation: string;
  tags: string;
}

interface ScrapedJob {
  title: string;
  company: string;
  location: string;
  url: string;
  salary: string;
}

export const PlaywrightLabDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'sandbox' | 'runner' | 'snippets' | 'scrapers' | 'mentor'>('sandbox');

  // Test Runner State
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [testOutput, setTestOutput] = useState<string>('');
  const [testResult, setTestResult] = useState<any>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Snippets State
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [snippetSearch, setSnippetSearch] = useState('');
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [newSnippetModal, setNewSnippetModal] = useState(false);
  const [editingSnippet, setEditingSnippet] = useState<Snippet | null>(null);
  const [newSnippet, setNewSnippet] = useState({
    title: '',
    category: 'Locators',
    code: '',
    explanation: '',
    tags: '',
  });

  // Scraper State
  const [scraperKeyword, setScraperKeyword] = useState('QA Automation Engineer');
  const [scraperLocation, setScraperLocation] = useState('Berlin');
  const [isScraping, setIsScraping] = useState(false);
  const [scrapedJobs, setScrapedJobs] = useState<ScrapedJob[]>([]);

  // AI Mentor State
  const [mentorMode, setMentorMode] = useState<'locator' | 'debug' | 'pom'>('locator');
  const [mentorInput, setMentorInput] = useState('');
  const [mentorResult, setMentorResult] = useState<{ advice: string; codeSnippet: string } | null>(null);
  const [isAskingMentor, setIsAskingMentor] = useState(false);

  // Active Sandbox Target for preview
  const [previewSandboxUrl, setPreviewSandboxUrl] = useState('/sandbox/async');

  const fetchSnippets = async () => {
    try {
      const res = await fetch(`/api/playwright/snippets?search=${encodeURIComponent(snippetSearch)}`);
      const data = await res.json();
      setSnippets(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddSnippet = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/playwright/snippets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSnippet),
      });
      setNewSnippetModal(false);
      setNewSnippet({
        title: '',
        category: 'Locators',
        code: '',
        explanation: '',
        tags: '',
      });
      fetchSnippets();
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateSnippet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSnippet) return;
    try {
      await fetch(`/api/playwright/snippets/${editingSnippet.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingSnippet),
      });
      setEditingSnippet(null);
      fetchSnippets();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteSnippet = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this snippet?')) return;
    try {
      await fetch(`/api/playwright/snippets/${id}`, {
        method: 'DELETE',
      });
      fetchSnippets();
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchSnippets();
  }, [snippetSearch]);

  // Execute Playwright Test Suite
  const handleRunTest = async (testPath?: string) => {
    try {
      setIsRunningTest(true);
      setTestOutput('Launching Playwright test runner via child process...\n');
      const res = await fetch('/api/playwright/run-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testPath: testPath || 'tests/sandbox/challenge.spec.ts' }),
      });
      const data = await res.json();
      setTestResult(data);
      setTestOutput(data.output || 'No output recorded.');
    } catch (e: any) {
      setTestOutput(`Execution error: ${e.message}`);
    } finally {
      setIsRunningTest(false);
    }
  };

  // Run Scraper
  const handleRunScraper = async () => {
    try {
      setIsScraping(true);
      const res = await fetch('/api/playwright/run-scraper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: scraperKeyword, location: scraperLocation }),
      });
      const data = await res.json();
      setScrapedJobs(data.jobs || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsScraping(false);
    }
  };

  // Import Scraped Job into Job Hunter
  const handleImportJob = async (job: ScrapedJob) => {
    try {
      await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: job.title,
          company: job.company,
          location: job.location,
          url: job.url,
          salary_range: job.salary,
          stage: 'Wishlist',
          tech_stack: 'Playwright, TypeScript',
        }),
      });
      alert(`Imported "${job.title}" into Job Hunter!`);
    } catch (e) {
      console.error(e);
    }
  };

  // Ask Mentor
  const handleAskMentor = async () => {
    if (!mentorInput.trim()) return;
    try {
      setIsAskingMentor(true);
      const res = await fetch('/api/playwright/mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: mentorMode, input: mentorInput }),
      });
      const data = await res.json();
      setMentorResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAskingMentor(false);
    }
  };

  // Copy code to clipboard
  const handleCopy = (id: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Playwright Lab &amp; Automation Hub
            <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-amber-950 text-amber-300 border border-amber-800">
              Test Automation
            </span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Real-world QA testing sandboxes, in-app test execution, snippet vault, Berlin job scrapers, and Gemini mentor.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1.5 rounded-xl">
          {[
            { id: 'sandbox', label: 'QA Sandbox Targets' },
            { id: 'runner', label: 'Test Runner Dashboard' },
            { id: 'snippets', label: 'Code Snippets Vault' },
            { id: 'scrapers', label: 'Berlin Job Scraper' },
            { id: 'mentor', label: 'Gemini Mentor' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                activeTab === tab.id ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 1. QA Sandbox Section */}
      {activeTab === 'sandbox' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-3">
            <h3 className="font-bold text-sm text-white uppercase tracking-wider">
              Target Challenge Pages
            </h3>
            {[
              {
                url: '/sandbox/async',
                title: '1. Async Elements & Spinners',
                desc: 'Delayed network simulation, loading indicators, dynamic tables.',
              },
              {
                url: '/sandbox/forms',
                title: '2. Form Validation & Controls',
                desc: 'Input constraints, drop-down selects, error message toggles.',
              },
              {
                url: '/sandbox/shadow-dom',
                title: '3. Shadow DOM Components',
                desc: 'Testing inside open shadow roots and custom web elements.',
              },
              {
                url: '/sandbox/iframe',
                title: '4. Nested Iframes',
                desc: 'Cross-document switching using frameLocator() strategy.',
              },
              {
                url: '/sandbox/auth',
                title: '5. Login Flow & Tokens',
                desc: 'Credential verification, session badges, logout triggers.',
              },
              {
                url: '/sandbox/upload',
                title: '6. File Drag-and-Drop & Upload',
                desc: 'Practice automated file uploads using setInputFiles() and drag events.',
              },
              {
                url: '/sandbox/popups',
                title: '7. Dialogs, Alerts & Popups',
                desc: 'Handling browser dialog events and page.waitForEvent("popup").',
              },
            ].map((s) => (
              <div
                key={s.url}
                onClick={() => setPreviewSandboxUrl(s.url)}
                className={`p-3.5 rounded-xl border cursor-pointer transition ${
                  previewSandboxUrl === s.url
                    ? 'bg-slate-900 border-amber-500/70 shadow-md'
                    : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-xs text-white">{s.title}</h4>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-slate-500 hover:text-amber-400 transition"
                    title="Open in new window"
                  >
                    <ExternalLink size={13} />
                  </a>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden flex flex-col h-[520px]">
            <div className="h-10 bg-slate-950 border-b border-slate-800 px-4 flex items-center justify-between text-xs text-slate-400 font-mono">
              <span className="truncate">{previewSandboxUrl}</span>
              <a
                href={previewSandboxUrl}
                target="_blank"
                rel="noreferrer"
                className="text-amber-400 hover:underline flex items-center gap-1"
              >
                <span>Direct Open</span>
                <ExternalLink size={11} />
              </a>
            </div>
            <iframe
              src={previewSandboxUrl}
              title="Sandbox Preview"
              className="w-full flex-1 bg-slate-950 border-none"
            />
          </div>
        </div>
      )}

      {/* 2. Test Runner Dashboard */}
      {activeTab === 'runner' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
            <div>
              <h3 className="font-bold text-sm text-white">Playwright Test Suite Execution</h3>
              <p className="text-xs text-slate-400">
                Executes `@playwright/test` on your local system with real browser automation.
              </p>
            </div>
            <button
              onClick={() => handleRunTest()}
              disabled={isRunningTest}
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-amber-600/20 transition disabled:opacity-50"
            >
              <Play size={15} />
              <span>{isRunningTest ? 'Running Tests...' : 'Run All Tests'}</span>
            </button>
          </div>

          {testResult && (
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">Status</span>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    testResult.success
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'bg-rose-950 text-rose-400 border border-rose-800'
                  }`}
                >
                  {testResult.success ? 'PASSED' : 'FAILED'}
                </span>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">Duration</span>
                <span className="text-xs font-bold text-white">
                  {(testResult.durationMs / 1000).toFixed(2)}s
                </span>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">Screenshots</span>
                <span className="text-xs font-bold text-white">
                  {testResult.screenshots?.length || 0}
                </span>
              </div>
            </div>
          )}

          {/* Screenshot Previews if any */}
          {testResult?.screenshots && testResult.screenshots.length > 0 && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Image size={16} className="text-amber-400" />
                  <h4 className="font-bold text-xs text-white">Test Failure / Visual Artifacts</h4>
                </div>
                <span className="text-[11px] text-slate-400">Click image to preview</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {testResult.screenshots.map((sUrl: string, idx: number) => (
                  <div
                    key={idx}
                    onClick={() => setPreviewImage(sUrl)}
                    className="group relative bg-slate-950 border border-slate-800 rounded-xl overflow-hidden cursor-pointer hover:border-amber-500/70 transition"
                  >
                    <img src={sUrl} alt={`Screenshot ${idx + 1}`} className="w-full h-24 object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                      <Eye size={16} className="text-white" />
                    </div>
                    <div className="p-1.5 text-[10px] text-slate-400 truncate font-mono">
                      {sUrl.split('/').pop()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Playwright Trace Viewer Tip */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <Terminal size={14} className="text-amber-400" />
              <span>To inspect step-by-step traces locally in Playwright Trace Viewer:</span>
              <code className="bg-slate-950 px-2 py-0.5 rounded text-amber-300 font-mono text-[11px]">
                npx playwright show-trace test-results
              </code>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText('npx playwright show-trace test-results');
                alert('Copied trace viewer command to clipboard!');
              }}
              className="text-[11px] text-amber-400 hover:underline flex items-center gap-1"
            >
              <Copy size={12} />
              <span>Copy</span>
            </button>
          </div>

          {/* Terminal Console */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-xs text-slate-200 overflow-x-auto min-h-[300px] max-h-[500px]">
            <div className="flex items-center justify-between text-slate-500 border-b border-slate-900 pb-2 mb-3">
              <span>TERMINAL OUTPUT</span>
              <span>{isRunningTest ? 'STREAMING...' : 'IDLE'}</span>
            </div>
            <pre className="whitespace-pre-wrap">{testOutput || 'Click "Run All Tests" above to execute.'}</pre>
          </div>
        </div>
      )}

      {/* 3. Snippets Vault */}
      {activeTab === 'snippets' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={snippetSearch}
                onChange={(e) => setSnippetSearch(e.target.value)}
                placeholder="Search snippets: locators, route, wait, POM..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500"
              />
            </div>
            <button
              onClick={() => setNewSnippetModal(true)}
              className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>Add Snippet</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {snippets.map((snip) => (
              <div
                key={snip.id}
                className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs text-white">{snip.title}</h4>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-900 text-amber-400 border border-slate-800">
                        {snip.category}
                      </span>
                      <button
                        onClick={() => setEditingSnippet(snip)}
                        className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-amber-400 transition"
                        title="Edit snippet"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={() => handleDeleteSnippet(snip.id)}
                        className="p-1 rounded bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition"
                        title="Delete snippet"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">{snip.explanation}</p>
                </div>

                <div className="relative bg-slate-900 border border-slate-800/80 rounded-xl p-3">
                  <pre className="text-[11px] font-mono text-slate-200 overflow-x-auto whitespace-pre">
                    {snip.code}
                  </pre>
                  <button
                    onClick={() => handleCopy(snip.id, snip.code)}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition"
                    title="Copy snippet"
                  >
                    {copiedId === snip.id ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Berlin Job Scraper */}
      {activeTab === 'scrapers' && (
        <div className="space-y-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h3 className="font-bold text-sm text-white">Berlin QA Automation Job Scraper</h3>
            <p className="text-xs text-slate-400">
              Run Playwright scrapers against German job portals. Discovered listings can be imported into your Job Hunter CRM with one click.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Keywords</label>
                <input
                  type="text"
                  value={scraperKeyword}
                  onChange={(e) => setScraperKeyword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Location</label>
                <input
                  type="text"
                  value={scraperLocation}
                  onChange={(e) => setScraperLocation(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleRunScraper}
                  disabled={isScraping}
                  className="w-full py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition disabled:opacity-50"
                >
                  <Play size={14} />
                  <span>{isScraping ? 'Running Scraper...' : 'Run Scraper'}</span>
                </button>
              </div>
            </div>
          </div>

          {scrapedJobs.length > 0 && (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-3">Title &amp; Company</th>
                    <th className="p-3">Location</th>
                    <th className="p-3">Salary Range</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  {scrapedJobs.map((job, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/40 transition">
                      <td className="p-3">
                        <div className="font-bold text-white">{job.title}</div>
                        <div className="text-[11px] text-amber-400">{job.company}</div>
                      </td>
                      <td className="p-3 text-slate-400">{job.location}</td>
                      <td className="p-3 text-emerald-400 font-medium">{job.salary}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleImportJob(job)}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white text-[11px] font-semibold transition"
                        >
                          Import to CRM
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 5. Gemini AI Playwright Mentor */}
      {activeTab === 'mentor' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <Sparkles size={18} className="text-amber-400" />
                Gemini Playwright AI Mentor
              </h3>
              <p className="text-xs text-slate-400">
                Diagnose timeout exceptions, generate robust accessible locators, or build Page Object Models.
              </p>
            </div>

            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-1">
              {[
                { id: 'locator', label: 'Locator Doctor' },
                { id: 'debug', label: 'Failure Debugger' },
                { id: 'pom', label: 'POM Generator' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMentorMode(m.id as any)}
                  className={`px-3 py-1 rounded text-xs font-semibold transition ${
                    mentorMode === m.id ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {mentorMode === 'locator' && 'Paste HTML element or description of target element:'}
              {mentorMode === 'debug' && 'Paste Playwright test execution error or failure log:'}
              {mentorMode === 'pom' && 'Paste target web page HTML structure or component fields:'}
            </label>
            <textarea
              rows={5}
              value={mentorInput}
              onChange={(e) => setMentorInput(e.target.value)}
              placeholder="e.g. Timeout 30000ms exceeded waiting for locator('button.submit-primary')..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleAskMentor}
              disabled={isAskingMentor}
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-amber-600/20 transition disabled:opacity-50"
            >
              <Sparkles size={15} />
              <span>{isAskingMentor ? 'Analyzing with Gemini...' : 'Analyze & Solve'}</span>
            </button>
          </div>

          {mentorResult && (
            <div className="space-y-3 border-t border-slate-800 pt-3">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs text-slate-300">
                <span className="font-bold text-amber-400 block mb-1">Architect Advice:</span>
                <p className="whitespace-pre-wrap">{mentorResult.advice}</p>
              </div>

              {mentorResult.codeSnippet && (
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 font-mono text-xs text-slate-200">
                  <span className="font-bold text-emerald-400 block mb-1">Recommended TypeScript Code:</span>
                  <pre className="whitespace-pre-wrap">{mentorResult.codeSnippet}</pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Add Snippet Modal */}
      {newSnippetModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleAddSnippet}
            className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl"
          >
            <h3 className="font-bold text-lg text-white">Add Playwright Code Snippet</h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Frame Locator Switching"
                  value={newSnippet.title}
                  onChange={(e) => setNewSnippet({ ...newSnippet, title: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                <select
                  value={newSnippet.category}
                  onChange={(e) => setNewSnippet({ ...newSnippet, category: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white"
                >
                  <option value="Locators">Locators</option>
                  <option value="Network">Network / Mocking</option>
                  <option value="Async/Timing">Async / Timing</option>
                  <option value="POM">Page Object Model</option>
                  <option value="Auth">Auth / StorageState</option>
                  <option value="Assertions">Assertions</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Explanation / Best Practice Note</label>
              <input
                type="text"
                placeholder="Brief explanation of when and why to use this pattern..."
                value={newSnippet.explanation}
                onChange={(e) => setNewSnippet({ ...newSnippet, explanation: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">TypeScript Code</label>
              <textarea
                rows={6}
                required
                placeholder="// Playwright code snippet..."
                value={newSnippet.code}
                onChange={(e) => setNewSnippet({ ...newSnippet, code: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Tags (comma-separated)</label>
              <input
                type="text"
                placeholder="e.g. iframe, best-practice, typescript"
                value={newSnippet.tags}
                onChange={(e) => setNewSnippet({ ...newSnippet, tags: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setNewSnippetModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold"
              >
                Save Snippet
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Snippet Modal */}
      {editingSnippet && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleUpdateSnippet}
            className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl"
          >
            <h3 className="font-bold text-lg text-white">Edit Playwright Snippet</h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={editingSnippet.title}
                  onChange={(e) => setEditingSnippet({ ...editingSnippet, title: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                <select
                  value={editingSnippet.category}
                  onChange={(e) => setEditingSnippet({ ...editingSnippet, category: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white"
                >
                  <option value="Locators">Locators</option>
                  <option value="Network">Network / Mocking</option>
                  <option value="Async/Timing">Async / Timing</option>
                  <option value="POM">Page Object Model</option>
                  <option value="Auth">Auth / StorageState</option>
                  <option value="Assertions">Assertions</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Explanation / Best Practice Note</label>
              <input
                type="text"
                value={editingSnippet.explanation}
                onChange={(e) => setEditingSnippet({ ...editingSnippet, explanation: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">TypeScript Code</label>
              <textarea
                rows={6}
                required
                value={editingSnippet.code}
                onChange={(e) => setEditingSnippet({ ...editingSnippet, code: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Tags (comma-separated)</label>
              <input
                type="text"
                value={editingSnippet.tags}
                onChange={(e) => setEditingSnippet({ ...editingSnippet, tags: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingSnippet(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300 font-mono">
              <span>{previewImage}</span>
              <button
                onClick={() => setPreviewImage(null)}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-4 overflow-auto flex items-center justify-center bg-black/50">
              <img src={previewImage} alt="Test Artifact Preview" className="max-w-full max-h-[75vh] object-contain rounded-lg" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default PlaywrightLabDashboard;
