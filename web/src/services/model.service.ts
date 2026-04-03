import Groq from "groq-sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@/lib/prisma";

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

  if (modelId.startsWith("custom:")) {
    const providerId = modelId.replace("custom:", "");
    return callCustomProvider(providerId, input, context);
  }

  const model = (await getAvailableModels()).find(m => m.id === modelId);
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

  // Record call time for throttle (already waited in callModel)
  const start = Date.now();
  _lastCallTime = Date.now();

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

  _lastCallTime = Date.now();

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

    // ── LLAMA 3.x ─────────────────────────────────────────
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
