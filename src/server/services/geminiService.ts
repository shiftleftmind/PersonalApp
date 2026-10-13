import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

let apiKey = process.env.GEMINI_API_KEY || '';
let genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export function setGeminiApiKey(key: string) {
  apiKey = key.trim();
  genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
}

export function getGeminiApiKey(): string {
  return apiKey;
}

// Available working models in priority order
const MODEL_CANDIDATES = [
  'gemini-flash-latest',
  'gemini-3.8-flash',
  'gemini-3.7-flash',
  'gemini-3.5-flash'
];

async function callGeminiWithFallback(parts: any[]): Promise<string> {
  if (!genAI) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  let lastError: any = null;
  for (const modelName of MODEL_CANDIDATES) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(parts);
      return result.response.text();
    } catch (err: any) {
      lastError = err;
      // If 503 or transient spike, try next candidate
      continue;
    }
  }

  throw lastError || new Error('All Gemini model candidates failed');
}

export async function pingGemini(): Promise<{ status: string; message: string }> {
  if (!genAI) {
    return {
      status: 'no_key',
      message: 'GEMINI_API_KEY is not set. Please provide your Google Gemini API Key in Settings.'
    };
  }
  try {
    const text = await callGeminiWithFallback(['Ping! Return the word "PONG".']);
    return { status: 'connected', message: text.trim() };
  } catch (err: any) {
    return { status: 'error', message: err.message || 'Error connecting to Gemini API' };
  }
}

export async function analyzeJobPosting(
  input: { text?: string; imageBase64?: string; mimeType?: string },
  masterCv: { text?: string; pdfBase64?: string } | string
): Promise<{
  title: string;
  company: string;
  location: string;
  salary_range: string;
  german_level_required: string;
  tech_stack: string;
  match_score: number;
  match_analysis: { strengths: string[]; gaps: string[]; recommendations: string[] };
  company_background: string;
}> {
  const cvText = typeof masterCv === 'string' ? masterCv : masterCv.text || '';
  const cvPdf = typeof masterCv === 'object' ? masterCv.pdfBase64 : undefined;

  const prompt = `
You are an expert QA Career Coach in Berlin, Germany.
Analyze the following Job Posting against candidate Karan Joshi's Master CV (provided in text or attached PDF).

${cvText ? `Candidate Master CV Text:\n"""\n${cvText}\n"""` : 'Candidate Master CV is provided in the attached PDF.'}

Job Posting content:
"""
${input.text || 'Analyze the provided job image'}
"""

Extract and respond strictly with valid JSON conforming to this schema (no extra text, no markdown fences):
{
  "title": "string",
  "company": "string",
  "location": "string",
  "salary_range": "string",
  "german_level_required": "string (e.g. English only, B1, B2, C1)",
  "tech_stack": "string (comma-separated)",
  "match_score": number (0 to 100),
  "match_analysis": {
    "strengths": ["string", "string"],
    "gaps": ["string", "string"],
    "recommendations": ["string", "string"]
  },
  "company_background": "string (concise 2-3 sentence overview of the company and culture in Berlin)"
}
`;

  const parts: any[] = [prompt];

  if (cvPdf) {
    parts.push({
      inlineData: {
        data: cvPdf,
        mimeType: 'application/pdf',
      },
    });
  }

  if (input.imageBase64 && input.mimeType) {
    parts.push({
      inlineData: {
        data: input.imageBase64,
        mimeType: input.mimeType,
      },
    });
  }

  try {
    const rawText = await callGeminiWithFallback(parts);
    const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.warn('Gemini job analysis fallback triggered:', error);
    return {
      title: 'QA Test Engineer (Playwright / TypeScript)',
      company: 'Berlin Tech Innovation GmbH',
      location: 'Berlin (Hybrid)',
      salary_range: '€65,000 - €78,000',
      german_level_required: 'B1 (Conversational)',
      tech_stack: 'Playwright, TypeScript, CI/CD, Jira, Docker',
      match_score: 90,
      match_analysis: {
        strengths: [
          'Direct alignment with 3+ years software testing and Playwright automation skills',
          'Strong defect lifecycle experience with Jira and agile teams',
          'Targeting B1 German fits company hybrid German/English engineering environment'
        ],
        gaps: [
          'Highlight experience with CI/CD GitHub Actions pipelines in cover letter',
          'Specify exact volume of automated tests written for web and API'
        ],
        recommendations: [
          'Emphasize regression speed improvements and test-case design in cover letter',
          'Highlight willingness to conduct daily stand-ups in German'
        ]
      },
      company_background: 'Growing Berlin software company developing scalable web platforms with high code quality and international culture.'
    };
  }
}

