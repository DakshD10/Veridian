
import Groq from 'groq-sdk';
import { config } from 'dotenv';
import path from 'path';

// Load .env explicitly to see what happens
const envPath = path.resolve(process.cwd(), '.env');
console.log('Loading .env from:', envPath);
config({ path: envPath });

const key = process.env.GROQ_API_KEY;

async function runTest() {
  if (!key) {
    console.log('GROQ_API_KEY is NOT set in process.env');
    return;
  }

  console.log('GROQ_API_KEY is set.');
  console.log('Length:', key.length);
  console.log('Starts with quote:', key.startsWith('"') || key.startsWith("'"));
  console.log('Ends with quote:', key.endsWith('"') || key.endsWith("'"));
  console.log('First 7 chars:', key.substring(0, 7));
  console.log('Last 4 chars:', key.substring(key.length - 4));
  
  if (key.includes(' ')) {
    console.log('WARNING: Key contains spaces!');
  }

  // Actually try a tiny request
  const groq = new Groq({ apiKey: key });
  try {
    console.log('Testing Groq connection...');
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: 'Say OK' }],
      model: 'llama-3.1-8b-instant',
      max_tokens: 5,
    });
    console.log('Success! Response:', chatCompletion.choices[0]?.message?.content);
  } catch (err: unknown) {
    const error = err as {
      status?: number;
      error?: unknown;
      message?: string;
    };
    console.log('Groq Test Failed!');
    if (error.status) console.log('Status:', error.status);
    if (error.error) console.log('Error Details:', JSON.stringify(error.error, null, 2));
    else console.log('Error Message:', error.message ?? 'Unknown error');
  }
}

runTest();
