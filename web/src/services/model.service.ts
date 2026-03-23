import Groq from "groq-sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

const groqApiKey = process.env.GROQ_API_KEY;
const geminiApiKey = process.env.GEMINI_API_KEY;

if (process.env.NODE_ENV !== "production") {
  if (!groqApiKey) {
    console.warn("GROQ_API_KEY is missing. Groq models will not be available.");
  }
  if (!geminiApiKey) {
    console.warn("GEMINI_API_KEY is missing. Gemini models will not be available.");
  }
}

const groq = groqApiKey ? new Groq({ apiKey: groqApiKey }) : null;
const gemini = geminiApiKey ? new GoogleGenerativeAI(geminiApiKey) : null;

const MIN_GAP_MS = 2500;
let _lastCallTime = 0;

async function throttle() {
  const elapsed = Date.now() - _lastCallTime;
  if (elapsed < MIN_GAP_MS) {
    await new Promise(res => setTimeout(res, MIN_GAP_MS - elapsed));
  }
  // _lastCallTime is NOT set here — it is set after each call completes
}

export async function callModel(
  modelId: string,
  input: string,
  context?: string
): Promise<{ output: string; latencyMs: number }> {
  await throttle();

  const model = getAvailableModels().find(m => m.id === modelId);
  const provider = model?.provider ?? "groq";

  const systemPrompt = context
    ? `You are a helpful AI assistant. Use this context to answer: ${context}`
    : "You are a helpful AI assistant. Answer accurately and concisely.";

  const start = Date.now();

  if (provider === "gemini") {
    if (!gemini) {
      throw new Error(
        "Gemini API key is not configured. Please set GEMINI_API_KEY."
      );
    }

    const geminiModel = gemini.getGenerativeModel({ model: modelId });
    const result = await geminiModel.generateContent(
      `${systemPrompt}\n\nUser: ${input}`
    );

    _lastCallTime = Date.now(); // set AFTER call completes
    return {
      output: result.response.text(),
      latencyMs: Date.now() - start,
    };
  }

  // Default: Groq
  if (!groq) {
    throw new Error(
      "Groq API key is not configured. Please set GROQ_API_KEY."
    );
  }

  const response = await groq.chat.completions.create({
    model: modelId,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: input },
    ],
    temperature: 0.1,
    max_tokens: 1024,
  });

  _lastCallTime = Date.now(); // set AFTER call completes
  return {
    output: response.choices[0].message.content ?? "",
    latencyMs: Date.now() - start,
  };
}

export function getAvailableModels() {
  const allModels = [
    // ── LLAMA 4 (Latest) ──────────────────────────────────
    { id: "meta-llama/llama-4-scout-17b-16e-instruct",    label: "Llama 4 Scout 17B",    speed: "very fast", provider: "groq"   },
    { id: "meta-llama/llama-4-maverick-17b-128e-instruct", label: "Llama 4 Maverick 17B", speed: "fast",      provider: "groq"   },

    // ── LLAMA 3.x ─────────────────────────────────────────
    { id: "llama3-70b-8192",               label: "Llama 3 70B",          speed: "fast",      provider: "groq"   },
    { id: "llama3-8b-8192",                label: "Llama 3 8B",           speed: "very fast", provider: "groq"   },
    { id: "llama-3.1-8b-instant",          label: "Llama 3.1 8B Instant", speed: "very fast", provider: "groq"   },
    { id: "llama-3.2-3b-preview",          label: "Llama 3.2 3B",         speed: "very fast", provider: "groq"   },
    { id: "llama-3.2-11b-vision-preview",  label: "Llama 3.2 11B Vision", speed: "fast",      provider: "groq"   },
    { id: "llama-3.2-90b-vision-preview",  label: "Llama 3.2 90B Vision", speed: "fast",      provider: "groq"   },

    // ── GPT OSS (OpenAI Open Source on Groq) ─────────────
    { id: "openai/gpt-oss-20b",            label: "GPT OSS 20B",          speed: "very fast", provider: "groq"   },
    { id: "openai/gpt-oss-120b",           label: "GPT OSS 120B",         speed: "fast",      provider: "groq"   },

    // ── QWEN ──────────────────────────────────────────────
    { id: "qwen/qwen3-32b",                label: "Qwen 3 32B",           speed: "fast",      provider: "groq"   },

    // ── KIMI K2 ───────────────────────────────────────────
    { id: "moonshotai/kimi-k2-instruct",   label: "Kimi K2",              speed: "fast",      provider: "groq"   },

    // ── MIXTRAL + GEMMA ───────────────────────────────────
    { id: "mixtral-8x7b-32768",            label: "Mixtral 8x7B",         speed: "fast",      provider: "groq"   },
    { id: "gemma2-9b-it",                  label: "Gemma 2 9B",           speed: "very fast", provider: "groq"   },

    // ── GEMINI ────────────────────────────────────────────
    { id: "gemini-2.0-flash",              label: "Gemini 2.0 Flash",     speed: "very fast", provider: "gemini" },
    { id: "gemini-1.5-pro",                label: "Gemini 1.5 Pro",       speed: "fast",      provider: "gemini" },
    { id: "gemini-1.5-flash",              label: "Gemini 1.5 Flash",     speed: "very fast", provider: "gemini" },
  ];

  return allModels.filter(model => {
    if (model.provider === "groq")   return !!groq;
    if (model.provider === "gemini") return !!gemini;
    return false;
  });
}