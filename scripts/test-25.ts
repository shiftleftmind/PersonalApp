import { GoogleGenerativeAI } from '@google/generative-ai';

import 'dotenv/config';
const key = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(key);

async function test25() {
  const model = genAI.getGenerativeModel({ model: 'gemini-3.8-flash' });
  const result = await model.generateContent('Say: GEMINI_CONNECTED');
  console.log('Result from gemini-2.5-flash:');
  console.log(result.response.text());
}

test25().catch(console.error);
