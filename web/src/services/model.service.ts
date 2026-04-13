/**
 * model.service.ts — Veridian Multi-Provider Model Runner (Web)
 *
 * Groq pool: reads GROQ_API_KEY_1, GROQ_API_KEY_2, GROQ_Fallback_Key
 * Gemini pool: delegates to lib/gemini.ts (callGemini)
 *
 * To add GROQ_API_KEY_3: add to .env.local and append to GROQ_KEY_ENV_VARS below.
 */

import Groq from "groq-sdk";
import { prisma } from "@/lib/prisma";
import { callGemini } from "@/lib/gemini";

// ── GROQ POOL CONFIGURATION — edit this list to add/remove keys ──
const GROQ_KEY_ENV_VARS = [
  process.env.GROQ_API_KEY_1,
  process.env.GROQ_API_KEY_2,
  // process.env.GROQ_API_KEY_3,   // uncomment when you have a 3rd key
  // process.env.GROQ_API_KEY_4,
];

const groqKeys = GROQ_KEY_ENV_VARS.filter(Boolean) as string[];

if (groqKeys.length === 0) {
  const fallback = process.env.GROQ_Fallback_Key;
  if (fallback) groqKeys.push(fallback);
  else throw new Error("No Groq API keys configured. Set at least GROQ_API_KEY_1 or GROQ_Fallback_Key in web/.env.local");
}

const groqClients = groqKeys.map((k) => new Groq({ apiKey: k }));
const MIN_GAP_MS = 2500;
const groqLastCallTime: number[] = groqKeys.map(() => 0);

function selectGroqKeyIndex(): number {
  const now = Date.now();
  let best = 0;
  let maxElapsed = now - groqLastCallTime[0];
  for (let i = 1; i < groqLastCallTime.length; i++) {
    const elapsed = now - groqLastCallTime[i];
    if (elapsed > maxElapsed) { maxElapsed = elapsed; best = i; }
  }
  return best;
}

const GEMINI_MODEL_PREFIXES = ["gemini-"];

function isGeminiModel(modelId: string): boolean {
  return GEMINI_MODEL_PREFIXES.some((p) => modelId.startsWith(p));
}

export async function callModel(
  modelId: string,
  input: string,
  context?: string
): Promise<{ output: string; latencyMs: number }> {
  // Custom provider path — bypasses pool entirely
  if (modelId.startsWith("custom:")) {
    const providerId = modelId.replace("custom:", "");
    return callCustomProvider(providerId, input, context);
  }

  const systemPrompt = context
    ? `You are a helpful AI assistant. Use this context to answer: ${context}`
    : "You are a helpful AI assistant. Answer accurately and concisely.";

  const start = Date.now();

  if (isGeminiModel(modelId)) {
    const prompt = `${systemPrompt}\n\n${input}`;
    const output = await callGemini(prompt, modelId, 0.1);
    return { output, latencyMs: Date.now() - start };
  }

  // Groq path — LRU key selection + per-key throttle
  const idx = selectGroqKeyIndex();
  const elapsed = Date.now() - groqLastCallTime[idx];
  if (elapsed < MIN_GAP_MS) {
    await new Promise((r) => setTimeout(r, MIN_GAP_MS - elapsed));
  }
  groqLastCallTime[idx] = Date.now();

  const response = await groqClients[idx].chat.completions.create({
    model: modelId,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: input },
    ],
    temperature: 0.1,
    max_tokens: 1024,
  });

  groqLastCallTime[idx] = Date.now();
  return {
    output: response.choices[0].message.content ?? "",
    latencyMs: Date.now() - start,
  };
}

