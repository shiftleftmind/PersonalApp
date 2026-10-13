import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Volume2,
  Mic,
  RotateCw,
  Sparkles,
  Award,
  AlertTriangle,
  CheckCircle,
  Clock,
  Layers,
  ChevronRight,
  Languages,
  Plus,
  Play,
  FileText,
  Check,
  X,
  RotateCcw,
  HelpCircle
} from 'lucide-react';
import { useSpeech } from '../../hooks/useSpeech';

interface AlphabetItem {
  id: number;
  letter: string;
  name_de: string;
  phonetic_en: string;
  phonetic_gu: string;
  example_word: string;
  example_en: string;
  example_gu: string;
  category: string;
  audio_text: string;
}

interface VocabItem {
  id: number;
  german: string;
  article: string;
  plural: string;
  english: string;
  gujarati?: string;
  cefr_level: string;
  category: string;
  example_sentence: string;
  srs_level: number;
}

interface ErrorLogItem {
  id: number;
  wrong_sentence: string;
  corrected_sentence: string;
  grammar_rule: string;
  explanation_en: string;
  explanation_gu: string;
  srs_level: number;
  next_review_at: string;
}

export const GermanLearningDashboard: React.FC = () => {
  const [activeSection, setActiveSection] = useState<
    'alphabets' | 'vocab' | 'grammar' | 'qa-drills' | 'skills' | 'error-log' | 'mock-exam' | 'overview'
  >('alphabets');

  const { speakGerman, startListening, isListening, transcript } = useSpeech();

  // Alphabet & Phonetics State (A0 Foundation)
  const [alphabetsList, setAlphabetsList] = useState<AlphabetItem[]>([]);
  const [alphaCategory, setAlphaCategory] = useState<string>('all');
  const [alphaLang, setAlphaLang] = useState<'en' | 'gu'>('gu');

  // Vocab State
  const [vocabList, setVocabList] = useState<VocabItem[]>([]);
  const [currentVocabIndex, setCurrentVocabIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [newWordModal, setNewWordModal] = useState(false);
  const [newWord, setNewWord] = useState({
    german: '',
    article: 'der',
    plural: '',
    english: '',
    gujarati: '',
    cefr_level: 'A1',
    category: 'IT/QA',
    example_sentence: '',
  });

  // Error Log State
  const [errorLogs, setErrorLogs] = useState<ErrorLogItem[]>([]);
  const [errorLang, setErrorLang] = useState<'en' | 'gu'>('gu');

  // Grammar Explainer State
  const [selectedGrammar, setSelectedGrammar] = useState('V2 Word Order (Hauptsatz)');
  const [grammarLang, setGrammarLang] = useState<'en' | 'gu'>('gu');
  const [grammarExplanation, setGrammarExplanation] = useState<string>('');
  const [loadingGrammar, setLoadingGrammar] = useState(false);

  // Mock Exam State
  const [examPrompt, setExamPrompt] = useState(
    'Sie haben eine Einladung zu einem Vorstellungsgespräch als QA Test Engineer erhalten. Schreiben Sie eine formelle Antwort (Zusage, Dank, Frage zu den technischen Aufgaben).'
  );
  const [examSubmission, setExamSubmission] = useState('');
  const [isGrading, setIsGrading] = useState(false);
  const [examResult, setExamResult] = useState<any>(null);

  // Scanned textbook files
  const [textbookInfo, setTextbookInfo] = useState<{ folderPath: string; files: any[] } | null>(null);

  // 4-Skill Practice States
  const [activeSkillTab, setActiveSkillTab] = useState<'speaking' | 'listening' | 'reading' | 'writing'>('listening');
  const [listeningIndex, setListeningIndex] = useState(0);
  const [listeningSelectedOption, setListeningSelectedOption] = useState<number | null>(null);
  const [listeningFeedback, setListeningFeedback] = useState<{ isCorrect: boolean; text: string } | null>(null);
  const [readingAnswers, setReadingAnswers] = useState<{ [qId: number]: number }>({});
  const [readingSubmitted, setReadingSubmitted] = useState(false);
  const [writingAnswer, setWritingAnswer] = useState<string>('');
  const [writingFeedback, setWritingFeedback] = useState<{ isCorrect: boolean; text: string } | null>(null);

  // Active Recall Quiz States
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [quizCurrentIdx, setQuizCurrentIdx] = useState(0);
  const [quizRevealed, setQuizRevealed] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  // Log mistake to database
  const logMistake = async (
    wrong_sentence: string,
    corrected_sentence: string,
    grammar_rule: string,
    explanation_en: string,
    explanation_gu: string
  ) => {
    try {
      await fetch('/api/german/error-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wrong_sentence,
          corrected_sentence,
          grammar_rule,
          explanation_en,
          explanation_gu,
        }),
      });
      fetchErrorLog();
    } catch (err) {
      console.error('Failed to auto-log mistake:', err);
    }
  };

  // Review Error Log Item and update SRS level
  const handleReviewError = async (id: number, rating: 'good' | 'again') => {
    try {
      const res = await fetch(`/api/german/error-log/${id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating }),
      });
      const data = await res.json();
      setErrorLogs((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, srs_level: data.srs_level, next_review_at: data.next_review_at } : item
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch Alphabets
  const fetchAlphabets = async () => {
    try {
      const res = await fetch('/api/german/alphabets');
      const data = await res.json();
      setAlphabetsList(data);
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch Vocab & Errors
  const fetchVocab = async () => {
    try {
      const res = await fetch('/api/german/vocab');
      const data = await res.json();
      setVocabList(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchErrorLog = async () => {
    try {
      const res = await fetch('/api/german/error-log');
      const data = await res.json();
      setErrorLogs(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTextbookFiles = async () => {
    try {
      const res = await fetch('/api/german/textbook-files');
      const data = await res.json();
      setTextbookInfo(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchAlphabets();
    fetchVocab();
    fetchErrorLog();
    fetchTextbookFiles();
  }, []);

  // Fetch grammar explanation
  const fetchGrammarExplanation = async (concept: string, lang: 'en' | 'gu') => {
    try {
      setLoadingGrammar(true);
      const res = await fetch('/api/german/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ concept, language: lang }),
      });
      const data = await res.json();
      setGrammarExplanation(data.explanation);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingGrammar(false);
    }
  };

  useEffect(() => {
    if (activeSection === 'grammar') {
      fetchGrammarExplanation(selectedGrammar, grammarLang);
    }
  }, [activeSection, selectedGrammar, grammarLang]);

  // Handle Review SRS
  const handleReviewVocab = async (rating: string) => {
    if (vocabList.length === 0) return;
    const current = vocabList[currentVocabIndex];
    try {
      await fetch(`/api/german/vocab/${current.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating }),
      });
      setIsFlipped(false);
      setCurrentVocabIndex((prev) => (prev + 1) % vocabList.length);
    } catch (e) {
      console.error(e);
    }
  };

  // Add new word
  const handleAddWord = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/german/vocab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newWord),
      });
      setNewWordModal(false);
      fetchVocab();
    } catch (e) {
      console.error(e);
    }
  };

  // Grade Mock Exam
  const handleGradeExam = async () => {
    if (!examSubmission.trim()) {
      alert('Please enter your written submission.');
      return;
    }
    try {
      setIsGrading(true);
      const res = await fetch('/api/german/grade-exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: examPrompt, submission: examSubmission }),
      });
      const data = await res.json();
      setExamResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGrading(false);
    }
  };

  const currentCard = vocabList[currentVocabIndex];

  const filteredAlphabets = alphabetsList.filter((item) => {
    if (alphaCategory === 'all') return true;
    return item.category === alphaCategory;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            German Learning Hub (A0 ➔ B1)
            <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-emerald-950 text-emerald-300 border border-emerald-800">
              Goethe-Zertifikat B1
            </span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Learn German from the alphabets up to B1. Authentic dual-language explanations (English &amp; ગુજરાતી).
          </p>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto bg-slate-900 border border-slate-800 p-1.5 rounded-xl">
          {[
            { id: 'alphabets', label: '1. Alphabet & Phonetics (A0)' },
            { id: 'vocab', label: '2. Flashcards (SRS)' },
            { id: 'grammar', label: '3. Grammar (Dual-Lang)' },
            { id: 'qa-drills', label: '4. QA / Testing Drills' },
            { id: 'skills', label: '5. 4-Skill Practice' },
            { id: 'error-log', label: '6. Error Log' },
            { id: 'mock-exam', label: '7. Goethe B1 Mock Exam' },
            { id: 'overview', label: 'Roadmap & Textbook' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                activeSection === tab.id
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 1. Alphabet & Pronunciation Section (Stage 0 Foundation) */}
      {activeSection === 'alphabets' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Sparkles size={18} className="text-amber-400" />
                German Alphabet &amp; Phonetics Guide (Stage 0: A0 Foundation)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Learn every German letter, Umlaut, and phonetic combination with authentic pronunciation and Gujarati/English guides.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Category Filter */}
              <select
                value={alphaCategory}
                onChange={(e) => setAlphaCategory(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
              >
                <option value="all">All Letters &amp; Sounds ({alphabetsList.length})</option>
                <option value="Alphabet">Alphabet A-Z (26)</option>
                <option value="Umlaut">Umlaute &amp; ß (4)</option>
                <option value="Diphthong">Diphthongs: ei, ie, eu (3)</option>
                <option value="Phonics">Phonics: ch, sch, sp, st (3)</option>
              </select>

              {/* Language Toggle for Phonetic Explanations */}
              <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-1">
                <button
                  onClick={() => setAlphaLang('gu')}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                    alphaLang === 'gu' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  ગુજરાતી
                </button>
                <button
                  onClick={() => setAlphaLang('en')}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                    alphaLang === 'en' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  English
                </button>
              </div>
            </div>
          </div>

          {/* Letter Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredAlphabets.map((item) => (
              <div
                key={item.id}
                className="bg-slate-900 border border-slate-800 hover:border-emerald-500/60 rounded-2xl p-4 flex flex-col justify-between space-y-3 transition group shadow-sm hover:shadow-lg"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-3xl font-extrabold text-white tracking-wide">{item.letter}</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-emerald-400 ml-2">
                      {item.name_de}
                    </span>
                  </div>

                  <button
                    onClick={() => speakGerman(item.audio_text)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white transition shadow"
                    title="Pronounce Letter & Word"
                  >
                    <Volume2 size={16} />
                  </button>
                </div>

                <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">
                    {alphaLang === 'gu' ? 'ઉચ્ચાર માર્ગદર્શન' : 'Pronunciation Guide'}
                  </span>
                  <p className="text-xs font-medium text-amber-300">
                    {alphaLang === 'gu' ? item.phonetic_gu : item.phonetic_en}
                  </p>
                </div>

                <div className="border-t border-slate-800/80 pt-2 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-200 block">{item.example_word}</span>
                    <span className="text-[11px] text-slate-400">
                      {alphaLang === 'gu' ? item.example_gu : item.example_en}
                    </span>
                  </div>
                  <button
                    onClick={() => speakGerman(item.example_word)}
                    className="text-emerald-400 hover:text-emerald-300 p-1 rounded"
                    title="Pronounce word"
                  >
                    <Play size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Vocabulary & Flashcard Section */}
      {activeSection === 'vocab' && (
        <div className="max-w-2xl mx-auto space-y-6 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              Word {vocabList.length > 0 ? currentVocabIndex + 1 : 0} of {vocabList.length}
            </span>
            <button
              onClick={() => setNewWordModal(true)}
              className="px-3 py-1.5 rounded-lg bg-emerald-600/80 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>Add Word</span>
            </button>
          </div>

          {currentCard ? (
            <div className="space-y-4">
              <div
                onClick={() => setIsFlipped(!isFlipped)}
                className={`min-h-[290px] bg-slate-900 border-2 rounded-2xl p-8 flex flex-col justify-between items-center text-center cursor-pointer transition shadow-2xl relative select-none ${
                  currentCard.article === 'der'
                    ? 'border-blue-500/50 hover:border-blue-400'
                    : currentCard.article === 'die'
                    ? 'border-rose-500/50 hover:border-rose-400'
                    : 'border-emerald-500/50 hover:border-emerald-400'
                }`}
              >
                <div className="w-full flex items-center justify-between text-xs text-slate-400">
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold">
                    {currentCard.cefr_level}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                    {currentCard.category}
                  </span>
                </div>

                {!isFlipped ? (
                  /* Front of Flashcard */
                  <div className="space-y-3">
                    <div className="flex items-center justify-center gap-2">
                      <span
                        className={`text-lg font-bold uppercase tracking-wider ${
                          currentCard.article === 'der'
                            ? 'text-blue-400'
                            : currentCard.article === 'die'
                            ? 'text-rose-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {currentCard.article}
                      </span>
                      <h3 className="text-4xl font-extrabold text-white">{currentCard.german}</h3>
                    </div>
                    {currentCard.plural && (
                      <p className="text-xs text-slate-400 font-medium">Plural: {currentCard.plural}</p>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        speakGerman(`${currentCard.article} ${currentCard.german}`);
                      }}
                      className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 bg-slate-800 px-3 py-1 rounded-full mt-2"
                    >
                      <Volume2 size={14} />
                      <span>Listen Pronunciation</span>
                    </button>
                  </div>
                ) : (
                  /* Back of Flashcard (English + Gujarati) */
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-white">{currentCard.english}</h3>
                    {currentCard.gujarati && (
                      <div className="text-xl font-bold text-amber-300">
                        {currentCard.gujarati}
                      </div>
                    )}
                    {currentCard.example_sentence && (
                      <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 mt-2">
                        <p className="text-xs text-slate-200 italic font-serif">
                          "{currentCard.example_sentence}"
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            speakGerman(currentCard.example_sentence);
                          }}
                          className="text-xs text-slate-400 hover:text-slate-200 mt-1 flex items-center gap-1 mx-auto"
                        >
                          <Volume2 size={12} />
                          <span>Play sentence</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div className="text-[11px] text-slate-500 font-medium">
                  {isFlipped ? 'Click card to flip back' : 'Click card to see English & ગુજરાતી meaning'}
                </div>
              </div>

              {/* Rating Buttons */}
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={() => handleReviewVocab('again')}
                  className="py-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-900 text-rose-300 font-semibold text-xs transition"
                >
                  Again (&lt;10m)
                </button>
                <button
                  onClick={() => handleReviewVocab('hard')}
                  className="py-2.5 rounded-xl bg-amber-950/40 hover:bg-amber-900/60 border border-amber-900 text-amber-300 font-semibold text-xs transition"
                >
                  Hard (1d)
                </button>
                <button
                  onClick={() => handleReviewVocab('good')}
                  className="py-2.5 rounded-xl bg-blue-950/40 hover:bg-blue-900/60 border border-blue-900 text-blue-300 font-semibold text-xs transition"
                >
                  Good (3d)
                </button>
                <button
                  onClick={() => handleReviewVocab('easy')}
                  className="py-2.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-900 text-emerald-300 font-semibold text-xs transition"
                >
                  Easy (7d)
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">No words found in database.</div>
          )}
        </div>
      )}

      {/* 3. Grammar Explorer with Bilingual Toggle */}
      {activeSection === 'grammar' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-2">
              Grammar Topics (A0 ➔ B1)
            </h4>
            {[
              'V2 Word Order (Hauptsatz)',
              'Nominativ vs Akkusativ',
              'Dativ Case & Prepositions (mit, bei, nach)',
              'Wechselpräpositionen (Two-way Prepositions)',
              'Perfekt Tense (haben vs sein)',
              'Subordinate Clauses (weil, dass, wenn)',
              'Relative Clauses (Relativsätze)',
              'Adjective Endings (Adjektivdeklination)',
              'Konjunktiv II (Höfliche Bitten & Wünsche)',
            ].map((topic) => (
              <button
                key={topic}
                onClick={() => setSelectedGrammar(topic)}
                className={`w-full text-left p-2.5 rounded-xl text-xs font-semibold transition ${
                  selectedGrammar === topic
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                {topic}
              </button>
            ))}
          </div>

          <div className="md:col-span-2 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-lg text-white">{selectedGrammar}</h3>

              {/* Language Toggle */}
              <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-1">
                <button
                  onClick={() => setGrammarLang('gu')}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                    grammarLang === 'gu' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  ગુજરાતી (Gujarati)
                </button>
                <button
                  onClick={() => setGrammarLang('en')}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                    grammarLang === 'en' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  English
                </button>
              </div>
            </div>

            {loadingGrammar ? (
              <div className="py-12 text-center text-slate-400">Loading explanation...</div>
            ) : (
              <div className="prose prose-invert text-sm text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
                {grammarExplanation}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. QA & Software Testing Drills */}
      {activeSection === 'qa-drills' && (
        <div className="space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="font-bold text-lg text-white flex items-center gap-2">
              <Sparkles size={18} className="text-emerald-400" />
              Software Defect Logging in German (Bug Report Template)
            </h3>
            <p className="text-xs text-slate-400">
              Practice drafting real Jira bugs in German: Expected vs. Actual results, steps to reproduce, and impact.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-2 bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-xs font-bold text-emerald-400 uppercase">Erwartetes Verhalten (Expected)</span>
                <p className="text-xs text-slate-300">
                  "Nach dem Klick auf 'Anmelden' wird der Benutzer zum Dashboard weitergeleitet."
                </p>
                <p className="text-[11px] text-amber-300">
                  ગુજરાતી: "લૉગિન પર ક્લિક કર્યા પછી વપરાશકર્તાને ડૅશબોર્ડ પર રીડાયરેક્ટ કરવામાં આવે છે."
                </p>
                <button
                  onClick={() =>
                    speakGerman(
                      'Nach dem Klick auf Anmelden wird der Benutzer zum Dashboard weitergeleitet.'
                    )
                  }
                  className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1"
                >
                  <Volume2 size={12} />
                  <span>Pronounce</span>
                </button>
              </div>

              <div className="space-y-2 bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-xs font-bold text-rose-400 uppercase">Tatsächliches Verhalten (Actual)</span>
                <p className="text-xs text-slate-300">
                  "Die Seite zeigt einen Fehler 500 und der Benutzer bleibt auf dem Anmeldeformular."
                </p>
                <p className="text-[11px] text-amber-300">
                  ગુજરાતી: "પેજ 500 એરર બતાવે છે અને વપરાશકર્તા લૉગિન ફોર્મ પર જ રહે છે."
                </p>
                <button
                  onClick={() =>
                    speakGerman(
                      'Die Seite zeigt einen Fehler 500 und der Benutzer bleibt auf dem Anmeldeformular.'
                    )
                  }
                  className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1"
                >
                  <Volume2 size={12} />
                  <span>Pronounce</span>
                </button>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-indigo-400 uppercase">Daily Stand-Up Simulation</span>
              <p className="text-xs text-slate-300">
                "Gestern habe ich die Playwright-Tests für die Registrierung automatisiert. Heute überprüfe ich die Regression-Fehler im Test-Environment. Ich habe keine Blocker."
              </p>
              <p className="text-[11px] text-amber-300">
                ગુજરાતી: "ગઈકાલે મેં રજીસ્ટ્રેશન માટે પ્લેરાઇટ ટેસ્ટ ઓટોમેટ કર્યા હતા. આજે હું ટેસ્ટ એન્વાયર્નમેન્ટમાં રીગ્રેશન એરર્સ ચેક કરું છું. મારે કોઈ બ્લોકર નથી."
              </p>
              <button
                onClick={() =>
                  speakGerman(
                    'Gestern habe ich die Playwright-Tests für die Registrierung automatisiert. Heute überprüfe ich die Regression-Fehler im Test-Environment. Ich habe keine Blocker.'
                  )
                }
                className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                <Volume2 size={12} />
                <span>Listen to complete update</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Four-Skill Practice Engine */}
      {activeSection === 'skills' && (
        <div className="space-y-5">
          {/* 4-Skill Sub-navigation */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1.5 rounded-xl">
            {[
              { id: 'listening', label: '1. Hören (Listening)', icon: Volume2 },
              { id: 'reading', label: '2. Lesen (Reading B1)', icon: BookOpen },
              { id: 'speaking', label: '3. Sprechen (Speaking)', icon: Mic },
              { id: 'writing', label: '4. Schreiben (Writing Drills)', icon: FileText },
            ].map((skill) => {
              const Icon = skill.icon;
              return (
                <button
                  key={skill.id}
                  onClick={() => setActiveSkillTab(skill.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    activeSkillTab === skill.id
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon size={14} />
                  <span>{skill.label}</span>
                </button>
              );
            })}
          </div>

          {/* Skill 1: Listening (Hören) */}
          {activeSkillTab === 'listening' && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h4 className="font-bold text-sm text-white flex items-center gap-2">
                    <Volume2 size={16} className="text-emerald-400" />
                    Hören: Berlin Tech &amp; Everyday Scenarios
                  </h4>
                  <p className="text-xs text-slate-400">
                    Listen to natural German conversations at normal conversational speed and test your comprehension.
                  </p>
                </div>
                <div className="flex gap-1.5">
                  {['Tech QA Interview', 'WG Flat Hunting', 'Daily Standup'].map((scName, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setListeningIndex(idx);
                        setListeningSelectedOption(null);
                        setListeningFeedback(null);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                        listeningIndex === idx
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                      }`}
                    >
                      {scName}
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Listening Scenario Content */}
              {(() => {
                const scenarios = [
                  {
                    title: 'Scenario 1: Berlin Tech QA Interview',
                    audioText:
                      'Interviewer: Guten Tag Herr Joshi! Schön, dass Sie da sind. Wie testen Sie asynchrone Web-Anwendungen in Playwright? Karan: Guten Tag! Ich nutze standardmäßig auto-waiting und expect toBeVisible. Explizite sleeps vermeide ich stets.',
                    german:
                      'Interviewer: "Guten Tag Herr Joshi! Schön, dass Sie da sind. Wie testen Sie asynchrone Web-Anwendungen in Playwright?"\n\nKaran: "Guten Tag! Ich nutze standardmäßig auto-waiting und expect(locator).toBeVisible(). Explizite sleeps vermeide ich stets."',
                    en: 'Interviewer: "Good day Mr. Joshi! Nice to meet you. How do you test async web apps in Playwright?"\n\nKaran: "Good day! I use auto-waiting and toBeVisible assertions as standard. I always avoid explicit sleeps."',
                    gu: 'ઈન્ટરવ્યુઅર: "નમસ્તે શ્રી જોશી! તમે પ્લેરાઈટમાં અસિંક વેબ એપ્સ કેવી રીતે ટેસ્ટ કરો છો?"\n\nકરણ: "નમસ્તે! હું ઓટો-વેઈટિંગ અને toBeVisible એસર્શન્સ વાપરું છું. સ્લીપ્સ ટાળું છું."',
                    question: 'Was vermeidet Karan beim Testen asynchroner Web-Anwendungen?',
                    options: [
                      'Explizite Sleep-Timeouts (hardcoded waits)',
                      'Playwright Locators',
                      'Assertions',
                    ],
                    correctIdx: 0,
                    rule: 'Goethe B1 Hörverstehen - Fachwortschatz IT',
                  },
                  {
                    title: 'Scenario 2: WG Zimmer Suche in Berlin-Mitte',
                    audioText:
                      'Vermieterin: Hallo Karan, das Zimmer kostet 650 Euro Warmmiete inklusive Nebenkosten. Eine Wohnungsgeberbestätigung für die amtliche Anmeldung im Bürgeramt ist selbstverständlich möglich.',
                    german:
                      'Vermieterin: "Hallo Karan, das Zimmer in Prenzlauer Berg kostet 650 Euro Warmmiete inklusive Nebenkosten. Eine Wohnungsgeberbestätigung für die amtliche Anmeldung im Bürgeramt ist selbstverständlich möglich."',
                    en: 'Landlord: "Hello Karan, the room in Prenzlauer Berg costs 650 Euros warm rent including utilities. A landlord confirmation (Wohnungsgeberbestätigung) for official city registration at the Bürgeramt is of course possible."',
                    gu: 'મકાનમાલિક: "નમસ્તે કરણ, પ્રેન્ઝલાઉઅર બર્ગમાં રૂમનું ભાડું 650 યુરો છે. બુર્ગેરઆમ્ટ ખાતે સત્તાવાર અન્મેલ્ડંગ માટે લેન્ડલોર્ડ કન્ફર્મેશન ચોક્કસપણે શક્ય છે."',
                    question: 'Ist eine amtliche Anmeldung (Anmeldung im Bürgeramt) für das Zimmer möglich?',
                    options: [
                      'Nein, nur Untermiete ohne Papiere',
                      'Ja, mit offizieller Wohnungsgeberbestätigung',
                      'Nur nach 1 Jahr Aufenthalt',
                    ],
                    correctIdx: 1,
                    rule: 'Goethe B1 Hörverstehen - Wohnungsmarkt Berlin',
                  },
                  {
                    title: 'Scenario 3: Daily Scrum & Jira Bug Triage',
                    audioText:
                      'Scrum Master: Guten Morgen Team. Gibt es Neuigkeiten von der QA? Karan: Guten Morgen. Gestern habe ich 14 automatisierte Regression-Tests für das Login-Modul implementiert. Alle Tests sind grün. Heute schreibe ich Tests für den Datei-Upload im Playwright-Lab.',
                    german:
                      'Scrum Master: "Guten Morgen Team. Gibt es Neuigkeiten von der QA?"\n\nKaran: "Guten Morgen. Gestern habe ich 14 automatisierte Regression-Tests für das Login-Modul implementiert. Alle Tests sind grün. Heute schreibe ich Tests für den Datei-Upload im Playwright-Lab."',
                    en: 'Scrum Master: "Good morning team. Any news from QA?"\n\nKaran: "Good morning. Yesterday I implemented 14 automated regression tests for the login module. All tests are green. Today I am writing tests for file upload in the Playwright lab."',
                    gu: 'સ્ક્રમ માસ્ટર: "ગુડ મોર્નિંગ ટીમ. QA તરફથી કોઈ અપડેટ?"\n\nકરણ: "ગુડ મોર્નિંગ. ગઈકાલે મેં લૉગિન માટે 14 ઓટોમેટેડ ટેસ્ટ્સ બનાવ્યા હતા. બધા ગ્રીન છે. આજે હું ફાઇલ અપલોડ માટે ટેસ્ટ્સ લખી રહ્યો છું."',
                    question: 'Welche Aufgabe übernimmt Karan heute im Sprint?',
                    options: [
                      'Manuelle Excel-Dokumentation',
                      'Tests für den Datei-Upload im Playwright-Lab schreiben',
                      'Server-Hardware warten',
                    ],
                    correctIdx: 1,
                    rule: 'Goethe B1 Hörverstehen - Scrum Standup',
                  },
                ];

                const sc = scenarios[listeningIndex];

                const handleCheckListening = (optIdx: number) => {
                  setListeningSelectedOption(optIdx);
                  const isCorrect = optIdx === sc.correctIdx;
                  if (isCorrect) {
                    setListeningFeedback({ isCorrect: true, text: 'Richtig! Excellent listening comprehension!' });
                  } else {
                    setListeningFeedback({
                      isCorrect: false,
                      text: `Nicht ganz. Die richtige Antwort ist: "${sc.options[sc.correctIdx]}". Mistake automatically logged to Error Log for review!`,
                    });
                    logMistake(
                      sc.options[optIdx],
                      sc.options[sc.correctIdx],
                      sc.rule,
                      `Incorrect choice on listening comprehension: "${sc.question}"`,
                      `સાંભળવાની સમજણમાં ખોટો વિકલ્પ પસંદ કર્યો: "${sc.question}"`
                    );
                  }
                };

                return (
                  <div className="space-y-4">
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-xs text-white block">{sc.title}</span>
                        <span className="text-[11px] text-slate-400">Click to listen with German voice audio</span>
                      </div>
                      <button
                        onClick={() => speakGerman(sc.audioText)}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 transition shadow-lg shadow-emerald-600/20"
                      >
                        <Play size={14} />
                        <span>Play Audio</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 space-y-1">
                        <span className="font-bold text-emerald-400 block">Deutsches Transkript:</span>
                        <p className="text-slate-300 whitespace-pre-line leading-relaxed">{sc.german}</p>
                      </div>
                      <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 space-y-2">
                        <div>
                          <span className="font-bold text-indigo-400 block">English:</span>
                          <p className="text-slate-400 whitespace-pre-line leading-relaxed">{sc.en}</p>
                        </div>
                        <div className="pt-1 border-t border-slate-900">
                          <span className="font-bold text-amber-300 block">ગુજરાતી અર્થ:</span>
                          <p className="text-amber-200/90 whitespace-pre-line leading-relaxed">{sc.gu}</p>
                        </div>
                      </div>
                    </div>

                    {/* Comprehension Question */}
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                      <span className="font-bold text-xs text-white block">
                        Verständnisfrage (Comprehension Check): {sc.question}
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {sc.options.map((opt, oIdx) => (
                          <button
                            key={oIdx}
                            onClick={() => handleCheckListening(oIdx)}
                            className={`p-3 rounded-xl border text-xs text-left transition font-medium ${
                              listeningSelectedOption === oIdx
                                ? oIdx === sc.correctIdx
                                  ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
                                  : 'bg-rose-950/80 border-rose-500 text-rose-200'
                                : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
                            }`}
                          >
                            <span className="font-bold text-emerald-400 mr-1.5">{String.fromCharCode(65 + oIdx)}.</span>
                            {opt}
                          </button>
                        ))}
                      </div>

                      {listeningFeedback && (
                        <div
                          className={`p-3 rounded-xl text-xs border ${
                            listeningFeedback.isCorrect
                              ? 'bg-emerald-950/50 border-emerald-800 text-emerald-300'
                              : 'bg-rose-950/50 border-rose-800 text-rose-300'
                          }`}
                        >
                          {listeningFeedback.text}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Skill 2: Reading (Lesen B1) */}
          {activeSkillTab === 'reading' && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h4 className="font-bold text-sm text-white flex items-center gap-2">
                    <BookOpen size={16} className="text-emerald-400" />
                    Goethe B1 Leseverstehen: Authentische Berliner IT-Stellenanzeige
                  </h4>
                  <p className="text-xs text-slate-400">
                    Read the job announcement carefully and answer the 3 comprehension questions below.
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                  Goethe B1 Teil 1
                </span>
              </div>

              {/* Reading Passage */}
              <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-3 leading-relaxed">
                <div className="font-bold text-sm text-white text-center pb-2 border-b border-slate-800/80">
                  Stellenangebot: Software Test Automation Specialist (m/w/d) – FinTech Berlin
                </div>
                <p>
                  Wir suchen für unser modernes FinTech-Unternehmen in Berlin-Kreuzberg eine engagierte Persönlichkeit im Bereich QA Automation.
                </p>
                <div>
                  <span className="font-bold text-emerald-400 block mb-1">Ihre Aufgaben:</span>
                  <ul className="list-disc pl-5 space-y-1 text-slate-400">
                    <li>Konzeption, Pflege und Weiterentwicklung automatisierter End-to-End-Tests mit Playwright und TypeScript.</li>
                    <li>Enge Zusammenarbeit mit Frontend- und Backend-Entwicklern im zweiwöchigen Scrum-Sprint.</li>
                    <li>Analyse von Fehlern in der CI/CD-Pipeline und Erstellung präziser Fehlerberichte in Jira.</li>
                  </ul>
                </div>
                <div>
                  <span className="font-bold text-emerald-400 block mb-1">Ihr Profil:</span>
                  <ul className="list-disc pl-5 space-y-1 text-slate-400">
                    <li>Mindestens 2–3 Jahre praktische Erfahrung im Software-Testing (Web &amp; API).</li>
                    <li>Solide Programmierkenntnisse in JavaScript oder TypeScript.</li>
                    <li>Gute Deutschkenntnisse (mindestens B1 für die Team-Kommunikation) sowie verhandlungssicheres Englisch.</li>
                  </ul>
                </div>
                <div className="text-slate-400 pt-1 border-t border-slate-900">
                  Wir bieten: 30 Tage Urlaub, modernes Büro in Berlin, BVG-Ticket und individuelle Weiterbildungsbudgets.
                </div>
              </div>

              {/* Reading Comprehension Questions */}
              {(() => {
                const readingQuestions = [
                  {
                    id: 1,
                    q: '1. Welche Test-Frameworks und Programmiersprachen werden in der Stellenanzeige explizit gefordert?',
                    options: ['Playwright und TypeScript', 'Selenium und Java', 'Cypress und Python'],
                    correct: 0,
                  },
                  {
                    id: 2,
                    q: '2. Welches Sprachniveau in Deutsch wird für die Team-Kommunikation mindestens erwartet?',
                    options: ['A1 Anfänger', 'Mindestens Niveau B1', 'C2 Muttersprachliches Niveau'],
                    correct: 1,
                  },
                  {
                    id: 3,
                    q: '3. In welchem Zyklus finden die Scrum-Sprints in diesem Unternehmen statt?',
                    options: ['Jeden Tag (täglich)', 'Im zweiwöchigen Rhythmus (alle 2 Wochen)', 'Einmal pro Quartal'],
                    correct: 1,
                  },
                ];

                const handleCheckReading = () => {
                  setReadingSubmitted(true);
                  let score = 0;
                  readingQuestions.forEach((rq) => {
                    if (readingAnswers[rq.id] === rq.correct) {
                      score++;
                    } else {
                      const userChoice = rq.options[readingAnswers[rq.id] ?? 0];
                      const correctChoice = rq.options[rq.correct];
                      logMistake(
                        userChoice,
                        correctChoice,
                        'Goethe B1 Leseverstehen - Detailverständnis',
                        `Reading error on question: "${rq.q}"`,
                        `વાંચન સમજણમાં ભૂલ: "${rq.q}"`
                      );
                    }
                  });
                };

                return (
                  <div className="space-y-4">
                    {readingQuestions.map((rq) => (
                      <div key={rq.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                        <span className="font-bold text-xs text-white block">{rq.q}</span>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {rq.options.map((opt, oIdx) => (
                            <button
                              key={oIdx}
                              onClick={() => {
                                if (readingSubmitted) return;
                                setReadingAnswers({ ...readingAnswers, [rq.id]: oIdx });
                              }}
                              className={`p-2.5 rounded-lg border text-xs text-left transition ${
                                readingAnswers[rq.id] === oIdx
                                  ? readingSubmitted
                                    ? oIdx === rq.correct
                                      ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                                      : 'bg-rose-950/80 border-rose-500 text-rose-300'
                                    : 'bg-emerald-600/30 border-emerald-500 text-white'
                                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                              }`}
                            >
                              <span className="font-bold text-emerald-400 mr-1.5">{String.fromCharCode(65 + oIdx)}.</span>
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}

                    <div className="flex items-center justify-between pt-2">
                      <button
                        onClick={handleCheckReading}
                        disabled={readingSubmitted || Object.keys(readingAnswers).length < 3}
                        className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 transition disabled:opacity-50"
                      >
                        {readingSubmitted ? 'Answers Evaluated' : 'Submit & Check Reading Comprehension'}
                      </button>

                      {readingSubmitted && (
                        <button
                          onClick={() => {
                            setReadingAnswers({});
                            setReadingSubmitted(false);
                          }}
                          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                        >
                          Retry Reading Drill
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Skill 3: Speaking (Sprechen) */}
          {activeSkillTab === 'speaking' && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                <Mic size={16} className="text-emerald-400" />
                Sprechen: Voice Self-Presentation &amp; Tech Interview
              </h4>
              <p className="text-xs text-slate-400">
                Speak German clearly into your microphone. Browser speech recognition transcribes and evaluates your German pronunciation.
              </p>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-emerald-400 uppercase">Target Sentence to Speak:</span>
                <p className="text-sm font-semibold text-white">
                  "Ich heiße Karan Joshi. Ich bin Software Test Engineer und suche eine Stelle in Berlin."
                </p>
                <p className="text-xs text-amber-300">
                  ગુજરાતી: "મારું નામ કરણ જોશી છે. હું સોફ્ટવેર ટેસ્ટ એન્જિનિયર છું અને બર્લિનમાં નોકરી શોધી રહ્યો છું."
                </p>
                <button
                  onClick={() =>
                    speakGerman('Ich heiße Karan Joshi. Ich bin Software Test Engineer und suche eine Stelle in Berlin.')
                  }
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1 pt-1"
                >
                  <Volume2 size={13} />
                  <span>Listen to native pronunciation</span>
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => startListening()}
                  className={`px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition shadow-lg ${
                    isListening
                      ? 'bg-rose-600 text-white animate-pulse shadow-rose-600/30'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                  }`}
                >
                  <Mic size={15} />
                  <span>{isListening ? 'Listening (Speak German now)...' : 'Start Speaking'}</span>
                </button>
              </div>

              {transcript && (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-200 space-y-1">
                  <span className="text-slate-500 block font-mono">Recognized Speech:</span>
                  <p className="font-bold text-emerald-400 text-sm">"{transcript}"</p>
                </div>
              )}
            </div>
          )}

          {/* Skill 4: Writing Drills (Schreiben) */}
          {activeSkillTab === 'writing' && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                <FileText size={16} className="text-emerald-400" />
                Schreiben: Subordinate Clause Connector Drill (weil / obwohl)
              </h4>
              <p className="text-xs text-slate-400">
                Practice placing conjugated verbs at the END of the clause (Nebensatz - Verb am Ende).
              </p>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                <span className="font-bold text-slate-400 uppercase">Task:</span>
                <p className="text-slate-200">
                  Connect these two clauses using <b>"weil"</b> (because):
                </p>
                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 font-mono text-emerald-300">
                  1. "Karan lernt jeden Tag Deutsch." + 2. "Er will in Berlin als Software Test Engineer arbeiten."
                </div>
              </div>

              {/* 3 Choice options */}
              <div className="space-y-2">
                {[
                  {
                    text: 'Karan lernt jeden Tag Deutsch, weil er in Berlin als Software Test Engineer arbeiten will.',
                    isCorrect: true,
                    desc: 'Correct! Modal verb "will" is sent to the very end of the subordinate clause.',
                  },
                  {
                    text: 'Karan lernt jeden Tag Deutsch, weil will er in Berlin arbeiten.',
                    isCorrect: false,
                    desc: 'Incorrect! Verb cannot stay in position 2 after "weil".',
                  },
                  {
                    text: 'Karan lernt jeden Tag Deutsch, weil er will in Berlin arbeiten.',
                    isCorrect: false,
                    desc: 'Incorrect! Verb "will" must be placed at the final position.',
                  },
                ].map((choice, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      if (choice.isCorrect) {
                        setWritingFeedback({ isCorrect: true, text: choice.desc });
                      } else {
                        setWritingFeedback({ isCorrect: false, text: choice.desc });
                        logMistake(
                          choice.text,
                          'Karan lernt jeden Tag Deutsch, weil er in Berlin als Software Test Engineer arbeiten will.',
                          'Kausalsatz mit weil (Verb am Ende)',
                          'In German, "weil" triggers a Nebensatz where the finite conjugated verb is pushed to the very end.',
                          'જર્મનમાં "weil" સાથેના વાક્યમાં ક્રિયાપદ હંમેશા છેલ્લે જાય છે.'
                        );
                      }
                    }}
                    className="w-full text-left p-3.5 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-900 hover:border-slate-700 transition text-xs text-slate-200"
                  >
                    <span className="font-bold text-emerald-400 mr-2">{String.fromCharCode(65 + idx)}.</span>
                    {choice.text}
                  </button>
                ))}
              </div>

              {writingFeedback && (
                <div
                  className={`p-3.5 rounded-xl text-xs border ${
                    writingFeedback.isCorrect
                      ? 'bg-emerald-950/50 border-emerald-800 text-emerald-300'
                      : 'bg-rose-950/50 border-rose-800 text-rose-300'
                  }`}
                >
                  {writingFeedback.text}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 6. Error Log Section & Active Recall Quiz */}
      {activeSection === 'error-log' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="font-bold text-lg text-white">Automated Error Log &amp; Spaced Repetition (SRS)</h3>
              <p className="text-xs text-slate-400">
                Mistakes made during drills and exams are automatically tracked here. Practice with Active Recall to reinforce retention.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setQuizCurrentIdx(0);
                  setQuizRevealed(false);
                  setIsQuizOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 transition"
              >
                <RotateCw size={14} />
                <span>Start Active Recall Quiz</span>
              </button>

              <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1">
                <button
                  onClick={() => setErrorLang('gu')}
                  className={`px-2.5 py-1 rounded text-xs font-semibold ${
                    errorLang === 'gu' ? 'bg-emerald-600 text-white' : 'text-slate-400'
                  }`}
                >
                  ગુજરાતી
                </button>
                <button
                  onClick={() => setErrorLang('en')}
                  className={`px-2.5 py-1 rounded text-xs font-semibold ${
                    errorLang === 'en' ? 'bg-emerald-600 text-white' : 'text-slate-400'
                  }`}
                >
                  English
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {errorLogs.map((item) => (
              <div
                key={item.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 hover:border-slate-700 transition"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-rose-400">Mistake: "{item.wrong_sentence}"</span>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono text-[11px]">
                      SRS Level {item.srs_level}
                    </span>
                    <button
                      onClick={() => handleReviewError(item.id, 'good')}
                      className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 hover:bg-emerald-900 text-[11px] font-semibold transition"
                      title="Promote SRS (+1)"
                    >
                      Good (+1)
                    </button>
                    <button
                      onClick={() => handleReviewError(item.id, 'again')}
                      className="px-2 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800 hover:bg-rose-900 text-[11px] font-semibold transition"
                      title="Reset SRS to Level 0"
                    >
                      Again (Reset)
                    </button>
                  </div>
                </div>

                <div className="text-xs font-semibold text-emerald-400">
                  Corrected: "{item.corrected_sentence}"
                </div>

                <div className="text-xs text-slate-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                  <span className="font-bold text-indigo-400 block mb-0.5">Rule: {item.grammar_rule}</span>
                  <p>{errorLang === 'gu' ? item.explanation_gu : item.explanation_en}</p>
                </div>
              </div>
            ))}

            {errorLogs.length === 0 && (
              <div className="text-center py-12 text-slate-500 border border-dashed border-slate-800 rounded-xl space-y-2">
                <p className="font-medium">No mistakes logged yet!</p>
                <p className="text-xs text-slate-600">
                  Any incorrect answers during German reading, listening, or grammar drills will automatically appear here for Spaced Repetition review.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Active Recall Quiz Modal */}
      {isQuizOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-xl p-6 space-y-4 shadow-2xl">
            {errorLogs.length === 0 ? (
              <div className="text-center py-8 space-y-3">
                <CheckCircle size={36} className="text-emerald-400 mx-auto" />
                <h3 className="font-bold text-lg text-white">All Caught Up!</h3>
                <p className="text-xs text-slate-400">
                  You currently have no active error cards in your queue. Great job! Practice with the 4-Skill drills to test your German.
                </p>
                <button
                  onClick={() => setIsQuizOpen(false)}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            ) : (() => {
              const currentItem = errorLogs[quizCurrentIdx % errorLogs.length];
              return (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <h3 className="font-bold text-base text-white">Active Recall Quiz (Card {quizCurrentIdx + 1} / {errorLogs.length})</h3>
                      <span className="text-[11px] text-slate-400">Rule: {currentItem.grammar_rule}</span>
                    </div>
                    <button
                      onClick={() => setIsQuizOpen(false)}
                      className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
                    <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider block">
                      Sentence with Mistake:
                    </span>
                    <p className="text-sm font-semibold text-white">
                      "{currentItem.wrong_sentence}"
                    </p>
                    <p className="text-xs text-slate-400">
                      Can you recall the correct German sentence structure?
                    </p>
                  </div>

                  {!quizRevealed ? (
                    <button
                      onClick={() => setQuizRevealed(true)}
                      className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition"
                    >
                      <HelpCircle size={15} />
                      <span>Reveal Solution &amp; Grammar Rule</span>
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <div className="bg-emerald-950/40 border border-emerald-800/80 p-4 rounded-xl space-y-2">
                        <span className="text-xs font-bold text-emerald-400 uppercase block">Corrected Sentence:</span>
                        <p className="text-sm font-bold text-emerald-200">
                          "{currentItem.corrected_sentence}"
                        </p>
                        <div className="pt-2 border-t border-emerald-900/60 text-xs space-y-1">
                          <p className="text-slate-300">
                            <b>English:</b> {currentItem.explanation_en}
                          </p>
                          <p className="text-amber-300">
                            <b>ગુજરાતી:</b> {currentItem.explanation_gu}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-3 pt-2">
                        <button
                          onClick={() => {
                            handleReviewError(currentItem.id, 'again');
                            setQuizRevealed(false);
                            if (quizCurrentIdx + 1 >= errorLogs.length) {
                              setIsQuizOpen(false);
                            } else {
                              setQuizCurrentIdx(quizCurrentIdx + 1);
                            }
                          }}
                          className="flex-1 py-2.5 rounded-xl bg-rose-900/60 hover:bg-rose-900 border border-rose-700 text-rose-200 text-xs font-semibold transition"
                        >
                          Hard / Need Review (Reset SRS)
                        </button>
                        <button
                          onClick={() => {
                            handleReviewError(currentItem.id, 'good');
                            setQuizRevealed(false);
                            if (quizCurrentIdx + 1 >= errorLogs.length) {
                              setIsQuizOpen(false);
                            } else {
                              setQuizCurrentIdx(quizCurrentIdx + 1);
                            }
                          }}
                          className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 transition"
                        >
                          I Remembered! (+1 SRS Level)
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* 7. Goethe B1 Mock Exam */}
      {activeSection === 'mock-exam' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-lg text-white">Goethe-Zertifikat B1: Schreiben Simulation</h3>
              <p className="text-xs text-slate-400">
                Official 4-rubric AI grading: Aufgabengerechtheit, Kohärenz, Wortschatz, Strukturen.
              </p>
            </div>
            <div className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
              60% Passing Benchmark
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Exam Prompt:
            </span>
            <p className="text-sm text-slate-200">{examPrompt}</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Your Written Response (in German):
            </label>
            <textarea
              rows={8}
              value={examSubmission}
              onChange={(e) => setExamSubmission(e.target.value)}
              placeholder="Sehr geehrte Damen und Herren, vielen Dank für die Einladung zum Vorstellungsgespräch..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-sans"
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleGradeExam}
              disabled={isGrading}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition disabled:opacity-50"
            >
              <Award size={16} />
              <span>{isGrading ? 'Grading with Goethe B1 Rubrics...' : 'Submit & Grade Exam'}</span>
            </button>
          </div>

          {examResult && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white">Overall Score</span>
                <span
                  className={`text-xl font-extrabold ${
                    examResult.score >= 60 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {examResult.score} / 100 {examResult.score >= 60 ? '(Passed)' : '(Retake)'}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block">Task</span>
                  <span className="font-bold text-white">{examResult.task_score} / 25</span>
                </div>
                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block">Coherence</span>
                  <span className="font-bold text-white">{examResult.coherence_score} / 25</span>
                </div>
                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block">Vocabulary</span>
                  <span className="font-bold text-white">{examResult.vocab_score} / 25</span>
                </div>
                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block">Grammar</span>
                  <span className="font-bold text-white">{examResult.grammar_score} / 25</span>
                </div>
              </div>

              <div className="text-xs text-slate-300 bg-slate-900 p-3 rounded-lg border border-slate-800">
                <span className="font-bold text-emerald-400 block mb-1">Examiner Feedback:</span>
                {examResult.feedback}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 8. Curriculum Overview & Textbook Folder */}
      {activeSection === 'overview' && (
        <div className="space-y-6">
          {/* Textbook Files Detection */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-emerald-400" />
                <h3 className="font-bold text-base text-white">Course Textbook Materials (Schritte PLUS NEU)</h3>
              </div>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-slate-800 text-slate-300">
                Local Folder Scanned
              </span>
            </div>

            <p className="text-xs text-slate-400">
              For large textbook PDFs (over 10MB), place your files directly in the project folder below:
            </p>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-xs text-emerald-400 break-all select-all">
              {textbookInfo?.folderPath || 'reference_materials\\textbook'}
            </div>

            {textbookInfo && textbookInfo.files.length > 0 ? (
              <div className="space-y-2 pt-2">
                <span className="text-xs font-semibold text-slate-300 block">Detected Textbook Files:</span>
                {textbookInfo.files.map((f: any, idx: number) => (
                  <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                    <span className="font-semibold text-white">{f.name}</span>
                    <span className="text-slate-500">{(f.size / (1024 * 1024)).toFixed(1)} MB</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-500 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                No textbook files found in this folder yet. Place your <code>schritte-a11-2.pdf</code> here anytime!
              </div>
            )}
          </div>

          {/* 30-Week Roadmap */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="font-bold text-lg text-white">30-Week Chancenkarte Curriculum Roadmap</h3>
            <div className="space-y-3">
              {[
                {
                  stage: 'Stage 0: Foundation (Week 1)',
                  desc: 'Alphabet (A-Z), Umlaute (Ä, Ö, Ü), Eszett (ß), Diphthongs (ei, ie, eu), V2 word order rule.',
                },
                {
                  stage: 'Stage 1: CEFR A1 (Weeks 2–8)',
                  desc: 'Present tense, Nominative/Accusative, basic modals, separable verbs. Daily Berlin life + IT login status.',
                },
                {
                  stage: 'Stage 2: CEFR A2 (Weeks 9–17)',
                  desc: 'Dative case, two-way prepositions, Perfekt tense. Healthcare, banking + QA bug logging and Jira basics.',
                },
                {
                  stage: 'Stage 3: CEFR B1 (Weeks 18–27)',
                  desc: 'Subordinate clauses (weil/dass/obwohl), relative clauses, Passive voice. WG hunting + sprint planning.',
                },
                {
                  stage: 'Stage 4: Exam Mastery (Weeks 28–30)',
                  desc: 'Goethe B1 Redemittel, formal letter formatting, timed Goethe B1 mock exams with >=70% score benchmark.',
                },
              ].map((s, idx) => (
                <div key={idx} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <span className="font-bold text-xs text-emerald-400 block">{s.stage}</span>
                  <span className="text-xs text-slate-300">{s.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add Word Modal */}
      {newWordModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleAddWord}
            className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl"
          >
            <h3 className="font-bold text-lg text-white">Add German Vocabulary Word</h3>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Article</label>
                <select
                  value={newWord.article}
                  onChange={(e) => setNewWord({ ...newWord, article: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white"
                >
                  <option value="der">der (Masc)</option>
                  <option value="die">die (Fem)</option>
                  <option value="das">das (Neut)</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1">German Word</label>
                <input
                  type="text"
                  required
                  value={newWord.german}
                  onChange={(e) => setNewWord({ ...newWord, german: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">English Meaning</label>
                <input
                  type="text"
                  required
                  value={newWord.english}
                  onChange={(e) => setNewWord({ ...newWord, english: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">ગુજરાતી અર્થ (Gujarati)</label>
                <input
                  type="text"
                  value={newWord.gujarati}
                  onChange={(e) => setNewWord({ ...newWord, gujarati: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Example Sentence</label>
              <input
                type="text"
                value={newWord.example_sentence}
                onChange={(e) => setNewWord({ ...newWord, example_sentence: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setNewWordModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
              >
                Save Word
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
export default GermanLearningDashboard;
