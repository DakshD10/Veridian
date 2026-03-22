import Groq from "groq-sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const MIN_GAP_MS = 2500;
let _lastCallTime = 0;

async function throttle() {
  const elapsed = Date.now() - _lastCallTime;
  if (elapsed < MIN_GAP_MS) {
    await new Promise(res => setTimeout(res, MIN_GAP_MS - elapsed));
  }
  _lastCallTime = Date.now();
}

export async function callModel(
  modelId: string,
  input: string,
  context?: string
): Promise<{ output: string; latencyMs: number }> {
  await throttle();

  const model = getAvailableModels().find(m => m.id === modelId);
  const provider = model?.provider ?? "groq";

  const start = Date.now();

  if (provider === "gemini") {
    const systemPrompt = context
      ? `You are a helpful AI assistant. Use this context to answer: ${context}`
      : "You are a helpful AI assistant. Answer accurately and concisely.";

    const geminiModel = gemini.getGenerativeModel({ model: modelId });
    const result = await geminiModel.generateContent(
      `${systemPrompt}\n\nUser: ${input}`
    );
    _lastCallTime = Date.now();
    return {
      output: result.response.text(),
      latencyMs: Date.now() - start,
    };
  }

  // Default: Groq
  const systemPrompt = context
    ? `You are a helpful AI assistant. Use this context to answer: ${context}`
    : "You are a helpful AI assistant. Answer accurately and concisely.";

  const response = await groq.chat.completions.create({
    model: modelId,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: input },
    ],
    temperature: 0.1,
    max_tokens: 1024,
  });

  _lastCallTime = Date.now();
  return {
    output: response.choices[0].message.content ?? "",
    latencyMs: Date.now() - start,
  };
}

export function getAvailableModels() {
  return [
    // ── LLAMA 4 (Latest) ──────────────────────────────────
    { id: "meta-llama/llama-4-scout-17b-16e-instruct", label: "Llama 4 Scout 17B",   speed: "very fast", provider: "groq" },
    { id: "meta-llama/llama-4-maverick-17b-128e-instruct", label: "Llama 4 Maverick 17B", speed: "fast", provider: "groq" },

    // ── LLAMA 3.x ─────────────────────────────────────────
    { id: "llama3-70b-8192",              label: "Llama 3 70B",           speed: "fast",      provider: "groq" },
    { id: "llama3-8b-8192",               label: "Llama 3 8B",            speed: "very fast", provider: "groq" },
    { id: "llama-3.1-8b-instant",         label: "Llama 3.1 8B Instant",  speed: "very fast", provider: "groq" },
    { id: "llama-3.2-3b-preview",         label: "Llama 3.2 3B",          speed: "very fast", provider: "groq" },
    { id: "llama-3.2-11b-vision-preview", label: "Llama 3.2 11B Vision",  speed: "fast",      provider: "groq" },
    { id: "llama-3.2-90b-vision-preview", label: "Llama 3.2 90B Vision",  speed: "fast",      provider: "groq" },

    // ── GPT OSS (OpenAI Open Source on Groq) ─────────────
    { id: "openai/gpt-oss-20b",           label: "GPT OSS 20B",           speed: "very fast", provider: "groq" },
    { id: "openai/gpt-oss-120b",          label: "GPT OSS 120B",          speed: "fast",      provider: "groq" },

    // ── QWEN ──────────────────────────────────────────────
    { id: "qwen/qwen3-32b",               label: "Qwen 3 32B",            speed: "fast",      provider: "groq" },

    // ── KIMI K2 ───────────────────────────────────────────
    { id: "moonshotai/kimi-k2-instruct",  label: "Kimi K2",               speed: "fast",      provider: "groq" },

    // ── MIXTRAL + GEMMA ───────────────────────────────────
    { id: "mixtral-8x7b-32768",           label: "Mixtral 8x7B",          speed: "fast",      provider: "groq" },
    { id: "gemma2-9b-it",                 label: "Gemma 2 9B",            speed: "very fast", provider: "groq" },

    // ── GEMINI ────────────────────────────────────────────
    { id: "gemini-2.0-flash",             label: "Gemini 2.0 Flash",      speed: "very fast", provider: "gemini" },
    { id: "gemini-1.5-pro",               label: "Gemini 1.5 Pro",        speed: "fast",      provider: "gemini" },
    { id: "gemini-1.5-flash",             label: "Gemini 1.5 Flash",      speed: "very fast", provider: "gemini" },
  ];
}
