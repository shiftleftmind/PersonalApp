import React, { useState, useEffect } from 'react';
import {
  Save,
  FileText,
  CheckCircle,
  Sparkles,
  Key,
  Upload,
  Download,
  AlertCircle,
  Eye,
  EyeOff,
  ExternalLink,
  Copy,
  Check,
  FolderOpen
} from 'lucide-react';

interface SettingsStatus {
  has_pdf: boolean;
  filename: string | null;
  filesize: number | null;
  updated_at: string | null;
  cover_letter_template?: string;
  reference_folder_path?: string;
  gemini: {
    status: string;
    message: string;
  };
}

export const SettingsDashboard: React.FC = () => {
  // Gemini API Key State
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [savingKey, setSavingKey] = useState(false);
  const [keyStatus, setKeyStatus] = useState<{ status: string; message: string } | null>(null);

  // PDF CV State
  const [selectedPdfFile, setSelectedPdfFile] = useState<File | null>(null);
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [settingsStatus, setSettingsStatus] = useState<SettingsStatus | null>(null);

  // Cover letter template state
  const [templateText, setTemplateText] = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateSavedMsg, setTemplateSavedMsg] = useState(false);

  // Copy path state
  const [copiedPath, setCopiedPath] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/jobs/settings/status');
      const data = await res.json();
      setSettingsStatus(data);
      if (data.cover_letter_template) {
        setTemplateText(data.cover_letter_template);
      }
      if (data.gemini) {
        setKeyStatus(data.gemini);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  // Handle Save Gemini API Key
  const handleSaveApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) return;
    try {
      setSavingKey(true);
      const res = await fetch('/api/jobs/settings/gemini-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey }),
      });
      const data = await res.json();
      setKeyStatus({
        status: data.status,
        message: data.message,
      });
      fetchStatus();
    } catch (e: any) {
      setKeyStatus({ status: 'error', message: e.message });
    } finally {
      setSavingKey(false);
    }
  };

  // Handle Save Cover Letter Template
  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingTemplate(true);
      await fetch('/api/jobs/settings/template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template: templateText }),
      });
      setTemplateSavedMsg(true);
      setTimeout(() => setTemplateSavedMsg(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setSavingTemplate(false);
    }
  };

  // Handle PDF file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        alert('Please select a valid PDF file.');
        return;
      }
      setSelectedPdfFile(file);
    }
  };

  // Upload PDF CV
  const handleUploadPdf = async () => {
    if (!selectedPdfFile) return;
    try {
      setIsUploadingPdf(true);
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        const res = await fetch('/api/jobs/settings/cv-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pdfBase64: base64Data,
            filename: selectedPdfFile.name,
            filesize: selectedPdfFile.size,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setSelectedPdfFile(null);
          fetchStatus();
        }
      };
      reader.readAsDataURL(selectedPdfFile);
    } catch (e) {
      console.error(e);
    } finally {
      setIsUploadingPdf(false);
    }
  };

  const handleCopyFolder = () => {
    const pathText = settingsStatus?.reference_folder_path || 'reference_materials';
    navigator.clipboard.writeText(pathText);
    setCopiedPath(true);
    setTimeout(() => setCopiedPath(false), 2500);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white">System Settings &amp; Materials</h2>
        <p className="text-sm text-slate-400 mt-1">
          Manage your Gemini AI key, reference materials folder, master CV, and sample cover letter layout.
        </p>
      </div>

      {/* 1. Reference Materials Directory Notice */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <FolderOpen size={18} className="text-indigo-400" />
            <h3 className="font-bold text-base text-white">Reference Materials Directory</h3>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-indigo-950 text-indigo-300 border border-indigo-800">
            Local File System
          </span>
        </div>

        <p className="text-xs text-slate-400">
          For large textbook PDFs (e.g. <code>schritte-a11-2.pdf</code>), CVs, or offline files, copy them directly into this folder on your machine:
        </p>

        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
          <span className="font-mono text-xs text-emerald-400 truncate select-all">
            {settingsStatus?.reference_folder_path || 'reference_materials'}
          </span>
          <button
            onClick={handleCopyFolder}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 shrink-0 transition"
          >
            {copiedPath ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            <span>{copiedPath ? 'Copied Path!' : 'Copy Path'}</span>
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-slate-400 pt-1">
          <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
            <span className="font-bold text-slate-200 block">/cv</span>
            <span className="text-[11px] text-slate-500">PDF Resumes</span>
          </div>
          <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
            <span className="font-bold text-slate-200 block">/cover_letter</span>
            <span className="text-[11px] text-slate-500">Reference Templates</span>
          </div>
          <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
            <span className="font-bold text-slate-200 block">/textbook</span>
            <span className="text-[11px] text-slate-500">Schritte PLUS NEU</span>
          </div>
          <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
            <span className="font-bold text-slate-200 block">/cheatsheets</span>
            <span className="text-[11px] text-slate-500">Playwright Notes</span>
          </div>
        </div>
      </div>

      {/* 2. Cover Letter Reference Template Editor */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-emerald-400" />
            <h3 className="font-bold text-base text-white">Reference Cover Letter Template</h3>
          </div>
          {templateSavedMsg && (
            <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1">
              <CheckCircle size={13} />
              <span>Template Saved!</span>
            </span>
          )}
        </div>

        <p className="text-xs text-slate-400">
          This template defines the layout, personal contact block, and tone for all tailored PDF cover letters generated by the system.
        </p>

        <form onSubmit={handleSaveTemplate} className="space-y-3">
          <textarea
            rows={12}
            value={templateText}
            onChange={(e) => setTemplateText(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingTemplate}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition disabled:opacity-50"
            >
              <Save size={14} />
              <span>{savingTemplate ? 'Saving Template...' : 'Save Reference Template'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* 3. Google Gemini API Key Section */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Key size={18} className="text-amber-400" />
            <h3 className="font-bold text-base text-white">Google Gemini API Configuration</h3>
          </div>
          {keyStatus && (
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-semibold flex items-center gap-1.5 ${
                keyStatus.status === 'connected'
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  : 'bg-amber-950 text-amber-300 border border-amber-800'
              }`}
            >
              <Sparkles size={13} />
              <span>
                {keyStatus.status === 'connected' ? 'Gemini API Connected' : 'Free Fallback Active'}
              </span>
            </span>
          )}
        </div>

        <p className="text-xs text-slate-400">
          Enter your Google Gemini API key from Google AI Studio. It powers multimodal job parsing, CV match scoring, and tailored cover letters.
        </p>

        <form onSubmit={handleSaveApiKey} className="space-y-3">
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Paste your GEMINI_API_KEY (e.g. AIzaSy...)"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-4 pr-10 py-2.5 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <div className="flex items-center justify-between pt-1">
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-amber-400 hover:underline flex items-center gap-1"
            >
              <span>Get a 100% Free Gemini API Key from Google AI Studio</span>
              <ExternalLink size={12} />
            </a>

            <button
              type="submit"
              disabled={savingKey || !apiKey.trim()}
              className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-amber-600/20 transition disabled:opacity-50"
            >
              <Sparkles size={14} />
              <span>{savingKey ? 'Verifying Key...' : 'Save & Test API Key'}</span>
            </button>
          </div>

          {keyStatus && (
            <div
              className={`p-3 rounded-xl border text-xs ${
                keyStatus.status === 'connected'
                  ? 'bg-emerald-950/40 border-emerald-900/60 text-emerald-300'
                  : 'bg-slate-950 border-slate-800 text-slate-300'
              }`}
            >
              <span className="font-semibold block mb-0.5">Connection Status:</span>
              <p>{keyStatus.message}</p>
            </div>
          )}
        </form>
      </div>

      {/* 4. Master CV in PDF Format Section */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-indigo-400" />
            <h3 className="font-bold text-base text-white">Master CV (PDF Format)</h3>
          </div>
          {settingsStatus?.has_pdf && (
            <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1">
              <CheckCircle size={13} />
              <span>PDF CV Active</span>
            </span>
          )}
        </div>

        <p className="text-xs text-slate-400">
          Upload your Resume / CV directly as a <strong>PDF file</strong>. Gemini natively ingests your PDF document layout to compare requirements and tailor applications.
        </p>

        {settingsStatus?.has_pdf ? (
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-950 text-indigo-400 flex items-center justify-center font-bold text-xs border border-indigo-800">
                PDF
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">{settingsStatus.filename}</h4>
                <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                  <span>{(settingsStatus.filesize ? settingsStatus.filesize / 1024 : 0).toFixed(1)} KB</span>
                  <span>•</span>
                  <span>
                    Uploaded {new Date(settingsStatus.updated_at || '').toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href="/api/jobs/settings/cv-pdf"
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Download size={14} />
                <span>Download / View PDF</span>
              </a>

              <label
                htmlFor="pdf-upload-replace"
                className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition shadow-md shadow-indigo-600/20"
              >
                <Upload size={14} />
                <span>Replace PDF</span>
              </label>
              <input
                id="pdf-upload-replace"
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>
        ) : (
          <div className="border-2 border-dashed border-slate-800 hover:border-indigo-500/70 rounded-2xl p-8 text-center transition">
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              id="pdf-upload-input"
              className="hidden"
            />
            <label htmlFor="pdf-upload-input" className="cursor-pointer flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-indigo-950/80 text-indigo-400 flex items-center justify-center border border-indigo-800/80">
                <Upload size={22} />
              </div>
              <div>
                <span className="text-sm font-bold text-white block">
                  Click to select your CV (PDF)
                </span>
                <span className="text-xs text-slate-500">
                  Select your existing resume in PDF format (up to 15MB)
                </span>
              </div>
            </label>
          </div>
        )}

        {selectedPdfFile && (
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText size={18} className="text-emerald-400" />
              <span className="text-xs text-white font-semibold">{selectedPdfFile.name}</span>
              <span className="text-[11px] text-slate-500">
                ({(selectedPdfFile.size / 1024).toFixed(1)} KB)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedPdfFile(null)}
                className="px-3 py-1 rounded-lg text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUploadPdf}
                disabled={isUploadingPdf}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Upload size={14} />
                <span>{isUploadingPdf ? 'Uploading...' : 'Save & Link PDF'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default SettingsDashboard;