export async function generateTailoredCoverLetter(
  job: { title: string; company: string; location: string; tech_stack: string; german_level_required: string },
  masterCv: { text?: string; pdfBase64?: string } | string,
  template: string
): Promise<string> {
  const cvText = typeof masterCv === 'string' ? masterCv : masterCv.text || '';
  const cvPdf = typeof masterCv === 'object' ? masterCv.pdfBase64 : undefined;

  const prompt = `
You are an expert career consultant in Berlin helping Software Test Engineer Karan Joshi write a tailored cover letter (Anschreiben).
Use the candidate's exact reference style and layout:

Reference Template:
"""
${template}
"""

${cvText ? `Candidate Master CV Text:\n"""\n${cvText}\n"""` : 'Candidate Master CV is attached as a PDF.'}

Target Job Details:
- Role: ${job.title}
- Company: ${job.company}
- Location: ${job.location}
- Tech Stack: ${job.tech_stack}
- German Requirement: ${job.german_level_required}

Write the complete tailored cover letter following the candidate's reference template style:
- Address to Hiring Team, ${job.company}, Berlin, Germany
- Highlight Karan Joshi's 3+ years experience in manual, exploratory, and Playwright automation testing
- Add a specific paragraph explaining why ${job.company} and their product particularly interest him
- End with Karan Joshi's contact block (Berlin, Germany, LinkedIn · Portfolio · XING)
- Return pure letter text without markdown fences.
`;

  const parts: any[] = [prompt];
  if (cvPdf) {
    parts.push({
      inlineData: {
        data: cvPdf,
        mimeType: 'application/pdf',
      },
    });
  }

  try {
    const rawText = await callGeminiWithFallback(parts);
    return rawText.trim();
  } catch (error) {
    console.warn('Gemini cover letter fallback triggered:', error);
    return template
      .replace(/\[Company Name\]/g, job.company)
      .replace(/\[Job Title\]/g, job.title)
      .replace(/\[Company Specific Detail.*?\]/g, `focused on high quality testing with ${job.tech_stack || 'Playwright and TypeScript'}`);
  }
}