async function callCustomProvider(
  providerId: string,
  input: string,
  context?: string
): Promise<{ output: string; latencyMs: number }> {
  // Fetch provider config from DB
  const provider = await prisma.customProvider.findUnique({
    where: { id: providerId },
  });

  if (!provider) {
    throw new Error(`Custom provider not found: ${providerId}`);
  }

  if (!provider.isActive) {
    throw new Error(`Custom provider is inactive: ${provider.name}`);
  }

  // Build headers
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (provider.apiKey) {
    headers["Authorization"] = `Bearer ${provider.apiKey}`;
  }

  // Build system prompt
  const systemPrompt = context
    ? `You are a helpful AI assistant. Use this context to answer accurately: ${context}`
    : "You are a helpful AI assistant. Answer accurately and concisely.";

  // Groq throttle timestamp — use key 0 slot as the custom-provider sentinel
  const start = Date.now();
  groqLastCallTime[0] = Date.now();

  // Make OpenAI-compatible request
  const response = await fetch(`${provider.baseUrl}/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: provider.modelId,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: input },
      ],
      temperature: 0.1,
      max_tokens: 1024,
    }),
  });

  groqLastCallTime[0] = Date.now();

  if (!response.ok) {
    throw new Error(
      `Custom provider error [${provider.name}]: HTTP ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();

  const output = data.choices?.[0]?.message?.content;
  if (!output) {
    throw new Error(`Custom provider [${provider.name}]: empty response`);
  }

  return {
    output,
    latencyMs: Date.now() - start,
  };
}

export async function getAvailableModels() {
  const builtInModels = [
    // ── LLAMA 4 (Latest) ──────────────────────────────────
    { id: "meta-llama/llama-4-scout-17b-16e-instruct",    label: "Llama 4 Scout 17B",    speed: "very fast", provider: "groq"   },
    { id: "meta-llama/llama-4-maverick-17b-128e-instruct", label: "Llama 4 Maverick 17B", speed: "fast",      provider: "groq"   },

    // ── GPT OSS (Groq) ────────────────────────────────────
    { id: "openai/gpt-oss-120b",           label: "GPT OSS 120B",         speed: "fast",      provider: "groq"   },

    // ── LLAMA 3.x ─────────────────────────────────────────
    { id: "llama-3.3-70b-versatile",       label: "Llama 3.3 70B Versatile", speed: "fast",   provider: "groq"   },
    { id: "llama-3.1-8b-instant",          label: "Llama 3.1 8B Instant", speed: "very fast", provider: "groq"   },
    { id: "llama-3.2-3b-preview",          label: "Llama 3.2 3B",         speed: "very fast", provider: "groq"   },
    { id: "llama-3.2-11b-vision-preview",  label: "Llama 3.2 11B Vision", speed: "fast",      provider: "groq"   },
    { id: "llama-3.2-90b-vision-preview",  label: "Llama 3.2 90B Vision", speed: "fast",      provider: "groq"   },

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

  // Fetch active custom providers from DB
  const customProviders = await prisma.customProvider.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  });

  const customModels = customProviders.map((p) => ({
    id: `custom:${p.id}`,
    label: p.name,
    speed: p.lastLatencyMs ? `${p.lastLatencyMs}ms` : "unknown",
    provider: "custom" as const,
    description: p.description ?? undefined,
    modelId: p.modelId,
    baseUrl: p.baseUrl,
  }));

  return [...builtInModels, ...customModels];
}

export async function testProviderConnection(
  baseUrl: string,
  modelId: string,
  apiKey?: string | null
): Promise<{ ok: boolean; latencyMs?: number; error?: string }> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }

  const start = Date.now();

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: modelId,
        messages: [{ role: "user", content: "Say OK" }],
        max_tokens: 5,
        temperature: 0,
      }),
    });

    const latencyMs = Date.now() - start;

    if (!response.ok) {
      return {
        ok: false,
        error: `HTTP ${response.status} — ${response.statusText}`,
      };
    }

    const data = await response.json();
    const replied = data.choices?.[0]?.message?.content;
    void replied;

    return {
      ok: true,
      latencyMs,
      // Include first 50 chars of model response as confirmation
      error: undefined,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Connection failed",
    };
  }
}
