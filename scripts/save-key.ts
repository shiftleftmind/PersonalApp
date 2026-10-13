import { db, initDatabase } from '../src/server/db/index';
import { setGeminiApiKey, pingGemini } from '../src/server/services/geminiService';

async function main() {
  initDatabase();
  const key = process.env.GEMINI_API_KEY || '';
  if (!key) {
    console.error('GEMINI_API_KEY not set in environment');
    process.exit(1);
  }
  db.prepare('INSERT OR REPLACE INTO user_settings (key, value) VALUES (?, ?)').run('gemini_api_key', key);
  setGeminiApiKey(key);
  const result = await pingGemini();
  console.log('Gemini Live Ping Result:', result);
}

main().catch(console.error);
