/**
 * gemini.ts — Veridian Web Gemini Pool
 *
 * Reads GEMINI_API_KEY_1, GEMINI_API_KEY_2, ... up to the keys defined below.
 * To add a 3rd key: add GEMINI_API_KEY_3 to web/.env.local and add it to KEY_ENV_VARS.
 * To remove a key: delete it from .env.local and from KEY_ENV_VARS.
 * No other files change.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

// ── POOL CONFIGURATION — edit this list to add/remove keys ──
const KEY_ENV_VARS = [
  process.env.GEMINI_API_KEY_1,
  process.env.GEMINI_API_KEY_2,
  // process.env.GEMINI_API_KEY_3,   // uncomment when you have a 3rd key
  // process.env.GEMINI_API_KEY_4,
];

const keys = KEY_ENV_VARS.filter(Boolean) as string[];

if (keys.length === 0) {
  throw new Error(
    "No Gemini API keys configured. Set at least GEMINI_API_KEY_1 in web/.env.local"
  );
}

const MIN_GAP_MS = 2500; // 2.5s throttle — matches eval_engine Gemini pool
const lastCallTime: number[] = keys.map(() => 0);

function selectKeyIndex(): number {
  const now = Date.now();
  let best = 0;
  let maxElapsed = now - lastCallTime[0];
  for (let i = 1; i < lastCallTime.length; i++) {
    const elapsed = now - lastCallTime[i];
    if (elapsed > maxElapsed) {
      maxElapsed = elapsed;
      best = i;
    }
  }
  return best;
}

export async function callGemini(
  prompt: string,
  model = "gemini-2.0-flash",
  temperature = 0.7
): Promise<string> {
  const idx = selectKeyIndex();
  const elapsed = Date.now() - lastCallTime[idx];
  if (elapsed < MIN_GAP_MS) {
    await new Promise((r) => setTimeout(r, MIN_GAP_MS - elapsed));
  }
  lastCallTime[idx] = Date.now();

  const client = new GoogleGenerativeAI(keys[idx]);
  const geminiModel = client.getGenerativeModel({
    model,
    generationConfig: { temperature },
  });
  const result = await geminiModel.generateContent(prompt);
  return result.response.text();
}
