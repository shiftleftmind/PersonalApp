import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.resolve(process.cwd(), 'personal_hub.db');
export const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS job_applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company TEXT NOT NULL,
      title TEXT NOT NULL,
      location TEXT,
      salary_range TEXT,
      url TEXT,
      stage TEXT NOT NULL DEFAULT 'Wishlist',
      german_level_required TEXT,
      match_score INTEGER DEFAULT 0,
      match_analysis TEXT,
      company_background TEXT,
      tech_stack TEXT,
      notes TEXT,
      applied_at TEXT,
      last_contact_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS cover_letters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER,
      title TEXT NOT NULL,
      content_markdown TEXT NOT NULL,
      pdf_path TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (job_id) REFERENCES job_applications(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS job_timeline_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER NOT NULL,
      note TEXT NOT NULL,
      note_type TEXT DEFAULT 'Note',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (job_id) REFERENCES job_applications(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS german_vocab (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      german TEXT NOT NULL,
      article TEXT,
      plural TEXT,
      english TEXT NOT NULL,
      gujarati TEXT,
      cefr_level TEXT DEFAULT 'A1',
      category TEXT,
      example_sentence TEXT,
      srs_level INTEGER DEFAULT 0,
      next_review_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS german_alphabets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      letter TEXT NOT NULL,
      name_de TEXT NOT NULL,
      phonetic_en TEXT NOT NULL,
      phonetic_gu TEXT NOT NULL,
      example_word TEXT NOT NULL,
      example_en TEXT NOT NULL,
      example_gu TEXT NOT NULL,
      category TEXT DEFAULT 'Alphabet',
      audio_text TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS german_error_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      wrong_sentence TEXT NOT NULL,
      corrected_sentence TEXT NOT NULL,
      grammar_rule TEXT NOT NULL,
      explanation_en TEXT,
      explanation_gu TEXT,
      srs_level INTEGER DEFAULT 0,
      next_review_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS german_mock_exams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exam_type TEXT NOT NULL,
      section TEXT NOT NULL,
      user_submission TEXT,
      score INTEGER,
      feedback TEXT,
      completed_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS german_lessons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      stage TEXT NOT NULL,
      lesson_number INTEGER NOT NULL,
      title_de TEXT NOT NULL,
      title_en TEXT NOT NULL,
      title_gu TEXT NOT NULL,
      textbook_source TEXT NOT NULL,
      grammar_focus_de TEXT NOT NULL,
      grammar_focus_en TEXT NOT NULL,
      grammar_focus_gu TEXT NOT NULL,
      redemittel_de TEXT NOT NULL,
      redemittel_en TEXT NOT NULL,
      redemittel_gu TEXT NOT NULL,
      drill_question TEXT NOT NULL,
      drill_options TEXT NOT NULL,
      drill_correct_idx INTEGER NOT NULL,
      drill_explanation_en TEXT NOT NULL,
      drill_explanation_gu TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS playwright_snippets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      code TEXT NOT NULL,
      explanation TEXT,
      tags TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS automation_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      script_name TEXT NOT NULL,
      parameters TEXT,
      status TEXT NOT NULL,
      output_summary TEXT,
      duration_ms INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  // Migrate existing german_vocab to include gujarati column if missing
  try {
    db.exec('ALTER TABLE german_vocab ADD COLUMN gujarati TEXT;');
  } catch (e) {
    // Column already exists
  }

  // Populate default master CV if not set
  const cvRow = db.prepare('SELECT value FROM user_settings WHERE key = ?').get('master_cv');
  if (!cvRow) {
    const defaultCV = `
Karan Joshi - Software Test Engineer
Location: Berlin, Germany
Email: karan.joshi.87@outlook.com | Phone: +49 179 1700714
Profiles: LinkedIn | Portfolio | XING
Experience: 3+ years of professional experience in software testing
Core Competencies:
- Functional, regression and exploratory testing across web, mobile and kiosk applications
- Test-case design, defect analysis and release validation
- Playwright test automation with JavaScript & TypeScript
- Collaboration with developers on bug verification and production hotfixes
- German Language: Goethe-Zertifikat B1 Candidate (Conversational, technical QA German)
    `.trim();
    db.prepare('INSERT INTO user_settings (key, value) VALUES (?, ?)').run('master_cv', defaultCV);
  }

  // Populate user's reference cover letter template
  const defaultTemplate = `
07th October, 2026

Hiring Team,
[Company Name]
Berlin, Germany

Dear Hiring Team,

I am writing to apply for the [Job Title] position in Berlin. I have 3+ years of professional experience in software testing, with hands-on responsibility for functional, regression and exploratory testing, test-case design, defect analysis and release validation across web, mobile and kiosk applications.

In my current experience, I have tested complex SaaS products, performed full regression cycles before releases, reproduced and documented critical defects, and worked closely with developers to verify fixes and production hotfixes. And I am currently developing my Playwright automation skills with JavaScript/TypeScript.

The opportunity to contribute to the quality of a widely used product [Company Specific Detail: tailored to tech stack and product mission] particularly interests me. I would be glad to bring my structured testing approach, problem-solving skills and attention to detail to [Company Name]'s testing team.

Thank you for considering my application.

Kind regards,
Karan Joshi
karan.joshi.87@outlook.com
+49 179 1700714
Berlin, Germany
LinkedIn · Portfolio · XING
  `.trim();

  // Always keep user's reference cover letter template updated
  db.prepare('INSERT OR REPLACE INTO user_settings (key, value) VALUES (?, ?)').run('cover_letter_template', defaultTemplate);

  // Seed German Alphabet & Pronunciation table (Stage 0 Foundation)
  const alphabetCount = db.prepare('SELECT COUNT(*) as count FROM german_alphabets').get() as { count: number };
  if (alphabetCount.count === 0) {
    const seedAlphabets = [
      // Standard Letters (A-Z)
      { letter: 'A a', name_de: 'Ah', phonetic_en: 'Ah (like "father")', phonetic_gu: 'આ (જેમ કે "આકાશ")', example_word: 'der Apfel', example_en: 'Apple', example_gu: 'સફરજન', category: 'Alphabet', audio_text: 'A. der Apfel' },
      { letter: 'B b', name_de: 'Beh', phonetic_en: 'Bay (like "baby")', phonetic_gu: 'બે (જેમ કે "બહેન")', example_word: 'das Buch', example_en: 'Book', example_gu: 'પુસ્તક', category: 'Alphabet', audio_text: 'B. das Buch' },
      { letter: 'C c', name_de: 'Tseh', phonetic_en: 'Tsay (like "ts" in "cats")', phonetic_gu: 'ત્સે (જેમ કે "ત્સ")', example_word: 'der Computer', example_en: 'Computer', example_gu: 'કમ્પ્યુટર', category: 'Alphabet', audio_text: 'C. der Computer' },
      { letter: 'D d', name_de: 'Deh', phonetic_en: 'Day (clean d sound)', phonetic_gu: 'ડે (જેમ કે "દેવ")', example_word: 'die Datei', example_en: 'File / Data file', example_gu: 'ફાઇલ / ડેટા', category: 'Alphabet', audio_text: 'D. die Datei' },
      { letter: 'E e', name_de: 'Eh', phonetic_en: 'Ay (like "café")', phonetic_gu: 'એ (જેમ કે "એક")', example_word: 'die E-Mail', example_en: 'Email', example_gu: 'ઇમેઇલ', category: 'Alphabet', audio_text: 'E. die E-Mail' },
      { letter: 'F f', name_de: 'Eff', phonetic_en: 'Eff (standard f)', phonetic_gu: 'એફ (જેમ કે "ફલ")', example_word: 'der Fehler', example_en: 'Bug / Error', example_gu: 'ખામી / ક્ષતિ', category: 'Alphabet', audio_text: 'F. der Fehler' },
      { letter: 'G g', name_de: 'Geh', phonetic_en: 'Gay (always hard g like "go")', phonetic_gu: 'ગે (હંમેશા ગ જેવો અવાજ)', example_word: 'das Gehalt', example_en: 'Salary', example_gu: 'પગાર', category: 'Alphabet', audio_text: 'G. das Gehalt' },
      { letter: 'H h', name_de: 'Hah', phonetic_en: 'Hah (aspirated h)', phonetic_gu: 'હા (જેમ કે "હાથ")', example_word: 'die Hilfe', example_en: 'Help / Support', example_gu: 'મદદ', category: 'Alphabet', audio_text: 'H. die Hilfe' },
      { letter: 'I i', name_de: 'Eeh', phonetic_en: 'Eeh (like "see")', phonetic_gu: 'ઈ (જેમ કે "ઈશ્વર")', example_word: 'das Internet', example_en: 'Internet', example_gu: 'ઇન્ટરનેટ', category: 'Alphabet', audio_text: 'I. das Internet' },
      { letter: 'J j', name_de: 'Yott', phonetic_en: 'Yott (pronounced like English "y")', phonetic_gu: 'યોટ (અંગ્રેજી ય જેવો અવાજ)', example_word: 'das Jahr', example_en: 'Year', example_gu: 'વર્ષ', category: 'Alphabet', audio_text: 'J. das Jahr' },
      { letter: 'K k', name_de: 'Kah', phonetic_en: 'Kah (crisp k)', phonetic_gu: 'કા (જેમ કે "કાગળ")', example_word: 'der Kollege', example_en: 'Colleague', example_gu: 'સહકર્મી', category: 'Alphabet', audio_text: 'K. der Kollege' },
      { letter: 'L l', name_de: 'Ell', phonetic_en: 'Ell (clear l sound)', phonetic_gu: 'એલ (જેમ કે "લાલ")', example_word: 'das Lernen', example_en: 'Learning', example_gu: 'શીખવું', category: 'Alphabet', audio_text: 'L. das Lernen' },
      { letter: 'M m', name_de: 'Emm', phonetic_en: 'Emm (standard m)', phonetic_gu: 'એમ (જેમ કે "માતા")', example_word: 'der Monat', example_en: 'Month', example_gu: 'મહિનો', category: 'Alphabet', audio_text: 'M. der Monat' },
      { letter: 'N n', name_de: 'Enn', phonetic_en: 'Enn (standard n)', phonetic_gu: 'એન (જેમ કે "નામ")', example_word: 'der Name', example_en: 'Name', example_gu: 'નામ', category: 'Alphabet', audio_text: 'N. der Name' },
      { letter: 'O o', name_de: 'Oh', phonetic_en: 'Oh (pure round o)', phonetic_gu: 'ઓ (જેમ કે "ઓમ")', example_word: 'die Ordnung', example_en: 'Order / Structure', example_gu: 'વ્યવસ્થા', category: 'Alphabet', audio_text: 'O. die Ordnung' },
      { letter: 'P p', name_de: 'Peh', phonetic_en: 'Pay (aspirated p)', phonetic_gu: 'પે (જેમ કે "પગ")', example_word: 'das Projekt', example_en: 'Project', example_gu: 'પ્રોજેક્ટ', category: 'Alphabet', audio_text: 'P. das Projekt' },
      { letter: 'Q q', name_de: 'Kooh', phonetic_en: 'Koo (pronounced "kv")', phonetic_gu: 'કૂ (સામાન્ય રીતે "ક્વ" બોલાય)', example_word: 'die Qualität', example_en: 'Quality', example_gu: 'ગુણવત્તા', category: 'Alphabet', audio_text: 'Q. die Qualität' },
      { letter: 'R r', name_de: 'Err', phonetic_en: 'Air / Uvular r', phonetic_gu: 'એર (ગળામાંથી ર અવાજ)', example_word: 'die Release', example_en: 'Release', example_gu: 'રિલીઝ', category: 'Alphabet', audio_text: 'R. die Release' },
      { letter: 'S s', name_de: 'Ess', phonetic_en: 'Ess (voiced "z" before vowels, "s" elsewhere)', phonetic_gu: 'એસ (સ્વર પહેલાં ઝ, અન્યથા સ)', example_word: 'die Software', example_en: 'Software', example_gu: 'સોફ્ટવેર', category: 'Alphabet', audio_text: 'S. die Software' },
      { letter: 'T t', name_de: 'Teh', phonetic_en: 'Tay (crisp t)', phonetic_gu: 'ટે (જેમ કે "ટેસ્ટ")', example_word: 'der Test', example_en: 'Test', example_gu: 'પરીક્ષણ / ટેસ્ટ', category: 'Alphabet', audio_text: 'T. der Test' },
      { letter: 'U u', name_de: 'Ooh', phonetic_en: 'Ooh (like "moon")', phonetic_gu: 'ઊ (જેમ કે "ઊંટ")', example_word: 'die Uhr', example_en: 'Clock / O\'clock', example_gu: 'ઘડિયાળ / વાગ્યા', category: 'Alphabet', audio_text: 'U. die Uhr' },
      { letter: 'V v', name_de: 'Fow', phonetic_en: 'Fow (pronounced like English "f")', phonetic_gu: 'ફાઉ (અંગ્રેજી ફ જેવો અવાજ)', example_word: 'der Vertrag', example_en: 'Contract', example_gu: 'કરાર / કોન્ટ્રાક્ટ', category: 'Alphabet', audio_text: 'V. der Vertrag' },
      { letter: 'W w', name_de: 'Veh', phonetic_en: 'Vay (pronounced like English "v")', phonetic_gu: 'વે (અંગ્રેજી વ જેવો અવાજ)', example_word: 'die Woche', example_en: 'Week', example_gu: 'અઠવાડિયું', category: 'Alphabet', audio_text: 'W. die Woche' },
      { letter: 'X x', name_de: 'Iks', phonetic_en: 'Iks (like "fix")', phonetic_gu: 'ઇક્સ (જેમ કે "ક્સ")', example_word: 'die Praxis', example_en: 'Practice / Experience', example_gu: 'અનુભવ / પ્રેક્ટિસ', category: 'Alphabet', audio_text: 'X. die Praxis' },
      { letter: 'Y y', name_de: 'Ypsilon', phonetic_en: 'Üpsilon (rounded lips like ü)', phonetic_gu: 'ઇપ્સિલોન (હોઠ ગોળ રાખીને ઇ)', example_word: 'das System', example_en: 'System', example_gu: 'સિસ્ટમ', category: 'Alphabet', audio_text: 'Y. das System' },
      { letter: 'Z z', name_de: 'Tsett', phonetic_en: 'Tsett (pronounced sharp "ts")', phonetic_gu: 'ત્સેટ (તીખો "ત્સ" અવાજ)', example_word: 'die Zeit', example_en: 'Time', example_gu: 'સમય', category: 'Alphabet', audio_text: 'Z. die Zeit' },

      // German Special Letters (Umlaute & ß)
      { letter: 'Ä ä', name_de: 'A-Umlaut', phonetic_en: 'Ay (like "air" or "bed")', phonetic_gu: 'એ / ઐ (જેમ કે "પૈસા" અથવા "બે")', example_word: 'die Änderung', example_en: 'Change / Modification', example_gu: 'ફેરફાર', category: 'Umlaut', audio_text: 'Ä. die Änderung' },
      { letter: 'Ö ö', name_de: 'O-Umlaut', phonetic_en: 'Ur (round lips and say ay)', phonetic_gu: 'ઓ-ઉમલાઉટ (હોઠ ગોળ કરી એ બોલવું)', example_word: 'öffnen', example_en: 'To open', example_gu: 'ખોલવું', category: 'Umlaut', audio_text: 'Ö. öffnen' },
      { letter: 'Ü ü', name_de: 'U-Umlaut', phonetic_en: 'Ew (round lips and say ee)', phonetic_gu: 'ઊ-ઉમલાઉટ (હોઠ ગોળ કરી ઈ બોલવું)', example_word: 'überprüfen', example_en: 'To verify / check', example_gu: 'તપાસવું / વેરિફાઇ કરવું', category: 'Umlaut', audio_text: 'Ü. überprüfen' },
      { letter: 'ß', name_de: 'Eszett / Scharfes S', phonetic_en: 'Sharp SS (never at start of word)', phonetic_gu: 'તીખો સ (શાર્પ એસ - ક્યારેય શરૂઆતમાં ન આવે)', example_word: 'die Straße', example_en: 'Street', example_gu: 'રસ્તો / શેરી', category: 'Umlaut', audio_text: 'Eszett. die Straße' },

      // Key Diphthongs & Phonics Combinations
      { letter: 'ei', name_de: 'Diphthong EI', phonetic_en: 'Eye (sounds like "my")', phonetic_gu: 'આઇ (જેમ કે "ભાઈ" કે "માય")', example_word: 'die Arbeit', example_en: 'Work / Job', example_gu: 'કામ / નોકરી', category: 'Diphthong', audio_text: 'ei. die Arbeit' },
      { letter: 'ie', name_de: 'Diphthong IE', phonetic_en: 'Ee (long ee like "see")', phonetic_gu: 'ઈ (લાંબી ઈ જેમ કે "ગીત")', example_word: 'wiederholen', example_en: 'To repeat', example_gu: 'પુનરાવર્તન કરવું', category: 'Diphthong', audio_text: 'ie. wiederholen' },
      { letter: 'eu / äu', name_de: 'Diphthong EU', phonetic_en: 'Oy (sounds like "boy")', phonetic_gu: 'ઓય (જેમ કે "બોય")', example_word: 'heute', example_en: 'Today', example_gu: 'આજે', category: 'Diphthong', audio_text: 'eu. heute' },
      { letter: 'ch', name_de: 'CH Sound', phonetic_en: 'Soft "ich" after e/i; Hard "ach" after a/o/u', phonetic_gu: 'નરમ "ખ" (ઈ પછી) અથવા ગળામાંથી "ખ" (આ/ઓ પછી)', example_word: 'ich mache', example_en: 'I do / I make', example_gu: 'હું કરું છું', category: 'Phonics', audio_text: 'ch. ich mache' },
      { letter: 'sch', name_de: 'SCH Sound', phonetic_en: 'Sh (sounds like English "sh")', phonetic_gu: 'શ (જેમ કે "શાંતિ")', example_word: 'schreiben', example_en: 'To write', example_gu: 'લખવું', category: 'Phonics', audio_text: 'sch. schreiben' },
      { letter: 'sp / st', name_de: 'SP / ST Sound', phonetic_en: 'Shp / Sht (at start of word/syllable)', phonetic_gu: 'શ્પ / શ્ટ (શરૂઆતમાં "શ" ઉચ્ચાર થાય)', example_word: 'die Sprache', example_en: 'Language', example_gu: 'ભાષા', category: 'Phonics', audio_text: 'sp. die Sprache' }
    ];

    const insertAlpha = db.prepare(`
      INSERT INTO german_alphabets (letter, name_de, phonetic_en, phonetic_gu, example_word, example_en, example_gu, category, audio_text)
      VALUES (@letter, @name_de, @phonetic_en, @phonetic_gu, @example_word, @example_en, @example_gu, @category, @audio_text)
    `);

    for (const a of seedAlphabets) {
      insertAlpha.run(a);
    }
  }

  // Seed German Lessons (Schritte Plus Neu A1.1 + A1.2 + A2 + B1 progression)
  const lessonCount = db.prepare('SELECT COUNT(*) as count FROM german_lessons').get() as { count: number };
  if (lessonCount.count === 0) {
    const seedLessons = [
      // Stage 0: Foundation
      {
        stage: 'A0',
        lesson_number: 0,
        title_de: 'A0: Alphabet, Umlaute & Lautlehre',
        title_en: 'Alphabet, Umlaute & Phonetics Foundation',
        title_gu: 'મૂળાક્ષરો, ઉમલાઉટ અને ફોનેટિક્સ પાયો',
        textbook_source: 'Schritte Plus Neu A1.1 Vorkurs (Phonetik)',
        grammar_focus_de: 'Die 26 Buchstaben, Umlaute (Ä, Ö, Ü), Eszett (ß), Diphthonge (ei, ie, eu) und die V2-Grundregel.',
        grammar_focus_en: 'The 26 standard letters, 3 Umlaute, ß, key diphthongs, and the fundamental Verb-in-Position-2 rule.',
        grammar_focus_gu: '26 મૂળ અક્ષરો, Ä/Ö/Ü ઉમલાઉટ્સ, શાર્પ સ (ß) અને ક્રિયાપદ બીજા સ્થાને રાખવાનો સુવર્ણ નિયમ.',
        redemittel_de: 'Guten Tag! Ich buchstabiere: K-A-R-A-N. Mein Name ist Karan Joshi.',
        redemittel_en: 'Good day! I spell: K-A-R-A-N. My name is Karan Joshi.',
        redemittel_gu: 'નમસ્તે! મારું નામ કરણ જોશી છે.',
        drill_question: 'Welcher Laut entspricht dem deutschen Diphthong "ei" in "die Arbeit"?',
        drill_options: JSON.stringify(['Wie deutsches "ie" (ee)', 'Wie englisches "eye" (ai)', 'Wie deutsches "eu" (oy)']),
        drill_correct_idx: 1,
        drill_explanation_en: '"ei" in German is always pronounced like the English word "eye" or "my".',
        drill_explanation_gu: 'જર્મનમાં "ei" નો ઉચ્ચાર અંગ્રેજી "eye" (આઇ) જેવો થાય છે.'
      },
      // Stage 1: Schritte Plus Neu A1.1 (Lektionen 1-7)
      {
        stage: 'A1.1',
        lesson_number: 1,
        title_de: 'Lektion 1: Guten Tag & Kennenlernen',
        title_en: 'Greetings, Names & Origin',
        title_gu: 'શુભેચ્છાઓ, નામ અને વતન',
        textbook_source: 'Schritte Plus Neu A1.1 Lektion 1 (S. 8-18)',
        grammar_focus_de: 'Präsens von "heißen, sein, kommen, sprechen"; Personalpronomen ich/du/Sie; W-Fragen (Wer? Wie? Woher?).',
        grammar_focus_en: 'Present tense verbs; subject pronouns ich/du/Sie; question words (Who? How? Where from?).',
        grammar_focus_gu: 'વર્તમાનકાળ ક્રિયાપદો; સર્વનામ ich/du/Sie; પ્રશ્નવાચક શબ્દો (કોણ? કેમ? ક્યાંથી?).',
        redemittel_de: 'Guten Tag, ich heiße Karan Joshi. Ich komme aus Indien und wohne in Berlin.',
        redemittel_en: 'Good day, my name is Karan Joshi. I come from India and live in Berlin.',
        redemittel_gu: 'નમસ્તે, મારું નામ કરણ જોશી છે. હું ભારતથી છું અને બર્લિનમાં રહું છું.',
        drill_question: 'Ergänzen Sie: "Woher _____ Sie, Herr Joshi?"',
        drill_options: JSON.stringify(['kommst', 'kommen', 'kommt']),
        drill_correct_idx: 1,
        drill_explanation_en: 'Formal address "Sie" requires verb ending "-en" (kommen Sie).',
        drill_explanation_gu: 'ઔપચારિક "Sie" સાથે ક્રિયાપદનું રૂપ "kommen" આવે છે.'
      },
      {
        stage: 'A1.1',
        lesson_number: 2,
        title_de: 'Lektion 2: Familie & Sprachen',
        title_en: 'Family, Languages & Possessives',
        title_gu: 'પરિવાર, ભાષાઓ અને માલિકી દર્શક શબ્દો',
        textbook_source: 'Schritte Plus Neu A1.1 Lektion 2 (S. 20-30)',
        grammar_focus_de: 'Possessivartikel im Nominativ: mein/meine, dein/deine; Verben haben und sprechen (Vokalwechsel e ➔ i).',
        grammar_focus_en: 'Possessive articles (my/your); irregular verbs haben (to have) and sprechen (to speak).',
        grammar_focus_gu: 'માલિકી સૂચક mein/meine; અનિયમિત ક્રિયાપદ haben અને sprechen.',
        redemittel_de: 'Das ist mein Kollege. Ich spreche Englisch, Gujarati und lerne jetzt Deutsch.',
        redemittel_en: 'This is my colleague. I speak English, Gujarati, and am now learning German.',
        redemittel_gu: 'આ મારા સાથી કર્મચારી છે. હું અંગ્રેજી અને ગુજરાતી બોલું છું અને જર્મન શીખી રહ્યો છું.',
        drill_question: 'Welche Form ist korrekt? "Karan _____ fließend Englisch."',
        drill_options: JSON.stringify(['sprecht', 'spricht', 'spreche']),
        drill_correct_idx: 1,
        drill_explanation_en: 'Third person singular of sprechen changes vowel: er spricht.',
        drill_explanation_gu: 'ત્રીજો પુરુષ એકવચન er સાથે spricht આવે છે (e બદલાઈને i થાય).'
      },
      {
        stage: 'A1.1',
        lesson_number: 3,
        title_de: 'Lektion 3: Essen, Trinken & Einkaufen',
        title_en: 'Food, Articles & Negation (kein)',
        title_gu: 'ખોરાક, આર્ટિકલ અને નકાર (kein)',
        textbook_source: 'Schritte Plus Neu A1.1 Lektion 3 (S. 32-42)',
        grammar_focus_de: 'Bestimmter Artikel (der, das, die), unbestimmter Artikel (ein, eine, ein), Negation mit kein/keine; Pluralformen.',
        grammar_focus_en: 'Definite vs indefinite articles; noun negation with kein/keine; plural endings.',
        grammar_focus_gu: 'ચોક્કસ અને અનિશ્ચિત આર્ટિકલ; kein દ્વારા નામનો નકાર; બહુવચન રૂપો.',
        redemittel_de: 'Ich trinke gern Kaffee. Wir brauchen noch Brot, aber wir haben keinen Käse.',
        redemittel_en: 'I like drinking coffee. We still need bread, but we have no cheese.',
        redemittel_gu: 'મને કોફી પીવી ગમે છે. આપણને બ્રેડ જોઈએ છે પરંતુ ચીઝ નથી.',
        drill_question: 'Welcher Artikel ist korrekt? "Ich trinke morgens _____ Kaffee (der Kaffee - Akkusativ)."',
        drill_options: JSON.stringify(['einen', 'ein', 'eine']),
        drill_correct_idx: 0,
        drill_explanation_en: 'Masculine noun in accusative takes "einen" (der Kaffee ➔ einen Kaffee).',
        drill_explanation_gu: 'નરજાતિ (der) એકવચનમાં Accusative માં "einen" બને છે.'
      },
      {
        stage: 'A1.1',
        lesson_number: 4,
        title_de: 'Lektion 4: Meine Wohnung & Möbel',
        title_en: 'Housing, Furniture & Akkusativ',
        title_gu: 'ઘર, ફર્નિચર અને અક્યુઝેટિવ',
        textbook_source: 'Schritte Plus Neu A1.1 Lektion 4 (S. 44-54)',
        grammar_focus_de: 'Akkusativ bei Verben (haben, suchen, finden, mieten); Verneinung: nicht vs. kein; Adjektive prädikativ.',
        grammar_focus_en: 'Direct object accusative case; difference between nicht (verbs/adjectives) and kein (nouns).',
        grammar_focus_gu: 'કર્મવિભક્તિ (Akkusativ); nicht અને kein વચ્ચેનો તફાવત; વિશેષણો.',
        redemittel_de: 'Ich suche eine 2-Zimmer-Wohnung in Berlin. Die Miete ist nicht teuer, sie ist günstig.',
        redemittel_en: 'I am looking for a 2-room apartment in Berlin. The rent is not expensive, it is affordable.',
        redemittel_gu: 'હું બર્લિનમાં 2 રૂમનું એપાર્ટમેન્ટ શોધી રહ્યો છું. ભાડું મોંઘું નથી.',
        drill_question: 'Setzen Sie ein: "Karan sucht _____ neuen Schreibtisch (der Schreibtisch)."',
        drill_options: JSON.stringify(['einen', 'ein', 'eine']),
        drill_correct_idx: 0,
        drill_explanation_en: '"der Schreibtisch" in accusative becomes "einen Schreibtisch".',
        drill_explanation_gu: '"der Schreibtisch" કર્મવિભક્તિમાં "einen Schreibtisch" બને છે.'
      },
      {
        stage: 'A1.1',
        lesson_number: 5,
        title_de: 'Lektion 5: Mein Tag & Trennbare Verben',
        title_en: 'Daily Schedule, Clock & Separable Verbs',
        title_gu: 'દિનચર્યા, સમય અને વિભાજ્ય ક્રિયાપદો',
        textbook_source: 'Schritte Plus Neu A1.1 Lektion 5 (S. 56-66)',
        grammar_focus_de: 'Trennbare Verben (aufstehen, anfangen, anrufen, mitbringen); Uhrzeit offiziell & inoffiziell; Zeitangaben (um, am, von...bis).',
        grammar_focus_en: 'Separable prefix verbs (prefix goes to sentence end); telling time; prepositions um/am.',
        grammar_focus_gu: 'છૂટા પડતા ક્રિયાપદો (ઉપસર્ગ વાક્યના છેડે જાય); સમય દર્શાવવો.',
        redemittel_de: 'Unser Daily Scrum fängt um 09:30 Uhr an. Ich stehe um 07:00 Uhr auf.',
        redemittel_en: 'Our Daily Scrum starts at 09:30. I get up at 07:00.',
        redemittel_gu: 'અમારું ડેઇલી સ્ટેન્ડઅપ સવારે 9:30 વાગ્યે શરૂ થાય છે.',
        drill_question: 'Welcher Satz ist korrekt gebaut?',
        drill_options: JSON.stringify([
          'Das Meeting fängt um 10 Uhr an.',
          'Das Meeting anfängt um 10 Uhr.',
          'Das Meeting um 10 Uhr anfangen.'
        ]),
        drill_correct_idx: 0,
        drill_explanation_en: 'Separable verb "anfangen" splits: "fängt" in position 2, prefix "an" at the very end.',
        drill_explanation_gu: 'વિભાજ્ય ક્રિયાપદ "anfangen" માં "fängt" બીજા સ્થાને અને "an" છેલ્લે આવે.'
      },
      {
        stage: 'A1.1',
        lesson_number: 6,
        title_de: 'Lektion 6: Freizeit & Modalverben (können/wollen)',
        title_en: 'Free Time & Modal Verbs (können/wollen)',
        title_gu: 'ફુરસદનો સમય અને મોડલ ક્રિયાપદો',
        textbook_source: 'Schritte Plus Neu A1.1 Lektion 6 (S. 68-78)',
        grammar_focus_de: 'Modalverben im Präsens: können (Fähigkeit) und wollen (Wille/Absicht); Satzklammer (Modalverb V2, Infinitiv am Satzende).',
        grammar_focus_en: 'Modal verbs können and wollen; German modal verb bracket (modal verb in pos 2, infinitive at end).',
        grammar_focus_gu: 'મોડલ ક્રિયાપદો können અને wollen; વાક્યનું બંધારણ (મુખ્ય ક્રિયાપદ છેલ્લે મૂળરૂપમાં).',
        redemittel_de: 'Ich kann Playwright-Tests mit TypeScript schreiben. Ich will in Berlin arbeiten.',
        redemittel_en: 'I can write Playwright tests with TypeScript. I want to work in Berlin.',
        redemittel_gu: 'હું પ્લેરાઈટ ટેસ્ટ્સ લખી શકું છું. હું બર્લિનમાં કામ કરવા માંગુ છું.',
        drill_question: 'Wählen Sie die richtige Satzstellung:',
        drill_options: JSON.stringify([
          'Ich kann automatisierte Tests schreiben.',
          'Ich kann schreiben automatisierte Tests.',
          'Ich will schreibe Tests.'
        ]),
        drill_correct_idx: 0,
        drill_explanation_en: 'Modal verb takes position 2 ("kann"), infinitive goes to the sentence end ("schreiben").',
        drill_explanation_gu: 'મોડલ ક્રિયાપદ (kann) બીજા સ્થાને અને મુખ્ય ક્રિયાપદ (schreiben) વાક્યના અંતે આવે.'
      },
      {
        stage: 'A1.1',
        lesson_number: 7,
        title_de: 'Lektion 7: Lernen, Berufe & Präteritum (war/hatte)',
        title_en: 'Career Background & Simple Past (war/hatte)',
        title_gu: 'કારકિર્દી, ભૂતકાળ (war/hatte) અને müssen',
        textbook_source: 'Schritte Plus Neu A1.1 Lektion 7 (S. 80-90)',
        grammar_focus_de: 'Präteritum von sein (ich war) und haben (ich hatte); Modalverb müssen (Notwendigkeit / Pflicht).',
        grammar_focus_en: 'Simple past of sein (was) and haben (had); modal verb müssen (must/have to).',
        grammar_focus_gu: 'ભૂતકાળ war (હતો) અને hatte (પાસે હતું); મોડલ ક્રિયાપદ müssen (ફરજિયાત હોવું).',
        redemittel_de: 'Vor meiner Ankunft in Berlin war ich Software Tester. Ich muss die Testsuite warten.',
        redemittel_en: 'Before arriving in Berlin I was a software tester. I must maintain the test suite.',
        redemittel_gu: 'બર્લિન આવતા પહેલા હું સોફ્ટવેર ટેસ્ટર હતો.',
        drill_question: 'Ergänzen Sie: "Gestern _____ ich viel zu tun im Test-Lab."',
        drill_options: JSON.stringify(['hatte', 'war', 'habe gehabt']),
        drill_correct_idx: 0,
        drill_explanation_en: '"ich hatte" is the natural simple past for "I had".',
        drill_explanation_gu: '"ich hatte" નો અર્થ "મારી પાસે હતું" થાય છે.'
      },

      // Stage 2: Schritte Plus Neu A1.2 (Lektionen 8-14)
      {
        stage: 'A1.2',
        lesson_number: 8,
        title_de: 'Lektion 8: Beruf, Arbeit & Modalverb dürfen',
        title_en: 'Jobs, Workplace & Permission (dürfen)',
        title_gu: 'કામ, ઓફિસ અને પરવાનગી (dürfen)',
        textbook_source: 'Schritte Plus Neu A1.2 Lektion 8 (S. 8-18)',
        grammar_focus_de: 'Modalverb dürfen (Erlaubnis / Verbot mit nicht); Berufsbezeichnungen weiblich mit -in; formelle Anschreiben.',
        grammar_focus_en: 'Modal verb dürfen (permission / prohibition); job title genders (-in); formal letter formatting.',
        grammar_focus_gu: 'મોડલ ક્રિયાપદ dürfen (પરવાનગી); નોકરીની સ્ત્રીલિંગ પદવીઓ (-in); ફોર્મલ પત્રો.',
        redemittel_de: 'Im Büro darf man während des Deployments keine neuen Commits pushen.',
        redemittel_en: 'In the office one may not push new commits during deployment.',
        redemittel_gu: 'ઓફિસમાં ડિપ્લોયમેન્ટ દરમિયાન નવા કમિટ પુશ કરવાની પરવાનગી નથી.',
        drill_question: 'Was bedeutet: "Hier darf man nicht rauchen"?',
        drill_options: JSON.stringify(['Smoking is mandatory', 'Smoking is prohibited (not allowed)', 'You should smoke']),
        drill_correct_idx: 1,
        drill_explanation_en: '"nicht dürfen" expresses strict prohibition (not allowed).',
        drill_explanation_gu: '"nicht dürfen" નો અર્થ સખત મનાઈ (પ્રતિબંધ) થાય છે.'
      },
      {
        stage: 'A1.2',
        lesson_number: 9,
        title_de: 'Lektion 9: Unterwegs in Berlin & Dativ-Präpositionen',
        title_en: 'Directions & Dative Prepositions (mit, zu, nach)',
        title_gu: 'દિશા-નિર્દેશ અને ડેટિવ પ્રેપોઝિશન્સ',
        textbook_source: 'Schritte Plus Neu A1.2 Lektion 9 (S. 20-30)',
        grammar_focus_de: 'Präpositionen mit Dativ: mit, zu, nach, bei, aus, von; Richtungsangaben (geradeaus, rechts, links abbiegen).',
        grammar_focus_en: 'Prepositions strictly taking Dative case; giving and understanding directions in Berlin.',
        grammar_focus_gu: 'હંમેશા Dative કેસ લેતા પ્રેપોઝિશન્સ (mit, zu, nach, bei, aus, von).',
        redemittel_de: 'Ich fahre mit der U-Bahn U8 zum Vorstellungsgespräch nach Kreuzberg.',
        redemittel_en: 'I travel by U-Bahn U8 to the interview in Kreuzberg.',
        redemittel_gu: 'હું ઇન્ટરવ્યુ માટે U-Bahn U8 દ્વારા ક્રુઝબર્ગ જાઉં છું.',
        drill_question: 'Welche Form ist korrekt? "Ich fahre mit _____ U-Bahn (die U-Bahn)."',
        drill_options: JSON.stringify(['der', 'die', 'den']),
        drill_correct_idx: 0,
        drill_explanation_en: '"mit" demands Dative. Feminine "die" changes to "der" in Dative.',
        drill_explanation_gu: '"mit" હંમેશા Dative લે છે, તેથી સ્ત્રીલિંગ "die" નું "der" બને છે.'
      },
      {
        stage: 'A1.2',
        lesson_number: 10,
        title_de: 'Lektion 10: Gesundheit & Modalverb sollen',
        title_en: 'Health, Doctor Visits & Imperative',
        title_gu: 'આરોગ્ય, ડૉક્ટર મુલાકાત અને સલાહ (sollen)',
        textbook_source: 'Schritte Plus Neu A1.2 Lektion 10 (S. 32-42)',
        grammar_focus_de: 'Imperativ (Kommen Sie! / Mach eine Pause!); Modalverb sollen für Ratschläge; Körperteile & Symptome.',
        grammar_focus_en: 'Imperative mood commands; modal verb sollen for professional recommendations; health vocabulary.',
        grammar_focus_gu: 'આજ્ઞાર્થ વાક્યો; સલાહ આપવા માટે sollen; શારીરિક લક્ષણો.',
        redemittel_de: 'Der Arzt sagt, ich soll mich schonen und eine Bildschirm-Pause einlegen.',
        redemittel_en: 'The doctor says I should rest and take a screen break.',
        redemittel_gu: 'ડૉક્ટર કહે છે કે મારે આરામ કરવો જોઈએ અને સ્ક્રીન બ્રેક લેવો જોઈએ.',
        drill_question: 'Welche Höflichkeitsform des Imperativs ist richtig?',
        drill_options: JSON.stringify(['Trinken Sie viel Wasser!', 'Trinkt Sie viel Wasser!', 'Trinken du viel Wasser!']),
        drill_correct_idx: 0,
        drill_explanation_en: 'Formal imperative inverts verb and pronoun: "Trinken Sie...!"',
        drill_explanation_gu: 'ઔપચારિક આજ્ઞાર્થમાં "Trinken Sie...!" વપરાય છે.'
      },
      {
        stage: 'A1.2',
        lesson_number: 11,
        title_de: 'Lektion 11: In der Stadt & Wechselpräpositionen (Wo? + Dativ)',
        title_en: 'City Locations & Two-Way Prepositions (Dative)',
        title_gu: 'શહેરનાં સ્થળો અને ડેટિવ લોકેશન',
        textbook_source: 'Schritte Plus Neu A1.2 Lektion 11 (S. 44-54)',
        grammar_focus_de: 'Wechselpräpositionen mit Dativ für statische Orte (Wo?): in, an, auf, neben, hinter, über, unter, vor, zwischen.',
        grammar_focus_en: 'Two-way prepositions expressing location (Wo?) always take the Dative case.',
        grammar_focus_gu: 'સ્થિર સ્થાન (Wo? - ક્યાં?) દર્શાવવા માટે પ્રેપોઝિશન સાથે Dative કેસ આવે.',
        redemittel_de: 'Das Bürgeramt liegt neben dem Park. Die QA-Dokumentation liegt auf dem Server.',
        redemittel_en: 'The Bürgeramt is next to the park. The QA docs are on the server.',
        redemittel_gu: 'નાગરિક કાર્યાલય બગીચાની બાજુમાં છે.',
        drill_question: 'Ergänzen Sie: "Der QA-Tester sitzt an _____ Tisch (der Tisch - Wo?)."',
        drill_options: JSON.stringify(['dem (am)', 'den', 'der']),
        drill_correct_idx: 0,
        drill_explanation_en: 'Static location (Wo?) with masculine noun takes Dative: an + dem = am Tisch.',
        drill_explanation_gu: 'સ્થિર સ્થાન (Wo?) માટે નરજાતિમાં Dative: an + dem = am Tisch.'
      },
      {
        stage: 'A1.2',
        lesson_number: 12,
        title_de: 'Lektion 12: Kundenservice & Personalpronomen (Akkusativ)',
        title_en: 'Customer Service & Accusative Pronouns',
        title_gu: 'ગ્રાહક સેવા અને અક્યુઝેટિવ સર્વનામો',
        textbook_source: 'Schritte Plus Neu A1.2 Lektion 12 (S. 56-66)',
        grammar_focus_de: 'Personalpronomen im Akkusativ: mich, dich, ihn, sie, es, uns, euch, sie/Sie; Demonstrativpronomen dieser/diese/dieses.',
        grammar_focus_en: 'Direct object accusative pronouns; demonstrative determiners (this/these).',
        grammar_focus_gu: 'કર્મવિભક્તિના સર્વનામો (મને, તને, તેને, અમને).',
        redemittel_de: 'Können Sie mich bitte informieren, wenn der Fehler behoben ist?',
        redemittel_en: 'Could you please inform me when the bug is resolved?',
        redemittel_gu: 'જ્યારે એરર ઉકેલાઈ જાય ત્યારે શું તમે કૃપા કરીને મને જણાવી શકશો?',
        drill_question: 'Ersetzen Sie: "Der Product Owner ruft den Entwickler (er) an" ➔ "Der PO ruft _____ an."',
        drill_options: JSON.stringify(['ihn', 'ihm', 'er']),
        drill_correct_idx: 0,
        drill_explanation_en: 'Masculine singular in accusative pronoun is "ihn".',
        drill_explanation_gu: 'નરજાતિ કર્મવિભક્તિ સર્વનામ "ihn" (તેને) છે.'
      },
      {
        stage: 'A1.2',
        lesson_number: 13,
        title_de: 'Lektion 13: Kleidung, Gefallen & Dativ-Verben',
        title_en: 'Preferences & Dative Verbs (helfen, gefallen)',
        title_gu: 'પસંદગી અને ડેટિવ ક્રિયાપદો (helfen, gefallen)',
        textbook_source: 'Schritte Plus Neu A1.2 Lektion 13 (S. 68-78)',
        grammar_focus_de: 'Dativ-Verben: gefallen, helfen, passen, schmecken; Personalpronomen im Dativ: mir, dir, ihm, ihr, uns, euch, ihnen/Ihnen.',
        grammar_focus_en: 'Special verbs governing dative objects; dative pronouns (to me, to you, to him).',
        grammar_focus_gu: 'ખાસ Dative ક્રિયાપદો જેમ કે helfen, gefallen; Dative સર્વનામો.',
        redemittel_de: 'Der Lead QA hilft mir bei den komplexen Playwright-Konfigurationen.',
        redemittel_en: 'The Lead QA helps me with complex Playwright configurations.',
        redemittel_gu: 'લીડ QA મને જટિલ પ્લેરાઇટ કોન્ફિગરેશનમાં મદદ કરે છે.',
        drill_question: 'Welches Pronomen passt? "Die neue Software-Architektur gefällt _____ (ich) sehr gut."',
        drill_options: JSON.stringify(['mir', 'mich', 'meiner']),
        drill_correct_idx: 0,
        drill_explanation_en: 'The verb "gefallen" takes a dative object: gefällt mir.',
        drill_explanation_gu: '"gefallen" સાથે હંમેશા Dative આવે: gefällt mir (મને ગમે છે).'
      },
      {
        stage: 'A1.2',
        lesson_number: 14,
        title_de: 'Lektion 14: Feste, Feiern & Das Perfekt (Vergangenheit)',
        title_en: 'Celebrations & The Conversational Past (Perfekt)',
        title_gu: 'ઉજવણી અને પૂર્ણ વર્તમાનકાળ (Perfekt)',
        textbook_source: 'Schritte Plus Neu A1.2 Lektion 14 (S. 80-90)',
        grammar_focus_de: 'Das Perfekt mit haben und sein; Partizip II regelmäßiger (ge- -t) und unregelmäßiger Verben (ge- -en); Vergangenes berichten.',
        grammar_focus_en: 'German conversational past tense with haben/sein auxiliary and Partizip II at end.',
        grammar_focus_gu: 'જર્મન બોલચાલનો ભૂતકાળ (Perfekt) - haben/sein અને વાક્યના છેડે Partizip II.',
        redemittel_de: 'Gestern habe ich alle End-to-End-Tests automatisiert und den Pull Request erstellt.',
        redemittel_en: 'Yesterday I automated all E2E tests and created the pull request.',
        redemittel_gu: 'ગઈકાલે મેં બધા એન્ડ-ટુ-એન્ડ ટેસ્ટ્સ ઓટોમેટ કર્યા અને પુલ રિક્વેસ્ટ બનાવી.',
        drill_question: 'Welches Hilfsverb gehört in die Lücke? "Karan _____ nach Berlin gereist."',
        drill_options: JSON.stringify(['ist', 'hat', 'wird']),
        drill_correct_idx: 0,
        drill_explanation_en: 'Verbs of movement and location change (reisen) form Perfekt with "sein" (ist gereist).',
        drill_explanation_gu: 'ગતિશીલતા દર્શાવતા ક્રિયાપદો (reisen) સાથે "sein" (ist) આવે છે.'
      },

      // Stage 3: CEFR A2 (Lektionen 15-17)
      {
        stage: 'A2',
        lesson_number: 15,
        title_de: 'Lektion 15: Bürgeramt, Anmeldung & Behörden in Berlin',
        title_en: 'Berlin Bureaucracy, Anmeldung & City Registration',
        title_gu: 'બર્લિન નાગરિક વહીવટ અને અન્મેલ્ડંગ',
        textbook_source: 'CEFR A2 Beruf & Alltag in Deutschland',
        grammar_focus_de: 'Wechselpräpositionen Akkusativ (Wohin?) vs Dativ (Wo?); formelle Dokumente und Ämter-Wortschatz.',
        grammar_focus_en: 'Two-way prepositions movement (Akkusativ) vs static (Dativ); official registration vocabulary.',
        grammar_focus_gu: 'દિશા/ગતિ માટે Akkusativ, સ્થિરતા માટે Dativ; સરકારી દસ્તાવેજો.',
        redemittel_de: 'Ich gehe in das Bürgeramt (Wohin? Akk). Ich warte im Bürgeramt (Wo? Dativ).',
        redemittel_en: 'I go into the Bürgeramt (movement). I wait in the Bürgeramt (location).',
        redemittel_gu: 'હું બુર્ગેરઆમ્ટ જાઉં છું (ગતિ). હું બુર્ગેરઆમ્ટમાં રાહ જોઉં છું (સ્થિર).',
        drill_question: 'Wohin gehst du? "Ich gehe in _____ Konferenzraum (der Raum)."',
        drill_options: JSON.stringify(['den', 'dem', 'der']),
        drill_correct_idx: 0,
        drill_explanation_en: '"Wohin?" (movement) takes Accusative: in + den = in den Raum.',
        drill_explanation_gu: '"Wohin?" ગતિ દર્શાવે છે, તેથી નરજાતિમાં Akkusativ: "den Raum".'
      },
      {
        stage: 'A2',
        lesson_number: 16,
        title_de: 'Lektion 16: Kausal- und Objektsätze (weil & dass)',
        title_en: 'Subordinate Clauses with "weil" and "dass"',
        title_gu: 'ગૌણ વાક્યો ("weil" અને "dass" - ક્રિયાપદ છેલ્લે)',
        textbook_source: 'CEFR A2 Satzbau & Konjunktionen',
        grammar_focus_de: 'Nebensätze mit weil (Grund) und dass (Aussage): Das konjugierte finite Verb steht zwingend am Satzende!',
        grammar_focus_en: 'Subordinating conjunctions weil and dass send the conjugated verb to the very end of the clause.',
        grammar_focus_gu: 'કારણ દર્શક (weil) અને વિધાન (dass) વાક્યોમાં ક્રિયાપદ હંમેશા વાક્યના અંતે આવે છે.',
        redemittel_de: 'Ich freue mich, weil ich eine Einladung zum Vorstellungsgespräch erhalten habe.',
        redemittel_en: 'I am happy because I received an invitation for a job interview.',
        redemittel_gu: 'હું ખુશ છું કારણ કે મને જોબ ઇન્ટરવ્યુનું આમંત્રણ મળ્યું છે.',
        drill_question: 'Welcher Nebensatz ist grammatikalisch korrekt?',
        drill_options: JSON.stringify([
          '... weil der Regression-Test erfolgreich war.',
          '... weil war der Regression-Test erfolgreich.',
          '... weil der Regression-Test war erfolgreich.'
        ]),
        drill_correct_idx: 0,
        drill_explanation_en: 'In German subordinate clauses with "weil", the conjugated verb ("war") goes to the very end.',
        drill_explanation_gu: '"weil" સાથેના વાક્યમાં ક્રિયાપદ ("war") વાક્યના છેલ્લે આવે છે.'
      },
      {
        stage: 'A2',
        lesson_number: 17,
        title_de: 'Lektion 17: Reflexivverben & QA Bug-Triage',
        title_en: 'Reflexive Verbs & Technical Bug Triage',
        title_gu: 'રીફ્લેક્સિવ ક્રિયાપદો અને QA બગ ટ્રીઆજ',
        textbook_source: 'CEFR A2 IT-Berufswelt',
        grammar_focus_de: 'Reflexive Verben (sich bewerben, sich freuen, sich ärgern über + Akk, sich konzentrieren auf + Akk).',
        grammar_focus_en: 'Reflexive verbs with reflexive pronouns (mich/dich/sich) and fixed prepositions.',
        grammar_focus_gu: 'સ્વયંવાચક ક્રિયાપદો (sich bewerben, sich konzentrieren) અને ચોક્કસ પ્રેપોઝિશન્સ.',
        redemittel_de: 'Ich bewerbe mich bei innovativen Berliner Tech-Unternehmen als Software Test Engineer.',
        redemittel_en: 'I apply to innovative Berlin tech companies as a Software Test Engineer.',
        redemittel_gu: 'હું બર્લિનની ટેક કંપનીઓમાં સોફ્ટવેર ટેસ્ટ એન્જિનિયર તરીકે અરજી કરું છું.',
        drill_question: 'Ergänzen Sie: "Karan bewirbt _____ auf die QA-Stelle."',
        drill_options: JSON.stringify(['sich', 'ihn', 'ihm']),
        drill_correct_idx: 0,
        drill_explanation_en: 'Third person reflexive pronoun for "er/sie" is always "sich".',
        drill_explanation_gu: 'ત્રીજા પુરુષ (Karan/er) માટે રીફ્લેક્સિવ સર્વનામ હંમેશા "sich" થાય છે.'
      },

      // Stage 4: CEFR B1 (Lektionen 18-20)
      {
        stage: 'B1',
        lesson_number: 18,
        title_de: 'Lektion 18: Konzessiv- & Finalsätze (obwohl & um... zu)',
        title_en: 'Concession & Purpose (obwohl / um... zu)',
        title_gu: 'વિરોધાભાસ અને હેતુદર્શક વાક્યો (obwohl / um... zu)',
        textbook_source: 'CEFR B1 Goethe Prüfungstraining',
        grammar_focus_de: 'Subjunktion obwohl (Konzessivsatz) vs Infinitivkonstruktion um... zu + Infinitiv (Ziel / Absicht).',
        grammar_focus_en: 'Concessive clauses with obwohl (although); purpose infinitive with um... zu (in order to).',
        grammar_focus_gu: 'જોકે / છતાં પણ (obwohl) અને હેતુ દર્શાવવા માટે (um... zu).',
        redemittel_de: 'Obwohl der Fehler komplex war, hat das QA-Team die Ursache schnell identifiziert.',
        redemittel_en: 'Although the bug was complex, the QA team quickly identified the root cause.',
        redemittel_gu: 'જોકે ભૂલ જટિલ હતી, છતાં QA ટીમે મૂળ કારણ ઝડપથી શોધી કાઢ્યું.',
        drill_question: 'Verbinden Sie sinnvoll: "Ich automatisiere Tests, _____ Bugs frühzeitig zu finden."',
        drill_options: JSON.stringify(['um', 'weil', 'dass']),
        drill_correct_idx: 0,
        drill_explanation_en: '"um... zu + Infinitiv" expresses intention or goal ("in order to find").',
        drill_explanation_gu: 'હેતુ દર્શાવવા "um... zu" વપરાય છે ("બગ્સ વહેલા શોધવા માટે").'
      },
      {
        stage: 'B1',
        lesson_number: 19,
        title_de: 'Lektion 19: Das Passiv (Präsens & Präteritum in der IT)',
        title_en: 'Passive Voice in Technical Workflows',
        title_gu: 'કર્મણિ પ્રયોગ (Passiv) ટેકનિકલ વર્કફ્લોમાં',
        textbook_source: 'CEFR B1 Fachsprache IT & Technik',
        grammar_focus_de: 'Passiv Präsens (wird + Partizip II) und Passiv Präteritum (wurde + Partizip II). Handlung steht im Vordergrund.',
        grammar_focus_en: 'Passive voice in technical contexts where action/process is highlighted over the actor.',
        grammar_focus_gu: 'જર્મન કર્મણિ પ્રયોગ (Passiv) - wird/wurde + Partizip II.',
        redemittel_de: 'Vor jedem Release wird die Regression-Suite auf allen Browsern automatisch ausgeführt.',
        redemittel_en: 'Before every release, the regression suite is executed automatically across all browsers.',
        redemittel_gu: 'દરેક રીલીઝ પહેલાં, રીગ્રેશન ટેસ્ટ આપોઆપ ચલાવવામાં આવે છે.',
        drill_question: 'Wandeln Sie ins Passiv: "Der Tester findet den Fehler."',
        drill_options: JSON.stringify([
          'Der Fehler wird vom Tester gefunden.',
          'Der Fehler wurde der Tester gefunden.',
          'Der Tester wird den Fehler finden.'
        ]),
        drill_correct_idx: 0,
        drill_explanation_en: 'Passiv Präsens: subject becomes patient + "wird" + Partizip II ("gefunden").',
        drill_explanation_gu: 'કર્મણિ વાક્ય રચના: "Der Fehler wird gefunden."'
      },
      {
        stage: 'B1',
        lesson_number: 20,
        title_de: 'Lektion 20: Konjunktiv II & Goethe B1 Redemittel',
        title_en: 'Subjunctive II & Goethe B1 Exam Mastery',
        title_gu: 'નમ્રતાપૂર્ણ વિનંતીઓ (Konjunktiv II) અને B1 પરીક્ષા',
        textbook_source: 'CEFR B1 Goethe-Zertifikat B1 Prüfungsvorbereitung',
        grammar_focus_de: 'Konjunktiv II der Höflichkeit & Wünsche (hätte, wäre, würde + Infinitiv, könnte); Goethe B1 Redemittel für Vortrag & Diskussion.',
        grammar_focus_en: 'Subjunctive II for polite requests and professional job interview discourse; B1 presentation phrases.',
        grammar_focus_gu: 'નમ્ર ભાષા અને જોબ ઇન્ટરવ્યુ માટે Konjunktiv II (હું ઈચ્છીશ, શું તમે કરી શકશો).',
        redemittel_de: 'Ich würde mich sehr freuen, wenn ich mich in einem persönlichen Gespräch vorstellen könnte.',
        redemittel_en: 'I would be very pleased if I could introduce myself in a personal interview.',
        redemittel_gu: 'જો મને રૂબરૂ ઇન્ટરવ્યુમાં પરિચય આપવાની તક મળે તો મને ખૂબ આનંદ થશે.',
        drill_question: 'Welche Formulierung ist am höflichsten für ein Anschreiben?',
        drill_options: JSON.stringify([
          'Ich würde mich über ein persönliches Gespräch freuen.',
          'Ich will ein persönliches Gespräch haben.',
          'Geben Sie mir ein Gespräch!'
        ]),
        drill_correct_idx: 0,
        drill_explanation_en: 'Konjunktiv II ("würde mich freuen") is the gold standard for formal German job applications.',
        drill_explanation_gu: 'જર્મન જોબ એપ્લિકેશનમાં નમ્રતા માટે Konjunktiv II ("würde mich freuen") શ્રેષ્ઠ છે.'
      }
    ];

    const insertLesson = db.prepare(`
      INSERT INTO german_lessons (
        stage, lesson_number, title_de, title_en, title_gu, textbook_source,
        grammar_focus_de, grammar_focus_en, grammar_focus_gu,
        redemittel_de, redemittel_en, redemittel_gu,
        drill_question, drill_options, drill_correct_idx,
        drill_explanation_en, drill_explanation_gu
      ) VALUES (
        @stage, @lesson_number, @title_de, @title_en, @title_gu, @textbook_source,
        @grammar_focus_de, @grammar_focus_en, @grammar_focus_gu,
        @redemittel_de, @redemittel_en, @redemittel_gu,
        @drill_question, @drill_options, @drill_correct_idx,
        @drill_explanation_en, @drill_explanation_gu
      )
    `);

    for (const l of seedLessons) {
      insertLesson.run(l);
    }
  }

  // Seed or enrich German vocabulary with Schritte Plus Neu units and Berlin QA life
  const vocabItems = [
    // Schritte A1.1 Lektion 1-7
    { german: 'Name', article: 'der', plural: 'die Namen', english: 'Name', gujarati: 'નામ', cefr_level: 'A1', category: 'Schritte A1.1', example_sentence: 'Mein Name ist Karan Joshi.' },
    { german: 'Sprache', article: 'die', plural: 'die Sprachen', english: 'Language', gujarati: 'ભાષા', cefr_level: 'A1', category: 'Schritte A1.1', example_sentence: 'Ich lerne die deutsche Sprache.' },
    { german: 'Kaffee', article: 'der', plural: 'die Kaffees', english: 'Coffee', gujarati: 'કોફી', cefr_level: 'A1', category: 'Schritte A1.1', example_sentence: 'Ich trinke morgens einen Kaffee.' },
    { german: 'Brot', article: 'das', plural: 'die Brote', english: 'Bread', gujarati: 'બ્રેડ / રોટલી', cefr_level: 'A1', category: 'Schritte A1.1', example_sentence: 'Wir kaufen frisches Brot im Supermarkt.' },
    { german: 'Wohnung', article: 'die', plural: 'die Wohnungen', english: 'Apartment', gujarati: 'ઘર / એપાર્ટમેન્ટ', cefr_level: 'A1', category: 'Schritte A1.1', example_sentence: 'Ich suche eine Wohnung in Berlin.' },
    { german: 'Zimmer', article: 'das', plural: 'die Zimmer', english: 'Room', gujarati: 'રૂમ / ઓરડો', cefr_level: 'A1', category: 'Schritte A1.1', example_sentence: 'Das Zimmer ist hell und ruhig.' },
    { german: 'Uhrzeit', article: 'die', plural: 'die Uhrzeiten', english: 'Time / Clock time', gujarati: 'સમય', cefr_level: 'A1', category: 'Schritte A1.1', example_sentence: 'Wie viel Uhr ist es jetzt?' },
    { german: 'Termin', article: 'der', plural: 'die Termine', english: 'Appointment / Meeting', gujarati: 'મુલાકાત / એપોઇન્ટમેન્ટ', cefr_level: 'A1', category: 'Schritte A1.1', example_sentence: 'Ich habe einen wichtigen Termin um 14 Uhr.' },

    // Schritte A1.2 Lektion 8-14
    { german: 'Arbeit', article: 'die', plural: 'die Arbeiten', english: 'Work / Job', gujarati: 'કામ / નોકરી', cefr_level: 'A1', category: 'Schritte A1.2', example_sentence: 'Meine Arbeit im QA-Bereich macht mir viel Spaß.' },
    { german: 'Kollege', article: 'der', plural: 'die Kollegen', english: 'Colleague (male)', gujarati: 'સહકર્મી / સાથીદાર', cefr_level: 'A1', category: 'Schritte A1.2', example_sentence: 'Mein Kollege hilft mir bei der Bug-Analyse.' },
    { german: 'U-Bahn', article: 'die', plural: 'die U-Bahnen', english: 'Subway / Metro', gujarati: 'મેટ્રો ટ્રેન', cefr_level: 'A1', category: 'Schritte A1.2', example_sentence: 'Ich fahre mit der U-Bahn zur Arbeit.' },
    { german: 'Bahnhof', article: 'der', plural: 'die Bahnhöfe', english: 'Train Station', gujarati: 'રેલવે સ્ટેશન', cefr_level: 'A1', category: 'Schritte A1.2', example_sentence: 'Der Berliner Hauptbahnhof ist sehr groß.' },
    { german: 'Arzt', article: 'der', plural: 'die Ärzte', english: 'Doctor', gujarati: 'ડૉક્ટર', cefr_level: 'A1', category: 'Schritte A1.2', example_sentence: 'Ich brauche einen Termin beim Arzt.' },
    { german: 'Rechnung', article: 'die', plural: 'die Rechnungen', english: 'Invoice / Bill', gujarati: 'બિલ / ઇનવોઇસ', cefr_level: 'A1', category: 'Schritte A1.2', example_sentence: 'Bitte schicken Sie mir die Rechnung per E-Mail.' },

    // Berlin Administration & Life (A2)
    { german: 'Bürgeramt', article: 'das', plural: 'die Bürgerämter', english: 'Citizens Registration Office', gujarati: 'નાગરિક નોંધણી કચેરી (બર્લિન)', cefr_level: 'A2', category: 'Berlin Life', example_sentence: 'Ich brauche einen Termin beim Bürgeramt für die Anmeldung.' },
    { german: 'Anmeldung', article: 'die', plural: 'die Anmeldungen', english: 'Official Address Registration', gujarati: 'સત્તાવાર સરનામાની નોંધણી (અન્મેલ્ડંગ)', cefr_level: 'A2', category: 'Berlin Life', example_sentence: 'Die Anmeldung im Bürgeramt ist in den ersten 14 Tagen Pflicht.' },
    { german: 'Wohnungsgeberbestätigung', article: 'die', plural: 'die Wohnungsgeberbestätigungen', english: 'Landlord Confirmation Form', gujarati: 'મકાનમાલિક દ્વારા અપાતું પ્રમાણપત્ર', cefr_level: 'A2', category: 'Berlin Life', example_sentence: 'Der Vermieter hat mir die Wohnungsgeberbestätigung unterschrieben.' },
    { german: 'Warmmiete', article: 'die', plural: 'die Warmmieten', english: 'Warm rent (including heating & utilities)', gujarati: 'હીટિંગ અને યુટિલિટી સાથેનું કુલ ભાડું', cefr_level: 'A2', category: 'Berlin Life', example_sentence: 'Die Warmmiete für das WG-Zimmer beträgt 650 Euro.' },
    { german: 'Krankenkasse', article: 'die', plural: 'die Krankenkassen', english: 'Health Insurance Company', gujarati: 'આરોગ્ય વીમા કંપની', cefr_level: 'A2', category: 'Berlin Life', example_sentence: 'Für das Arbeitsvisum benötige ich eine Bestätigung der Krankenkasse.' },

    // IT & Software QA Testing (A1-B1)
    { german: 'Fehler', article: 'der', plural: 'die Fehler', english: 'Bug / Defect', gujarati: 'ખામી / ક્ષતિ', cefr_level: 'A1', category: 'IT/QA', example_sentence: 'Ich habe einen kritischen Fehler in Jira dokumentiert.' },
    { german: 'Testfall', article: 'der', plural: 'die Testfälle', english: 'Test Case', gujarati: 'ટેસ્ટ કેસ', cefr_level: 'A1', category: 'IT/QA', example_sentence: 'Dieser Testfall überprüft die Anmeldung.' },
    { german: 'Schaltfläche', article: 'die', plural: 'die Schaltflächen', english: 'Button / UI Control', gujarati: 'બટન', cefr_level: 'A1', category: 'IT/QA', example_sentence: 'Die Schaltfläche reagiert nach dem Klick nicht.' },
    { german: 'Ergebnis', article: 'das', plural: 'die Ergebnisse', english: 'Result / Outcome', gujarati: 'પરિણામ', cefr_level: 'A2', category: 'IT/QA', example_sentence: 'Das tatsächliche Ergebnis stimmt nicht mit dem erwarteten Ergebnis überein.' },
    { german: 'Anforderung', article: 'die', plural: 'die Anforderungen', english: 'Requirement', gujarati: 'જરૂરિયાત / રિક્વાયરમેન્ટ', cefr_level: 'B1', category: 'IT/QA', example_sentence: 'Die neuen Anforderungen wurden im Sprint Backlog definiert.' },
    { german: 'Regression', article: 'die', plural: 'die Regressionen', english: 'Regression Testing', gujarati: 'રીગ્રેશન ટેસ્ટિંગ', cefr_level: 'B1', category: 'IT/QA', example_sentence: 'Vor dem Release führen wir automatische Regressionstests aus.' },
    { german: 'Bereitstellung', article: 'die', plural: 'die Bereitstellungen', english: 'Deployment / Release', gujarati: 'ડિપ્લોયમેન્ટ / રીલીઝ', cefr_level: 'B1', category: 'IT/QA', example_sentence: 'Die Bereitstellung auf dem Staging-Server verlief erfolgreich.' },
    { german: 'Vorstellungsgespräch', article: 'das', plural: 'die Vorstellungsgespräche', english: 'Job Interview', gujarati: 'નોકરીનો ઇન્ટરવ્યુ', cefr_level: 'B1', category: 'Career', example_sentence: 'Morgen habe ich ein Vorstellungsgespräch für eine QA-Stelle in Berlin.' }
  ];

  const updateVocab = db.prepare(`
    UPDATE german_vocab SET gujarati = @gujarati WHERE german = @german
  `);
  const insertVocab = db.prepare(`
    INSERT INTO german_vocab (german, article, plural, english, gujarati, cefr_level, category, example_sentence)
    VALUES (@german, @article, @plural, @english, @gujarati, @cefr_level, @category, @example_sentence)
  `);

  const existingVocabCount = db.prepare('SELECT COUNT(*) as count FROM german_vocab').get() as { count: number };
  if (existingVocabCount.count === 0) {
    for (const v of vocabItems) {
      insertVocab.run(v);
    }
  } else {
    // Update existing vocab rows with gujarati translations
    for (const v of vocabItems) {
      const res = updateVocab.run(v);
      if (res.changes === 0) {
        insertVocab.run(v);
      }
    }
  }

  // Seed initial Playwright snippets if empty
  const snippetCount = db.prepare('SELECT COUNT(*) as count FROM playwright_snippets').get() as { count: number };
  if (snippetCount.count === 0) {
    const seedSnippets = [
      {
        title: 'User-Facing Locators (Best Practice)',
        category: 'Locators',
        code: `// Prefer user-facing locators over CSS/XPath selectors\nawait page.getByRole('button', { name: 'Submit' }).click();\nawait page.getByLabel('Password').fill('secret');\nawait page.getByPlaceholder('Search jobs...').press('Enter');\nawait expect(page.getByText('Application sent')).toBeVisible();`,
        explanation: 'Recommended Playwright locator strategy prioritizing accessibility and test resilience.',
        tags: 'locators, accessibility, best-practice'
      },
      {
        title: 'Mocking Network API Responses',
        category: 'Network',
        code: `// Intercept API endpoint and return mock JSON\nawait page.route('**/api/jobs', async (route) => {\n  const json = [{ id: 1, title: 'QA Engineer', company: 'Berlin Tech' }];\n  await route.fulfill({ json });\n});\nawait page.goto('/jobs');`,
        explanation: 'Simulates backend responses to test frontend edge cases and offline states.',
        tags: 'network, route, mock, api'
      },
      {
        title: 'Handling Async Spinners & Loaders',
        category: 'Async/Timing',
        code: `// Wait for loading indicator to detach before asserting content\nconst spinner = page.getByTestId('loading-spinner');\nawait expect(spinner).toBeHidden({ timeout: 10000 });\nawait expect(page.getByRole('table')).toBeVisible();`,
        explanation: 'Avoids flaky tests by waiting for asynchronous state transitions.',
        tags: 'async, wait, spinner, timeout'
      },
      {
        title: 'Page Object Model (POM) Template',
        category: 'POM',
        code: `import { Page, Locator, expect } from '@playwright/test';\n\nexport class LoginPage {\n  readonly page: Page;\n  readonly usernameInput: Locator;\n  readonly passwordInput: Locator;\n  readonly loginButton: Locator;\n\n  constructor(page: Page) {\n    this.page = page;\n    this.usernameInput = page.getByLabel('Username');\n    this.passwordInput = page.getByLabel('Password');\n    this.loginButton = page.getByRole('button', { name: 'Log in' });\n  }\n\n  async login(user: string, pass: string) {\n    await this.usernameInput.fill(user);\n    await this.passwordInput.fill(pass);\n    await this.loginButton.click();\n  }\n}`,
        explanation: 'Clean encapsulation of UI structure for reusable test suites.',
        tags: 'pom, typescript, architecture'
      }
    ];

    const insertSnippet = db.prepare(`
      INSERT INTO playwright_snippets (title, category, code, explanation, tags)
      VALUES (@title, @category, @code, @explanation, @tags)
    `);

    for (const s of seedSnippets) {
      insertSnippet.run(s);
    }
  }
}