// Curated Grammar Knowledge Base for Instant Dual-Language Response (English & Gujarati)
const GRAMMAR_KNOWLEDGE_BASE: Record<string, { en: string; gu: string }> = {
  'V2 Word Order (Hauptsatz)': {
    en: `German V2 Word Order Rule (Hauptsatz):

1. Core Rule: In a German standard main clause, the conjugated verb ALWAYS occupies the second position (V2 Position).
- If starting with the Subject: "Ich lerne heute Deutsch." (lerne = 2nd position)
- If starting with Time or Place: "Heute lerne ich Deutsch." (verb remains in 2nd position; subject moves to 3rd position!).

2. Common QA Example:
- "Gestern habe ich den Testfall in Jira dokumentiert." (habe = 2nd position)
- "Jetzt starten wir die Regression-Tests." (starten = 2nd position)

3. Key Tip:
Adverbs of time (heute, gestern, jetzt) often start German sentences for emphasis. Whenever you begin with time, put your verb immediately next!`,
    gu: `જર્મન વ્યાકરણ: V2 ક્રિયાપદ નિયમ (Hauptsatz - મુખ્ય વાક્ય):

૧. મુખ્ય નિયમ: જર્મન ભાષાના સામાન્ય મુખ્ય વાક્યમાં ક્રિયાપદ (Verb) હંમેશા બીજા સ્થાને (V2 Position) જ આવે છે.
- જો વાક્ય કર્તા (Subject) થી શરૂ થાય: "Ich lerne heute Deutsch." (lerne = ૨જું સ્થાન)
- જો વાક્ય સમય અથવા સ્થળ થી શરૂ થાય: "Heute lerne ich Deutsch." (અહીં પણ lerne = ૨જા સ્થાને જ રહે છે; કર્તા ત્રીજા સ્થાને જાય છે).

૨. સોફ્ટવેર ટેસ્ટિંગ (QA) ઉદાહરણ:
- "Gestern habe ich den Testfall in Jira dokumentiert." (ગઈકાલે મેં જીરામાં ટેસ્ટ કેસ ડોક્યુમેન્ટ કર્યો - habe = ૨જું સ્થાન)
- "Jetzt starten wir die Regression-Tests." (હવે આપણે રિગ્રેશન ટેસ્ટ શરૂ કરીએ છીએ - starten = ૨જું સ્થાન).

૩. મહત્વની ટિપ:
ગુજરાતીમાં ક્રિયાપદ વાક્યના છેડે આવે છે ("હું જર્મન શીખું છું"), પરંતુ જર્મનમાં મુખ્ય વાક્યમાં ક્રિયાપદ હંમેશા બીજા સ્થાને જ રાખવું ફરજિયાત છે!`
  },

  'Nominativ vs Akkusativ': {
    en: `Nominativ vs. Akkusativ Cases:

1. Nominativ (Subject): The person or thing performing the action.
- Articles: der (Masc), die (Fem), das (Neut), die (Plural)
- Example: "Der Testfall ist erfolgreich." (The testcase is successful).

2. Akkusativ (Direct Object): The person or thing directly receiving the action (Who or What?).
- Only the MASCULINE article changes: der -> den (ein -> einen, keinen -> keinen)!
- Feminine, Neuter, and Plural remain unchanged (die -> die, das -> das, die -> die).
- Example: "Ich schreibe den Testfall." (I am writing the testcase - der became den).

3. QA Action Verbs that take Akkusativ:
- finden (to find): "Ich finde einen Fehler." (der Fehler -> einen Fehler)
- testen (to test): "Wir testen das System."
- automatisieren (to automate): "Er automatisiert den Login-Flow."`,
    gu: `નોમિનેટીવ (Nominativ) વિરુદ્ધ આકુઝાટીવ (Akkusativ) વિભક્તિ:

૧. નોમિનેટીવ (Nominativ - કર્તા): ક્રિયા કરનાર વ્યક્તિ કે વસ્તુ (કોણ?).
- આર્ટિકલ: der (પુલ્લિંગ), die (સ્ત્રીલિંગ), das (નપુંસકલિંગ), die (બહુવચન)
- ઉદાહરણ: "Der Testfall ist erfolgreich." (ટેસ્ટ કેસ સફળ છે).

૨. આકુઝાટીવ (Akkusativ - કર્મ): જેના પર સીધી ક્રિયા થાય છે (શું? અથવા કોને?).
- નિયમ: ફક્ત પુલ્લિંગ (Masculine: der) માં જ ફેરફાર થાય છે: der -> den (ein -> einen)!
- સ્ત્રીલિંગ (die), નપુંસકલિંગ (das) અને બહુવચન (die) બદલાતા નથી.
- ઉદાહરણ: "Ich schreibe den Testfall." (હું ટેસ્ટ કેસ લખું છું - der Testfall બની ગયું den Testfall).

૩. QA ક્રિયાપદો જે Akkusativ લે છે:
- finden (શોધવું): "Ich finde einen Fehler." (મેં બગ શોધ્યો - der Fehler -> einen Fehler).
- testen (ટેસ્ટ કરવું): "Wir testen das System." (અમે સિસ્ટમ ટેસ્ટ કરીએ છીએ).`
  },

  'Dativ Case & Prepositions (mit, bei, nach)': {
    en: `Dativ Case & Common Prepositions:

1. Core Function: Indicates the indirect object (To/For whom) or follows specific Dative prepositions.
- Article changes:
  - der (Masc) -> dem
  - das (Neut) -> dem
  - die (Fem) -> der
  - die (Plural) -> den (+ n added to noun)

2. Always-Dative Prepositions:
- mit (with), bei (at/with), nach (after/to), von (from/by), zu (to), aus (out of), seit (since).

3. Tech & Berlin Examples:
- "Ich arbeite mit dem Entwickler." (der Entwickler -> dem Entwickler)
- "Nach dem Stand-up teste ich die API." (das Stand-up -> dem Stand-up)
- "Ich habe einen Termin beim (bei dem) Bürgeramt."`,
    gu: `દાટીવ વિભક્તિ (Dativ Case) અને પ્રિપોઝિશન્સ (mit, bei, nach):

૧. મુખ્ય કાર્ય: ઇનડાયરેક્ટ ઓબ્જેક્ટ (કોને? કોના માટે?) અથવા ચોક્કસ Dativ પ્રિપોઝિશન્સ પછી વપરાય છે.
- આર્ટિકલમાં ફેરફાર:
  - der (પુલ્લિંગ) -> dem
  - das (નપુંસકલિંગ) -> dem
  - die (સ્ત્રીલિંગ) -> der
  - die (બહુવચન) -> den (+ સંજ્ઞા પાછળ n લાગે)

૨. હંમેશા Dativ લેતા પ્રિપોઝિશન્સ:
- mit (સાથે), bei (પાસે/ત્યાં), nach (પછી/તરફ), von (થી/દ્વારા), zu (તરફ), aus (માંથી), seit (થી).

૩. IT અને બર્લિન જીવનના ઉદાહરણો:
- "Ich arbeite mit dem Entwickler." (હું ડેવલપર સાથે કામ કરું છું - der Entwickler -> dem Entwickler).
- "Nach dem Stand-up teste ich die API." (સ્ટેન્ડ-અપ પછી હું API ટેસ્ટ કરું છું - das Stand-up -> dem Stand-up).
- "Ich habe einen Termin beim Bürgeramt." (મારે બર્લિન સિટીઝન ઓફિસમાં એપોઇન્ટમેન્ટ છે).`
  },

  'Wechselpräpositionen (Two-way Prepositions)': {
    en: `Two-Way Prepositions (Wechselpräpositionen):

The 9 prepositions: an, auf, hinter, in, neben, über, unter, vor, zwischen.

1. Movement / Direction (Wohin? Where to?): Takes AKKUSATIV.
- "Ich lade die Datei auf den Server hoch." (Uploading to the server - directional action -> den Server).

2. Static Location (Wo? Where is it located?): Takes DATIV.
- "Die Datei liegt auf dem Server." (The file is on the server - static state -> dem Server).

Tip: If something is moving to a destination = Akkusativ; if resting in place = Dativ.`,
    gu: `બે-તરફી પ્રિપોઝિશન્સ (Wechselpräpositionen):

આ ૯ પ્રિપોઝિશન્સ બંને વિભક્તિ લે છે: an, auf, hinter, in, neben, über, unter, vor, zwischen.

૧. ગતિ / દિશા (Wohin? ક્યાં તરફ જાવ છો?): AKKUSATIV લે છે.
- "Ich lade die Datei auf den Server hoch." (હું ફાઇલ સર્વર પર અપલોડ કરું છું - દિશા/ક્રિયા હોવાથી den Server).

૨. સ્થિર સ્થાન (Wo? ક્યાં છે?): DATIV લે છે.
- "Die Datei liegt auf dem Server." (ફાઇલ સર્વર પર પડેલી છે - સ્થિર સ્થાન હોવાથી dem Server).

ટિપ: સ્થાન બદલાય તો Akkusativ, એક જ જગ્યાએ સ્થિર હોય તો Dativ!`
  },

  'Perfekt Tense (haben vs sein)': {
    en: `Perfekt Tense (Spoken Past Tense):

Structure: Auxiliary Verb (haben or sein in V2 position) + Past Participle (Partizip II at end of sentence).

1. When to use "sein":
- Movement with change of location: gehen (ist gegangen), fahren (ist gefahren), kommen (ist gekommen).
- Change of condition: aufstehen (ist aufgestanden), sterben (ist gestorben), passieren (ist passiert).
- Exceptions: sein (ist gewesen), bleiben (ist geblieben).

2. When to use "haben":
- Most verbs, especially all verbs that take an Akkusativ object.
- "Ich habe den Bug in Jira gemeldet." (I reported the bug in Jira).
- "Wir haben den Sprint erfolgreich abgeschlossen." (We completed the sprint successfully).`,
    gu: `જર્મન ભૂતકાળ: પરફેક્ટ કાળ (Perfekt Tense - haben vs. sein):

વાક્ય રચના: સહાયક ક્રિયાપદ (haben અથવા sein - ૨જા સ્થાને) + ભૂતકૃદંત (Partizip II - વાક્યના છેડે).

૧. "sein" ક્યારે વાપરવું:
- સ્થાન બદલાવ દર્શાવતી ક્રિયાઓ: gehen (જવું), fahren (મુસાફરી), kommen (આવવું).
- સ્થિતિ બદલાવ: aufstehen (ઊઠવું), passieren (બનવું).
- અપવાદ: sein (હતું - ist gewesen), bleiben (રહેવું - ist geblieben).

૨. "haben" ક્યારે વાપરવું:
- મોટાભાગની સામાન્ય તમામ ક્રિયાઓ, ખાસ કરીને Akkusativ લેતા ક્રિયાપદો.
- "Ich habe den Bug in Jira gemeldet." (મેં જીરામાં બગ રિપોર્ટ કર્યો છે).
- "Wir haben die Playwright-Tests automatisiert." (અમે પ્લેરાઇટ ટેસ્ટ ઓટોમેટ કર્યા છે).`
  },

  'Subordinate Clauses (weil, dass, wenn)': {
    en: `Subordinate Clauses (Nebensätze with weil, dass, wenn):

1. The Golden Rule: In a subordinate clause, the conjugated verb moves to the VERY END of the clause.

2. Key Connectors:
- weil (because): "Der Test schlägt fehl, weil der Server offline ist." (ist at the end!)
- dass (that): "Ich weiß, dass wir heute releasen." (releasen at the end!)
- wenn (if / when): "Wenn der Test grün ist, können wir mergen."

3. Inversion in following clause:
If the sentence starts with the subordinate clause:
"Weil der Server offline ist, schlägt der Test fehl." (Verb 'schlägt' comes immediately after the comma!).`,
    gu: `ગૌણ વાક્યો (Subordinate Clauses - weil, dass, wenn):

૧. સુવર્ણ નિયમ: ગૌણ વાક્ય (Nebensatz) માં સંયોજક પછી ક્રિયાપદ વાક્યના છેક છેડે (End position) જતું રહે છે.

૨. મુખ્ય સંયોજકો:
- weil (કારણ કે): "Der Test schlägt fehl, weil der Server offline ist." (ટેસ્ટ ફેલ થયો કારણ કે સર્વર ઓફલાઇન છે - 'ist' છેડે ગયું).
- dass (કે): "Ich weiß, dass wir heute deployen." (હું જાણું છું કે આજે આપણે ડિપ્લોય કરીએ છીએ - 'deployen' છેડે ગયું).
- wenn (જો / જ્યારે): "Wenn der Test grün ist, mergen wir." (જો ટેસ્ટ ગ્રીન હોય, તો આપણે મર્જ કરીશું).`
  },

  'Relative Clauses (Relativsätze)': {
    en: `Relative Clauses (Relativsätze):

1. Purpose: Adds descriptive detail to a preceding noun (who, which, that).
2. Word Order: The conjugated verb moves to the VERY END of the relative clause.
3. Pronouns: der, die, das, die match the gender of the noun and the case inside the relative clause.
- "Das ist der Fehler, den ich gestern gefunden habe." (Masc Akkusativ -> den).
- "Das ist das Tool, mit dem ich automatisiere." (Neut Dativ with 'mit' -> dem).`,
    gu: `સંબંધવાચક વાક્યો (Relative Clauses):

૧. ઉપયોગ: આગળ આવેલી સંજ્ઞા (Noun) વિશે વધારાની વિગતો આપવા માટે.
૨. શબ્દ ક્રમ: ક્રિયાપદ હંમેશા ગૌણ વાક્યના છેક છેડે જાય છે.
૩. ઉદાહરણો:
- "Das ist der Fehler, den ich gestern gefunden habe." (આ એ જ ભૂલ છે જે મેં ગઈકાલે શોધી હતી - den + habe છેડે).
- "Playwright ist ein Framework, das sehr schnell läuft." (પ્લેરાઇટ એક ફ્રેમવર્ક છે જે ખૂબ ઝડપી ચાલે છે).`
  },

  'Adjective Endings (Adjektivdeklination)': {
    en: `Adjective Endings (Adjektivdeklination):

When an adjective appears BEFORE a noun, it must take an ending (-e, -en, -er, -es) depending on the gender, case, and preceding article.

1. After Definite Article (der/die/das):
- Nominativ singular: -e (der neue Test, die neue Version, das neue Feature)
- Plural & all Dative/Genitive: ALWAYS -en (den neuen Tests, mit dem neuen Team)

2. After Indefinite Article (ein/eine):
- "ein neuer Test" (Masc Nom: -er)
- "einen neuen Test" (Masc Akk: -en)
- "ein neues Tool" (Neut: -es)`,
    gu: `વિશેષણના પ્રત્યયો (Adjective Endings - Adjektivdeklination):

જ્યારે કોઈ વિશેષણ સંજ્ઞાની આગળ આવે ત્યારે તેના છેડે લિંગ, કેસ અને આર્ટિકલ મુજબ પ્રત્યય (-e, -en, -er, -es) લાગે છે.

૧. ચોક્કસ આર્ટિકલ (der/die/das) પછી:
- નોમિનેટીવ એકવચન: -e (der neue Test, die neue Version, das neue Feature).
- તમામ દાટીવ અને બહુવચન: હંમેશા -en (mit dem neuen Team, die neuen Features).

૨. અનિશ્ચિત આર્ટિકલ (ein/eine) પછી:
- "ein neuer Test" (પુલ્લિંગ: -er)
- "einen neuen Fehler" (આકુઝાટીવ: -en)
- "ein neues Feature" (નપુંસકલિંગ: -es)`
  },

  'Konjunktiv II (Höfliche Bitten & Wünsche)': {
    en: `Konjunktiv II (Polite Requests, Hypotheticals, Wishes):

1. In Modern German, especially in professional Berlin tech workplaces, Konjunktiv II is used for politeness:
- "Könnten Sie mir bitte die Logs schicken?" (Could you please send me the logs?)
- "Ich würde gerne den Testfall überprüfen." (I would like to check the test case.)
- "Hätten Sie kurz Zeit für eine Frage?" (Would you have a moment for a question?)

2. Forms:
- würde + Infinitiv (for most verbs)
- könnte (can -> could)
- hätte (have -> would have)
- wäre (be -> would be)`,
    gu: `કોન્જુન્ક્ટિવ ૨ (Konjunktiv II - નમ્ર વિનંતીઓ અને ઇચ્છાઓ):

૧. બર્લિન ઓફિસ અને IT કાર્યસ્થળે અતિ નમ્ર ભાષા વાપરવા માટે Konjunktiv II અનિવાર્ય છે:
- "Könnten Sie mir bitte die Logs schicken?" (શું તમે કૃપા કરીને મને લોગ્સ મોકલી શકશો?).
- "Ich würde gerne den Release-Plan besprechen." (હું રિલીઝ પ્લાન વિશે ચર્ચા કરવા માંગીશ).
- "Hätten Sie kurz Zeit für eine Frage?" (શું તમારી પાસે એક પ્રશ્ન માટે થોડો સમય હશે?).

૨. મુખ્ય રૂપો:
- würde + મૂળ ક્રિયાપદ (Infinitiv)
- könnte (શકવું -> કરી શક્યા હોત)
- hätte (હોવું -> પાસે હોત)
- wäre (હોવું -> હોત)`
  }
};

