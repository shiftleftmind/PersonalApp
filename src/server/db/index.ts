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

  // Seed or enrich German vocabulary with Gujarati translations
  const vocabItems = [
    { german: 'Fehler', article: 'der', plural: 'die Fehler', english: 'Bug / Defect', gujarati: 'ખામી / ક્ષતિ', cefr_level: 'A1', category: 'IT/QA', example_sentence: 'Ich habe einen kritischen Fehler in Jira dokumentiert.' },
    { german: 'Testfall', article: 'der', plural: 'die Testfälle', english: 'Test Case', gujarati: 'ટેસ્ટ કેસ', cefr_level: 'A1', category: 'IT/QA', example_sentence: 'Dieser Testfall überprüft die Anmeldung.' },
    { german: 'Ergebnis', article: 'das', plural: 'die Ergebnisse', english: 'Result / Outcome', gujarati: 'પરિણામ', cefr_level: 'A2', category: 'IT/QA', example_sentence: 'Das tatsächliche Ergebnis stimmt nicht mit dem erwarteten Ergebnis überein.' },
    { german: 'Anforderung', article: 'die', plural: 'die Anforderungen', english: 'Requirement', gujarati: 'જરૂરિયાત / રિક્વાયરમેન્ટ', cefr_level: 'B1', category: 'IT/QA', example_sentence: 'Die neuen Anforderungen wurden im Sprint Backlog definiert.' },
    { german: 'Schaltfläche', article: 'die', plural: 'die Schaltflächen', english: 'Button', gujarati: 'બટન', cefr_level: 'A1', category: 'IT/QA', example_sentence: 'Die Schaltfläche reagiert nach dem Klick nicht.' },
    { german: 'Bürgeramt', article: 'das', plural: 'die Bürgerämter', english: 'Citizens Registration Office', gujarati: 'નાગરિક નોંધણી કચેરી (બર્લિન)', cefr_level: 'A1', category: 'Berlin Life', example_sentence: 'Ich brauche einen Termin beim Bürgeramt für die Anmeldung.' },
    { german: 'Wohnung', article: 'die', plural: 'die Wohnungen', english: 'Apartment', gujarati: 'ઘર / એપાર્ટમેન્ટ', cefr_level: 'A1', category: 'Berlin Life', example_sentence: 'Ich suche eine Wohnung in Berlin.' },
    { german: 'Vorstellungsgespräch', article: 'das', plural: 'die Vorstellungsgespräche', english: 'Job Interview', gujarati: 'નોકરીનો ઇન્ટરવ્યુ', cefr_level: 'A2', category: 'Career', example_sentence: 'Morgen habe ich ein Vorstellungsgespräch für eine QA-Stelle.' }
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
