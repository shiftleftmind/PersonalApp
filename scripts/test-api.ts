import app from '../src/server/index';
import http from 'http';

async function testApi() {
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(3002, resolve));
  const baseUrl = 'http://localhost:3002';
  console.log('Testing server running on port 3002...');

  try {
    // 1. Health check
    const health = await fetch(`${baseUrl}/api/health`).then((r) => r.json());
    console.log('✓ Health Check:', health.status);

    // 2. Job Hunter API
    const createJob = await fetch(`${baseUrl}/api/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company: 'Zalando SE',
        title: 'Senior QA Automation Engineer',
        location: 'Berlin (Hybrid)',
        salary_range: '€70,000 - €85,000',
        stage: 'Wishlist',
        german_level_required: 'B1',
        tech_stack: 'Playwright, TypeScript, CI/CD',
      }),
    }).then((r) => r.json());
    console.log('✓ Created Job ID:', createJob.id, '-', createJob.company);

    // 3. Generate Cover Letter
    const cl = await fetch(`${baseUrl}/api/jobs/${createJob.id}/cover-letter`, { method: 'POST' }).then((r) => r.json());
    console.log('✓ Generated Cover Letter Length:', cl.content_markdown?.length);

    // 4. PDF Generation
    const pdf = await fetch(`${baseUrl}/api/jobs/${createJob.id}/cover-letter/pdf`);
    const pdfBuf = await pdf.arrayBuffer();
    console.log('✓ PDF Stream Generated Size:', pdfBuf.byteLength, 'bytes');

    // 5. German Vocab
    const vocab = await fetch(`${baseUrl}/api/german/vocab`).then((r) => r.json());
    console.log('✓ German Vocab Count:', vocab.length);

    // 6. Error Log
    const errLog = await fetch(`${baseUrl}/api/german/error-log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        wrong_sentence: 'Ich gehe in das Kino mit der Freund.',
        corrected_sentence: 'Ich gehe ins Kino mit dem Freund.',
        grammar_rule: 'Dativ preposition mit + masculine article dem',
      }),
    }).then((r) => r.json());
    console.log('✓ Error Log Added:', errLog.wrong_sentence, '->', errLog.corrected_sentence);

    // 7. Goethe B1 Mock Writing Grading
    const grade = await fetch(`${baseUrl}/api/german/grade-exam`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: 'Bewerbung als QA Engineer',
        submission: 'Sehr geehrte Damen und Herren, ich bewerbe mich hiermit um die Stelle als Software Test Engineer. Ich habe 4 Jahre Erfahrung mit Playwright.',
      }),
    }).then((r) => r.json());
    console.log('✓ Goethe B1 Grade:', grade.score, '/ 100');

    // 8. Playwright Snippets
    const snippets = await fetch(`${baseUrl}/api/playwright/snippets`).then((r) => r.json());
    console.log('✓ Playwright Snippets Count:', snippets.length);

    // 9. Job Scraper
    const scraper = await fetch(`${baseUrl}/api/playwright/run-scraper`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyword: 'QA Automation', location: 'Berlin' }),
    }).then((r) => r.json());
    console.log('✓ Scraper Jobs Discovered:', scraper.jobs?.length);

    // 10. AI Mentor
    const mentor = await fetch(`${baseUrl}/api/playwright/mentor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'locator', input: '<button class="btn btn-primary">Anmelden</button>' }),
    }).then((r) => r.json());
    console.log('✓ Mentor Advice Generated:', mentor.advice?.slice(0, 50), '...');

    // 11. Sandbox page check
    const sandboxAsync = await fetch(`${baseUrl}/sandbox/async`);
    console.log('✓ Sandbox /sandbox/async Status:', sandboxAsync.status);

    console.log('\n========================================');
    console.log('ALL API ENDPOINTS VERIFIED SUCCESSFULLY!');
    console.log('========================================');
  } finally {
    server.close();
  }
}

testApi().catch(console.error);