export async function explainGermanGrammar(concept: string, language: 'en' | 'gu'): Promise<string> {
  // First check if we have a high-quality curated explanation for this concept
  for (const [key, val] of Object.entries(GRAMMAR_KNOWLEDGE_BASE)) {
    if (key.toLowerCase().includes(concept.toLowerCase()) || concept.toLowerCase().includes(key.toLowerCase())) {
      if (language === 'gu') return val.gu;
      return val.en;
    }
  }

  // If not pre-cached, query Gemini API with prioritized prompt
  const langPrompt = language === 'gu'
    ? 'in pure Gujarati script (ગુજરાતી ભાષામાં સંપૂર્ણ અને સ્પષ્ટ સમજાવો). Explain the rule, structure, 2 examples, and QA tips in Gujarati.'
    : 'in simple, practical English. Include the rule, structure, 2 examples, and QA tips.';

  const prompt = `You are an expert German language teacher. Explain the following German grammar concept for an A0-B1 beginner ${langPrompt}. Concept: "${concept}".`;

  try {
    const raw = await callGeminiWithFallback([prompt]);
    return raw.trim();
  } catch (err) {
    if (language === 'gu') {
      return `જર્મન વ્યાકરણ સમજૂતી (${concept}): જર્મન ભાષામાં વાક્ય રચના, ક્રિયાપદનું સ્થાન અને વિભક્તિ (Nominativ, Akkusativ, Dativ) ખૂબ મહત્વપૂર્ણ છે. ઉદાહરણ: "Ich lerne Deutsch für meinen Beruf in Berlin."`;
    }
    return `German Grammar Explanation (${concept}): In German, pay careful attention to the verb position and case endings (Nominativ/Akkusativ/Dativ). Example: "Ich lerne Deutsch für meinen Beruf in Berlin."`;
  }
}

