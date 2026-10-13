import { GoogleGenerativeAI } from '@google/generative-ai';

import 'dotenv/config';
const key = process.env.GEMINI_API_KEY || '';

async function testModels() {
  console.log('Testing with key:', key.slice(0, 10) + '...');
  
  // Test REST API list models directly
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
    const data = await res.json();
    if (data.models) {
      console.log('Available models from API:');
      for (const m of data.models) {
        if (m.supportedGenerationMethods?.includes('generateContent')) {
          console.log('-', m.name);
        }
      }
    } else {
      console.log('Response error or no models:', JSON.stringify(data));
    }
  } catch (e: any) {
    console.error('Fetch error:', e.message);
  }

  // Also test SDK
  const genAI = new GoogleGenerativeAI(key);
  const candidateModels = ['gemini-2.0-flash', 'gemini-1.5-flash-latest', 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro'];
  for (const m of candidateModels) {
    try {
      const model = genAI.getGenerativeModel({ model: m });
      const result = await model.generateContent('Hello! Return OK.');
      console.log(`✓ Model ${m} SUCCEEDED:`, result.response.text().trim());
      break;
    } catch (err: any) {
      console.log(`✗ Model ${m} failed:`, err.message?.slice(0, 150));
    }
  }
}

testModels().catch(console.error);
