import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  Kanban,
  Table as TableIcon,
  Sparkles,
  FileText,
  Clock,
  ExternalLink,
  Trash2,
  Download,
  AlertCircle,
  Building,
  MapPin,
  CheckCircle2,
  X,
  Upload
} from 'lucide-react';

interface JobApplication {
  id: number;
  company: string;
  title: string;
  location: string;
  salary_range: string;
  url: string;
  stage: string;
  german_level_required: string;
  match_score: number;
  match_analysis: string;
  company_background: string;
  tech_stack: string;
  notes: string;
  applied_at: string;
  last_contact_at: string;
  needsFollowUp?: boolean;
}

const STAGES = [
  'Wishlist',
  'Applied',
  'Screening',
  'Technical',
  'Final',
  'Offer',
  'Rejected',
  'Withdrawn',
];

export const JobHunterDashboard: React.FC = () => {
  const [jobs, setJobs] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedStage, setSelectedStage] = useState('all');
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobApplication | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Form & Extraction state
  const [addMode, setAddMode] = useState<'extract' | 'manual'>('extract');
  const [jobText, setJobText] = useState('');
  const [jobImage, setJobImage] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);

  // Manual Form fields
  const [formFields, setFormFields] = useState({
    company: '',
    title: '',
    location: 'Berlin (Hybrid)',
    salary_range: '',
    url: '',
    stage: 'Wishlist',
    german_level_required: 'B1',
    tech_stack: 'Playwright, TypeScript',
    notes: '',
  });

  // Cover Letter state
  const [generatingCL, setGeneratingCL] = useState(false);
  const [coverLetterText, setCoverLetterText] = useState<string | null>(null);

  // Timeline Notes state
  const [timelineNotes, setTimelineNotes] = useState<Array<{ id: number; note: string; note_type: string; created_at: string }>>([]);
  const [newNoteText, setNewNoteText] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  const fetchTimelineNotes = async (jobId: number) => {
    try {
      const res = await fetch(`/api/jobs/${jobId}/notes`);
      const data = await res.json();
      setTimelineNotes(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddTimelineNote = async (jobId: number) => {
    if (!newNoteText.trim()) return;
    try {
      setAddingNote(true);
      await fetch(`/api/jobs/${jobId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: newNoteText, note_type: 'Interaction' }),
      });
      setNewNoteText('');
      fetchTimelineNotes(jobId);
      fetchJobs();
    } catch (e) {
      console.error(e);
    } finally {
      setAddingNote(false);
    }
  };

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/jobs?search=${encodeURIComponent(search)}&stage=${selectedStage}`);
      const data = await res.json();
      setJobs(data);
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [search, selectedStage]);

  // Handle stage change
  const handleStageChange = async (jobId: number, newStage: string) => {
    try {
      await fetch(`/api/jobs/${jobId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage: newStage,
          applied_at: newStage === 'Applied' ? new Date().toISOString() : undefined,
        }),
      });
      fetchJobs();
    } catch (err) {
      console.error('Failed to update stage:', err);
    }
  };

  // Handle delete
  const handleDeleteJob = async (jobId: number) => {
    if (!confirm('Are you sure you want to delete this job application?')) return;
    try {
      await fetch(`/api/jobs/${jobId}`, { method: 'DELETE' });
      fetchJobs();
      if (selectedJob?.id === jobId) setIsDetailModalOpen(false);
    } catch (err) {
      console.error('Failed to delete job:', err);
    }
  };

  // Handle Gemini Extraction
  const handleExtractJob = async () => {
    if (!jobText && !jobImage) {
      alert('Please provide a job posting text/URL or upload a screenshot.');
      return;
    }
    try {
      setIsExtracting(true);
      const res = await fetch('/api/jobs/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: jobText,
          imageBase64: jobImage ? jobImage.split(',')[1] : undefined,
          mimeType: 'image/png',
        }),
      });
      const data = await res.json();

      setFormFields({
        company: data.company || '',
        title: data.title || '',
        location: data.location || 'Berlin',
        salary_range: data.salary_range || '',
        url: '',
        stage: 'Wishlist',
        german_level_required: data.german_level_required || 'B1',
        tech_stack: data.tech_stack || '',
        notes: data.company_background || '',
      });
      setAddMode('manual');
    } catch (err) {
      console.error('Extraction error:', err);
      alert('Failed to analyze job description.');
    } finally {
      setIsExtracting(false);
    }
  };

  // Handle image file input
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setJobImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Submit new job
  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formFields),
      });
      setIsAddModalOpen(false);
      setJobText('');
      setJobImage(null);
      fetchJobs();
    } catch (err) {
      console.error('Failed to create job:', err);
    }
  };

  // Generate tailored cover letter
  const handleGenerateCoverLetter = async (jobId: number) => {
    try {
      setGeneratingCL(true);
      const res = await fetch(`/api/jobs/${jobId}/cover-letter`, { method: 'POST' });
      const data = await res.json();
      setCoverLetterText(data.content_markdown);
    } catch (err) {
      console.error('Failed to generate cover letter:', err);
    } finally {
      setGeneratingCL(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Job Hunting Hub
            <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-indigo-950 text-indigo-300 border border-indigo-800">
              Berlin QA Engine
            </span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Track applications, analyze CV matches, detect German language levels, and tailor PDF cover letters.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-1 flex">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition ${
                viewMode === 'kanban' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Kanban size={15} />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition ${
                viewMode === 'table' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TableIcon size={15} />
              <span>Table</span>
            </button>
          </div>

          <button
            onClick={() => {
              setAddMode('extract');
              setIsAddModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition"
          >
            <Plus size={16} />
            <span>Add Job</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search company, job title, Playwright, TypeScript..."
            className="w-full pl-9 pr-4 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={15} className="text-slate-500" />
          <select
            value={selectedStage}
            onChange={(e) => setSelectedStage(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">All Stages</option>
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main View: Kanban or Table */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto pb-4">
          {STAGES.map((stage) => {
            const stageJobs = jobs.filter((j) => j.stage === stage);
            return (
              <div
                key={stage}
                className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-3 flex flex-col min-h-[450px]"
              >
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800/80">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    {stage}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                    {stageJobs.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto">
                  {stageJobs.map((job) => (
                    <div
                      key={job.id}
                      onClick={() => {
                        setSelectedJob(job);
                        setCoverLetterText(null);
                        fetchTimelineNotes(job.id);
                        setIsDetailModalOpen(true);
                      }}
                      className="bg-slate-950 border border-slate-800/90 hover:border-slate-700 p-3.5 rounded-xl cursor-pointer hover:shadow-lg transition group"
                    >
                      {/* Follow-up reminder banner */}
                      {job.needsFollowUp && (
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-400 bg-amber-950/40 border border-amber-900/60 rounded-md px-2 py-1 mb-2">
                          <AlertCircle size={13} />
                          <span>Follow up required (&gt;7 days)</span>
                        </div>
                      )}

                      <div className="flex items-start justify-between">
                        <h4 className="font-semibold text-sm text-slate-100 group-hover:text-indigo-400 transition leading-snug line-clamp-1">
                          {job.title}
                        </h4>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                        <Building size={13} className="text-slate-500" />
                        <span className="font-medium text-slate-300">{job.company}</span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                        <MapPin size={13} className="text-slate-600" />
                        <span>{job.location}</span>
                      </div>

                      {/* Badges */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-2 border-t border-slate-900">
                        {job.match_score > 0 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/70 text-emerald-400 border border-emerald-800/50">
                            {job.match_score}% Fit
                          </span>
                        )}
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-900 text-indigo-300 border border-slate-800">
                          {job.german_level_required || 'German B1'}
                        </span>
                      </div>
                    </div>
                  ))}

                  {stageJobs.length === 0 && (
                    <div className="h-24 flex items-center justify-center text-xs text-slate-600 border border-dashed border-slate-800/60 rounded-lg">
                      No applications
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950 text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Company & Role</th>
                  <th className="p-3.5">Location</th>
                  <th className="p-3.5">Stage</th>
                  <th className="p-3.5">German Level</th>
                  <th className="p-3.5">Match Score</th>
                  <th className="p-3.5">Alerts</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {jobs.map((job) => (
                  <tr
                    key={job.id}
                    className="hover:bg-slate-800/40 transition cursor-pointer"
                    onClick={() => {
                      setSelectedJob(job);
                      setCoverLetterText(null);
                      fetchTimelineNotes(job.id);
                      setIsDetailModalOpen(true);
                    }}
                  >
                    <td className="p-3.5">
                      <div className="font-semibold text-slate-100">{job.title}</div>
                      <div className="text-xs text-slate-400 font-medium">{job.company}</div>
                    </td>
                    <td className="p-3.5 text-xs text-slate-400">{job.location}</td>
                    <td className="p-3.5" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={job.stage}
                        onChange={(e) => handleStageChange(job.id, e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300 focus:outline-none"
                      >
                        {STAGES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-3.5">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-900 text-indigo-300 border border-slate-800">
                        {job.german_level_required || 'B1'}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className="text-xs font-bold text-emerald-400">
                        {job.match_score ? `${job.match_score}%` : 'N/A'}
                      </span>
                    </td>
                    <td className="p-3.5">
                      {job.needsFollowUp && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-950/60 border border-amber-900 px-2 py-0.5 rounded-full">
                          <AlertCircle size={12} />
                          &gt;7d
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleDeleteJob(job.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 transition"
                        title="Delete application"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Job Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 space-y-4 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <Sparkles size={18} className="text-indigo-400" />
                Add New Job Application
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X size={20} />
              </button>
            </div>

            {/* Mode switch */}
            <div className="flex border-b border-slate-800">
              <button
                onClick={() => setAddMode('extract')}
                className={`px-4 py-2 text-xs font-semibold border-b-2 transition ${
                  addMode === 'extract'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Gemini AI Ingestion (Text, URL or Screenshot)
              </button>
              <button
                onClick={() => setAddMode('manual')}
                className={`px-4 py-2 text-xs font-semibold border-b-2 transition ${
                  addMode === 'manual'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Manual Fields
              </button>
            </div>

            {addMode === 'extract' ? (
              <div className="space-y-4 pt-2">
                <p className="text-xs text-slate-400">
                  Drop a job link, paste raw description, or upload a screenshot. Gemini will extract requirements, company info, and German level criteria.
                </p>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Job Description Text or URL:
                  </label>
                  <textarea
                    rows={5}
                    value={jobText}
                    onChange={(e) => setJobText(e.target.value)}
                    placeholder="Paste job posting text from StepStone, LinkedIn, or Indeed Germany..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Or Upload Screenshot:
                  </label>
                  <div className="border-2 border-dashed border-slate-800 rounded-xl p-4 text-center hover:border-slate-700 transition">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="screenshot-input"
                    />
                    <label htmlFor="screenshot-input" className="cursor-pointer flex flex-col items-center gap-2">
                      <Upload size={24} className="text-indigo-400" />
                      <span className="text-xs text-slate-300 font-medium">
                        {jobImage ? 'Screenshot Loaded! Click to change' : 'Select PNG/JPG Screenshot'}
                      </span>
                    </label>
                  </div>
                  {jobImage && (
                    <img
                      src={jobImage}
                      alt="Job preview"
                      className="h-28 mt-2 rounded-lg border border-slate-800 object-cover"
                    />
                  )}
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleExtractJob}
                    disabled={isExtracting}
                    className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold flex items-center gap-2 transition disabled:opacity-50 shadow-lg shadow-indigo-600/20"
                  >
                    <Sparkles size={16} />
                    <span>{isExtracting ? 'Analyzing with Gemini...' : 'Analyze & Extract Fields'}</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Manual form */
              <form onSubmit={handleCreateJob} className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Company</label>
                    <input
                      type="text"
                      required
                      value={formFields.company}
                      onChange={(e) => setFormFields({ ...formFields, company: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Job Title</label>
                    <input
                      type="text"
                      required
                      value={formFields.title}
                      onChange={(e) => setFormFields({ ...formFields, title: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-sm text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Location</label>
                    <input
                      type="text"
                      value={formFields.location}
                      onChange={(e) => setFormFields({ ...formFields, location: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Salary Range</label>
                    <input
                      type="text"
                      placeholder="e.g. €65k - €78k"
                      value={formFields.salary_range}
                      onChange={(e) => setFormFields({ ...formFields, salary_range: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">German Level</label>
                    <select
                      value={formFields.german_level_required}
                      onChange={(e) => setFormFields({ ...formFields, german_level_required: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-sm text-white"
                    >
                      <option value="English only">English only</option>
                      <option value="B1">B1 (Conversational)</option>
                      <option value="B2">B2 (Fluent)</option>
                      <option value="C1">C1 (Professional)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Tech Stack</label>
                    <input
                      type="text"
                      value={formFields.tech_stack}
                      onChange={(e) => setFormFields({ ...formFields, tech_stack: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Pipeline Stage</label>
                    <select
                      value={formFields.stage}
                      onChange={(e) => setFormFields({ ...formFields, stage: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-sm text-white"
                    >
                      {STAGES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Company Intel & Notes</label>
                  <textarea
                    rows={3}
                    value={formFields.notes}
                    onChange={(e) => setFormFields({ ...formFields, notes: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-sm text-white"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/20"
                  >
                    Save Application
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Detail & Cover Letter Modal */}
      {isDetailModalOpen && selectedJob && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-3xl p-6 space-y-5 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-xl text-white">{selectedJob.title}</h3>
                <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                  <span className="font-semibold text-indigo-400">{selectedJob.company}</span>
                  <span>•</span>
                  <span>{selectedJob.location}</span>
                  <span>•</span>
                  <span className="text-emerald-400 font-semibold">{selectedJob.salary_range || 'Competitive'}</span>
                </div>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X size={20} />
              </button>
            </div>

            {/* Stage Selector */}
            <div className="flex items-center justify-between bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <span className="text-xs font-semibold text-slate-300">Application Pipeline Stage:</span>
              <select
                value={selectedJob.stage}
                onChange={(e) => {
                  handleStageChange(selectedJob.id, e.target.value);
                  setSelectedJob({ ...selectedJob, stage: e.target.value });
                }}
                className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
              >
                {STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* AI Fit & German Breakdown */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-300">CV Fit Score</span>
                  <span className="text-sm font-bold text-emerald-400">
                    {selectedJob.match_score ? `${selectedJob.match_score}%` : '85%'}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Strong alignment with Playwright, TypeScript, and end-to-end testing practices.
                </p>
              </div>

              <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-300">German Level Required</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800">
                    {selectedJob.german_level_required || 'B1'}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Suitable for Chancenkarte B1 candidate with technical QA vocabulary.
                </p>
              </div>
            </div>

            {/* Notes & Intel */}
            {selectedJob.notes && (
              <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-3.5">
                <span className="text-xs font-bold text-slate-300 block mb-1">Company Intel & Overview</span>
                <p className="text-xs text-slate-400 whitespace-pre-wrap">{selectedJob.notes}</p>
              </div>
            )}

            {/* Activity & Follow-up Timeline */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-3.5 space-y-3">
              <span className="text-xs font-bold text-slate-300 block">Activity &amp; Follow-up History Log</span>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add note: e.g. Sent email follow-up, HR called, Interview set for Thursday..."
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTimelineNote(selectedJob.id);
                    }
                  }}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => handleAddTimelineNote(selectedJob.id)}
                  disabled={addingNote || !newNoteText.trim()}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold disabled:opacity-50 transition"
                >
                  {addingNote ? 'Saving...' : 'Add Note'}
                </button>
              </div>

              {timelineNotes.length > 0 ? (
                <div className="space-y-2 max-h-40 overflow-y-auto pt-1">
                  {timelineNotes.map((tn) => (
                    <div key={tn.id} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 text-xs flex items-start justify-between gap-3">
                      <p className="text-slate-200">{tn.note}</p>
                      <span className="text-[10px] text-slate-500 shrink-0 font-mono">
                        {new Date(tn.created_at).toLocaleDateString()} {new Date(tn.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-slate-500 italic">No notes recorded yet. Add interview milestones or follow-up notes above.</p>
              )}
            </div>

            {/* Cover Letter Section */}
            <div className="border-t border-slate-800 pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                    <FileText size={16} className="text-indigo-400" />
                    Customized PDF Cover Letter
                  </h4>
                  <p className="text-xs text-slate-400">
                    Tailored using your master CV and sample cover letter layout.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleGenerateCoverLetter(selectedJob.id)}
                    disabled={generatingCL}
                    className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
                  >
                    <Sparkles size={14} />
                    <span>{generatingCL ? 'Generating...' : 'Generate with Gemini'}</span>
                  </button>

                  <a
                    href={`/api/jobs/${selectedJob.id}/cover-letter/pdf`}
                    download
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <Download size={14} />
                    <span>Download PDF</span>
                  </a>
                </div>
              </div>

              {coverLetterText && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 max-h-60 overflow-y-auto">
                  <pre className="text-xs text-slate-300 whitespace-pre-wrap font-sans">
                    {coverLetterText}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-800">
              <button
                onClick={() => handleDeleteJob(selectedJob.id)}
                className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1"
              >
                <Trash2 size={14} />
                <span>Delete Application</span>
              </button>

              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default JobHunterDashboard;