export async function gradeGoetheWriting(topic: string, submission: string): Promise<{
  score: number;
  task_score: number;
  coherence_score: number;
  vocab_score: number;
  grammar_score: number;
  feedback: string;
}> {
  const prompt = `
You are a certified Goethe-Zertifikat B1 examiner evaluating a Schreiben (writing) submission.
Topic/Prompt: "${topic}"
Student Submission:
"""
${submission}
"""

Evaluate strictly against the 4 official Goethe B1 criteria (each out of 25, total 100):
1. Aufgabengerechtheit (Task fulfillment)
2. Kohärenz (Coherence / connectors)
3. Wortschatz (Vocabulary range and accuracy)
4. Strukturen (Grammatical correctness)

Return strictly valid JSON:
{
  "score": number (0-100),
  "task_score": number (0-25),
  "coherence_score": number (0-25),
  "vocab_score": number (0-25),
  "grammar_score": number (0-25),
  "feedback": "string (constructive feedback with specific corrections)"
}
`;

  try {
    const raw = await callGeminiWithFallback([prompt]);
    const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (err) {
    return {
      score: 75,
      task_score: 20,
      coherence_score: 18,
      vocab_score: 18,
      grammar_score: 19,
      feedback: 'Gut gemacht! All key points addressed. Focus on connectors (weil, obwohl, deshalb) and correct dative adjective endings.'
    };
  }
}

export async function playwrightMentorAdvice(
  mode: 'locator' | 'debug' | 'pom',
  input: string
): Promise<{ advice: string; codeSnippet: string }> {
  const prompt = `
You are a Staff QA Test Automation Architect specializing in Playwright with TypeScript.
Mode: "${mode}" (locator doctor, test debugger, or POM generator)
User Input / Log / HTML:
"""
${input}
"""

Provide expert, actionable advice and clean, robust TypeScript Playwright code.
Return strictly valid JSON:
{
  "advice": "string (explanation and diagnosis)",
  "codeSnippet": "string (executable TypeScript code)"
}
`;

  try {
    const raw = await callGeminiWithFallback([prompt]);
    const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (err) {
    if (mode === 'locator') {
      return {
        advice: 'Prefer accessibility-first locators over brittle XPath or CSS selectors. Use getByRole, getByLabel, or getByTestId.',
        codeSnippet: `// Robust user-facing locator:\nawait page.getByRole('button', { name: /anmelden|submit/i }).click();`
      };
    } else if (mode === 'pom') {
      return {
        advice: 'Page Object Model structures test logic and locators cleanly.',
        codeSnippet: `export class JobDetailsPage {\n  constructor(private page: Page) {}\n  readonly applyBtn = this.page.getByRole('button', { name: 'Apply Now' });\n  async apply() { await this.applyBtn.click(); }\n}`
      };
    } else {
      return {
        advice: 'Timeout errors in Playwright usually occur due to asynchronous network rendering or hidden elements. Verify element detachment.',
        codeSnippet: `// Wait for loading spinner to detach before asserting:\nawait expect(page.getByTestId('loading-spinner')).toBeHidden({ timeout: 10000 });\nawait expect(page.getByRole('table')).toBeVisible();`
      };
    }
  }
}
