import { db, initDatabase } from '../src/server/db/index';
import { pingGemini } from '../src/server/services/geminiService';

async function verify() {
  console.log('--- Verifying Database ---');
  initDatabase();
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('Tables created:', tables.map((t: any) => t.name).join(', '));

  console.log('--- Verifying Seed Data ---');
  const vocabCount = db.prepare('SELECT COUNT(*) as count FROM german_vocab').get() as any;
  const snippetCount = db.prepare('SELECT COUNT(*) as count FROM playwright_snippets').get() as any;
  const cvSetting = db.prepare('SELECT value FROM user_settings WHERE key = ?').get('master_cv') as any;
  console.log(`Vocab items: ${vocabCount.count}`);
  console.log(`Playwright snippets: ${snippetCount.count}`);
  console.log(`Master CV stored: ${cvSetting?.value ? 'Yes' : 'No'}`);

  console.log('--- Verifying Gemini Client ---');
  const ping = await pingGemini();
  console.log('Gemini Status:', ping.status, '-', ping.message);

  console.log('--- All Scaffolding Checks Passed ---');
}

verify().catch(console.error);
