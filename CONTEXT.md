# VERIDIAN — AI Quality Infrastructure

### Full Project Context for AI IDEs (Cursor / Windsurf / Copilot / Antigravity)

> **Read this file before writing any code.**
> This is the single source of truth for the entire Veridian project.
> Every architectural decision, feature spec, data model, API contract, folder structure, and environment variable lives here.
> When in doubt — check this file first.

---

## 1. WHAT IS VERIDIAN?

Veridian is an **open-source, India-first AI evaluation and regression testing platform** — the missing quality infrastructure layer for teams deploying LLMs in production.

**Tagline:** _The truth layer for enterprise AI._

**Core problem it solves:**
AI teams ship model updates with zero automated quality checks. When a model silently regresses, nobody knows until users are harmed. Veridian closes this gap — with version-controlled eval suites, an automated model runner, a live quality dashboard, and an autonomous agent that catches regressions before users do.

**The Agentic Differentiator (Hackathon Compulsory):**
A LangGraph-powered autonomous agent that monitors AI deployments, auto-runs eval suites on every model/prompt version change, scores results against the quality baseline using Veridian's custom GroqJudge eval engine, and fires a structured regression report + Slack alert — zero human intervention required.

**Positioning:**

- India-first, DPDP compliance-ready
- Open-source alternative to Arize / Galileo / LangSmith
- Powered by Groq (free, extremely fast) + Custom GroqJudge + LangGraph
- Model-agnostic — run any LLM, same eval suite
- Zero vendor lock-in

---

## 2. DEPLOYMENT STRATEGY

**This project is demoed on localhost. There is no cloud deployment.**

```
localhost:3000  →  Next.js 15 (UI + all API Route Handlers + Prisma)
localhost:8002  →  Python FastAPI (Veridian GroqJudge eval engine + LangGraph agent)
cloud (Neon)    →  PostgreSQL database (just a connection string)
```

**Why port 8002:** Port 8001 was occupied on the dev machine. EVAL_ENGINE_URL is always read from environment — never hardcoded.

**Why Neon for DB even on localhost:**

- Neon is serverless PostgreSQL — free tier, no local Postgres setup needed
- Works identically from localhost via connection string
- No Docker, no local DB process to manage
- Prisma connects to it exactly the same way

**What this eliminates vs a deployed setup:**

- No Vercel config or `vercel.json`
- No Railway account or Dockerfile
- No deployment environment variables
- No CORS configuration
- No cloud-to-cloud networking between services
- Just `npm run dev` + `uvicorn` + Neon connection string

---

## 3. TECH STACK

### Next.js App (Frontend + Backend — one repo)

| Tool                  | Version         | Purpose                                              |
| --------------------- | --------------- | ---------------------------------------------------- |
| Next.js               | 15 (App Router) | Full-stack React framework — UI + API Route Handlers |
| TypeScript            | 5.x             | Type safety everywhere                               |
| Tailwind CSS          | 3.x             | Utility-first styling                                |
| Shadcn/ui             | latest          | Component library — install via CLI only             |
| Recharts              | latest          | Dashboard charts                                     |
| React Hook Form       | latest          | Form state                                           |
| Zod                   | latest          | Schema validation — API bodies and forms             |
| TanStack Query        | v5              | Server state, data fetching, cache                   |
| Zustand               | latest          | Lightweight global UI state                          |
| @google/generative-ai | latest          | Gemini SDK for model runner                          |
| @react-pdf/renderer   | latest          | PDF compliance report generation                     |

### Database

| Tool                     | Version | Purpose                                                                       |
| ------------------------ | ------- | ----------------------------------------------------------------------------- |
| Neon                     | —       | Serverless PostgreSQL — free tier, works from localhost via connection string |
| Prisma                   | 5.x     | ORM — type-safe queries, migrations, Prisma Studio                            |
| @prisma/adapter-neon     | latest  | Neon serverless adapter for Prisma                                            |
| @neondatabase/serverless | latest  | Neon WebSocket driver                                                         |
| ws                       | latest  | WebSocket implementation (required by Neon driver in Node.js)                 |

### Intelligence Layer

| Tool               | Purpose                                                                                                                                                                                                                                  |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Groq API           | Fast, free LLM inference. Primary provider for model runner and agent.                                                                                                                                                                   |
| Gemini API         | Google's Gemini models via @google/generative-ai SDK. Free tier available. gemini-1.5-flash, gemini-1.5-pro, gemini-2.0-flash.                                                                                                           |
| Veridian GroqJudge | Custom eval engine — structured rubric scoring for answer_relevancy, hallucination, faithfulness, correctness. Domain-aware prompts for healthcare, BFSI, hiring. llama-3.3-70b-versatile at temp=0. Replaces deepeval library entirely. |
| LangGraph (Python) | Agent StateGraph — 7-node autonomous eval watcher pipeline                                                                                                                                                                               |
| langchain-groq     | Groq LLM integration for LangGraph agent nodes                                                                                                                                                                                           |

### Python Eval Engine (runs locally on port 3001)

| Tool           | Version   | Purpose                                                |
| -------------- | --------- | ------------------------------------------------------ |
| FastAPI        | 0.111.0   | HTTP microservice — /evaluate and /agent/run           |
| Uvicorn        | 0.29.0    | ASGI server                                            |
| LangGraph      | >= 1.0    | Agent StateGraph orchestration                         |
| langchain      | >= 0.2.0  | Core chains and runnables architecture                 |
| langchain-core | >= 0.2.38 | Standard interface (LCEL) and types                    |
| langchain-groq | >= 0.1.6  | Groq LLM for LangGraph agent nodes                     |
| groq           | >= 0.9.0  | Direct Groq SDK — model runner + GroqJudge eval engine |
| httpx          | 0.27.0    | Async HTTP — agent POSTs results back to Next.js       |
| Pydantic       | >= 2.7.1  | Request/response validation                            |
| python-dotenv  | 1.0.1     | .env loading                                           |

**NOTE: deepeval is NOT used. Do not add it to requirements.txt.**

---

## 4. CORE FEATURES

### Feature 1 — Eval Suite Builder

- Create named eval suites (e.g. "Medical Triage v2 Evals")
- Each suite has test cases: { input, expectedOutput, context?, tags? }
- Suites tagged by domain: healthcare, bfsi, hiring, general
- Add test cases manually via UI form
- Full CRUD — create, read, update, delete suites and test cases

### Feature 2 — Model Runner

- Select a suite + one or more models (Groq or Gemini)
- Supports all Groq models + Gemini 1.5 Flash, 1.5 Pro, 2.0 Flash
- Runner sends each test case to each model, collects actual outputs
- Each call throttled at 2.5s minimum gap regardless of provider
- Responses scored by Veridian's custom GroqJudge eval engine:
  - `answer_relevancy` — is the response on-topic?
  - `hallucination` — does it contradict the context?
  - `faithfulness` — grounded in provided context?
  - `correctness` — matches expected output? (structured rubric — most accurate)
- **Every metric score is stored with a natural language reason** — the judge explains why it gave each score. This is what makes Veridian trustworthy.
- Results stored in Neon: `TestResult` (blob for compat) + `MetricScore` rows (queryable per metric)
- Side-by-side model comparison table in UI

### Feature 3 — Quality Dashboard

- Per-suite quality score over time (Recharts line chart)
- Per-model comparison (Recharts bar chart)
- Pass/fail breakdown per test case
- Regression indicators vs last run (red/green badges)
- Summary stat cards: total suites, total runs, regressions caught, avg score
- **Per-metric trend charts** — query MetricScore rows to show hallucination/relevancy trends independently

### Feature 4 — Agentic Regression Watcher (Hackathon Differentiator)

- Register a "Watched Deployment": name, current model, linked eval suite, quality threshold
- Trigger via "Simulate Version Change" button in UI (manually for demo)
- The LangGraph agent runs autonomously:
  1. **trigger_received** — validates inputs, logs event
  2. **load_eval_suite** — loads test cases from state
  3. **run_model** — calls Groq API for each test case (2.5s throttle between calls)
  4. **score_results** — Veridian GroqJudge scores all actual outputs using llama-3.3-70b-versatile at temp=0
  5. **compare_baseline** — compares new score vs previous score and threshold
  6. **generate_report** — Groq LLM writes a natural language summary
  7. **notify** — POSTs results to Next.js callback with **5-retry exponential backoff**; fires Slack alert if regression
- Full audit trail: every step logged in agentTrace JSON
- UI shows live node-by-node progress via polling (Next.js polls /api/agent-runs/[id] every 2s)
- Red regression alert banner if quality drops below threshold
- **Callback endpoint is idempotent** — duplicate deliveries return 409 and are safe to retry

### Feature 5 — Compliance Report

- One-click PDF export of any eval run
- Includes: model version, date, overall score, per-test-case breakdown with metric reasons
- Designed for DPDP audit readiness

---

## 5. DATABASE SCHEMA (Prisma + Neon)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")   // Neon pooled connection (PgBouncer) — runtime
  directUrl = env("DIRECT_URL")     // Neon direct connection — migrations only
}

model EvalSuite {
  id          String   @id @default(cuid())
  name        String
  description String?
  domain      String?  // "healthcare" | "bfsi" | "hiring" | "general"
  version     Int      @default(1)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  testCases          TestCase[]
  runs               EvalRun[]
  watchedDeployments WatchedDeployment[]
}

model TestCase {
  id             String   @id @default(cuid())
  suiteId        String
  input          String   // Prompt sent to the model
  expectedOutput String   // What a correct response looks like
  context        String?  // Optional RAG context for faithfulness/hallucination eval
  tags           String[] // e.g. ["high-risk", "triage"]
  createdAt      DateTime @default(now())

  suite   EvalSuite    @relation(fields: [suiteId], references: [id], onDelete: Cascade)
  results TestResult[]
}

model EvalRun {
  id           String    @id @default(cuid())
  suiteId      String
  modelId      String    // e.g. "llama3-70b-8192"
  modelVersion String?   // Optional label e.g. "v2.1"
  status       RunStatus @default(PENDING)
  triggeredBy  String    @default("manual") // "manual" | "agent"
  overallScore Float?    // 0.0 to 1.0
  passedCount  Int       @default(0)
  failedCount  Int       @default(0)
  createdAt    DateTime  @default(now())
  completedAt  DateTime?

  suite    EvalSuite    @relation(fields: [suiteId], references: [id])
  results  TestResult[]
  agentRun AgentRun?
}

model TestResult {
  id           String   @id @default(cuid())
  runId        String
  testCaseId   String
  modelOutput  String   // Raw model response
  scores       Json     // { answer_relevancy: 0.9, hallucination: 0.1, correctness: 0.7 } — kept for backward compat
  reasons      Json?    // { answer_relevancy: "Response directly addresses...", hallucination: "No contradiction found..." }
  overallScore Float    // Average of all metric scores
  passed       Boolean  // overallScore >= suite threshold
  latencyMs    Int?
  createdAt    DateTime @default(now())

  run           EvalRun       @relation(fields: [runId], references: [id], onDelete: Cascade)
  testCase      TestCase      @relation(fields: [testCaseId], references: [id])
  metricScores  MetricScore[]
}

// Queryable per-metric rows — enables "show all runs where hallucination > 0.5"
// This is additive to TestResult.scores Json — both are written on every eval run.
model MetricScore {
  id           String   @id @default(cuid())
  testResultId String
  metricName   String   // "answer_relevancy" | "hallucination" | "faithfulness" | "correctness"
  score        Float    // 0.0 to 1.0
  passed       Boolean  // score >= 0.5
  reason       String?  // Judge's natural language explanation for this score
  createdAt    DateTime @default(now())

  testResult TestResult @relation(fields: [testResultId], references: [id], onDelete: Cascade)

  @@index([metricName])
  @@index([score])
  @@index([testResultId])
}

model WatchedDeployment {
  id              String   @id @default(cuid())
  name            String
  description     String?
  suiteId         String
  currentModel    String   // Currently "deployed" model
  threshold       Float    @default(0.75) // Min acceptable overall score
  slackWebhookUrl String?
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  suite     EvalSuite  @relation(fields: [suiteId], references: [id])
  agentRuns AgentRun[]
}

model AgentRun {
  id              String   @id @default(cuid())
  deploymentId    String
  evalRunId       String?  @unique
  triggerEvent    String   // e.g. "Model downgraded from llama3-70b to llama3-8b"
  previousScore   Float?
  newScore        Float?
  regressionFound Boolean  @default(false)
  decision        String?  // "PASS" | "FAIL" | "ERROR"
  reportSummary   String?  // LLM-generated natural language summary
  agentTrace      Json?    // [{ node, timestamp, summary, status }]
  slackNotified   Boolean  @default(false)
  status          String   @default("running") // "running" | "completed" | "error"
  createdAt       DateTime @default(now())

  deployment WatchedDeployment @relation(fields: [deploymentId], references: [id])
  evalRun    EvalRun?          @relation(fields: [evalRunId], references: [id])
}

enum RunStatus {
  PENDING
  RUNNING
  COMPLETED
  FAILED
}
```

### Neon Connection — How to get your strings

1. Go to https://console.neon.tech → create project named "veridian"
2. Dashboard → Connection Details → switch tab to **"Prisma"**
3. Copy `DATABASE_URL` (pooled — has `pgbouncer=true`) → paste into `.env.local`
4. Copy `DIRECT_URL` (direct — no pgbouncer) → paste into `.env.local`
5. Never use `DIRECT_URL` in code — only Prisma uses it internally for migrations

---

## 6. PRISMA CLIENT SINGLETON (src/lib/prisma.ts)

**Copy this exactly. Never create `new PrismaClient()` anywhere else.**

```ts
// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";

// Required for Neon serverless driver in Node.js
neonConfig.webSocketConstructor = ws;

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaNeon(pool);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

---

## 7. API ROUTE HANDLERS

All backend logic lives in `src/app/api/**`. Route handlers only handle HTTP — validate input with Zod, call a service, return response. No business logic in route files.

### Route Handler pattern

```ts
// src/app/api/suites/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const suites = await prisma.evalSuite.findMany({
      include: { _count: { select: { testCases: true, runs: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(suites);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch suites" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const schema = z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      domain: z.string().optional(),
    });
    const data = schema.parse(body);
    const suite = await prisma.evalSuite.create({ data });
    return NextResponse.json(suite, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError)
      return NextResponse.json({ error: error.errors }, { status: 400 });
    return NextResponse.json(
      { error: "Failed to create suite" },
      { status: 500 },
    );
  }
}
```

### Complete Route Map

```
/api/suites
  GET    — List all suites (with test case + run counts)
  POST   — Create suite { name, description?, domain? }

/api/suites/[id]
  GET    — Suite detail with all test cases
  PUT    — Update suite
  DELETE — Delete suite (cascades test cases)

/api/suites/[id]/test-cases
  POST   — Add test case { input, expectedOutput, context?, tags? }

/api/suites/[id]/test-cases/[tcId]
  DELETE — Delete a test case

/api/runs
  GET    — List runs (query: suiteId?, modelId?, status?, limit?)
  POST   — Start eval run { suiteId, modelId, modelVersion? }
           Calls eval.service.ts → async orchestration
           Returns { runId } with status 202

/api/runs/[id]
  GET    — Run detail with all test results, scores, reasons, and metricScores

/api/runs/[id]/report
  GET    — Generate and download PDF compliance report (includes metric reasons)

/api/deployments
  GET    — List all watched deployments
  POST   — Create { name, suiteId, currentModel, threshold?, slackWebhookUrl? }

/api/deployments/[id]
  GET    — Deployment + recent agent runs
  PUT    — Update deployment
  DELETE — Delete

/api/deployments/[id]/trigger
  POST   — { newModelId, triggerEvent }
           Creates AgentRun, POSTs to Python /agent/run
           Returns { agentRunId } with status 202 immediately

/api/agent-runs
  GET    — List all agent runs

/api/agent-runs/[id]
  GET    — Full agent run with trace (polled every 2s by UI)

/api/agent-runs/[id]/result
  POST   — Internal callback: Python agent posts completed results here
           IDEMPOTENT — if already completed, returns 409 (not an error, retry-safe)

/api/dashboard
  GET    — { totalSuites, totalRuns, regressionsCaught, avgScore }

/api/dashboard/quality-trend
  GET    — ?suiteId=X&days=30 → [{ date, score, modelId }]

/api/dashboard/model-comparison
  GET    — ?suiteId=X → [{ modelId, avgScore, runCount }]

/api/dashboard/metric-trend
  GET    — ?suiteId=X&metric=hallucination&days=30
           Queries MetricScore rows directly for per-metric trend data
```

---

## 8. SERVICE LAYER (src/services/)

### eval.service.ts

```
startEvalRun(suiteId, modelId, modelVersion?)
  1. Create EvalRun in DB (status: PENDING)
  2. Fetch all TestCases for suite
  3. Update EvalRun status to RUNNING
  4. For each test case → model.service.callModel(modelId, input, context)
     NOTE: callModel has a built-in 2500ms throttle — do NOT call it in parallel.
     Call sequentially with for...of, never Promise.all.
  5. Batch all { testCaseId, actualOutput, latencyMs } results
  6. POST batch to process.env.EVAL_ENGINE_URL/evaluate
  7. Receive scored results from Veridian GroqJudge eval engine (includes scores + reasons)
  8. For each scored result:
     a. Create TestResult row with scores (Json blob) + reasons (Json blob)
     b. Create MetricScore rows — one row per metric, with score + reason
  9. Compute overallScore = average of all testResult.overallScore
  10. Update EvalRun: status COMPLETED, overallScore, passedCount, failedCount, completedAt
  11. Return completed EvalRun with results
```

### model.service.ts

```
THROTTLE RULE: All Groq calls in this service must wait at minimum 2500ms since
the last call (across the entire process). Both this service and the Python eval
engine share the same Groq API key and 30 RPM rate limit. Violating this causes
429 errors mid-run.

callModel(modelId, input, context?)
  — Wait for throttle (2500ms gap since last call)
  — Detect provider from getAvailableModels() by modelId
  — If provider === "gemini": use @google/generative-ai SDK
  — If provider === "groq" or unknown: use groq-sdk
  — temperature: 0.1 for both providers
  — Measure latency with Date.now()
  — Returns { output: string, latencyMs: number }
  — Updates _lastCallTime after EVERY call regardless of provider

getAvailableModels()
  — Returns hardcoded array of model objects with provider field:
    [
      { id: "llama3-70b-8192",              label: "Llama 3 70B",          speed: "fast",      provider: "groq"   },
      { id: "llama3-8b-8192",               label: "Llama 3 8B",           speed: "very fast", provider: "groq"   },
      { id: "llama-3.1-8b-instant",         label: "Llama 3.1 8B Instant", speed: "very fast", provider: "groq"   },
      { id: "llama-3.1-70b-versatile",      label: "Llama 3.1 70B",        speed: "fast",      provider: "groq"   },
      { id: "llama-3.2-1b-preview",         label: "Llama 3.2 1B",         speed: "very fast", provider: "groq"   },
      { id: "llama-3.2-3b-preview",         label: "Llama 3.2 3B",         speed: "very fast", provider: "groq"   },
      { id: "llama-3.2-11b-vision-preview", label: "Llama 3.2 11B Vision", speed: "fast",      provider: "groq"   },
      { id: "llama-3.2-90b-vision-preview", label: "Llama 3.2 90B Vision", speed: "fast",      provider: "groq"   },
      { id: "mixtral-8x7b-32768",           label: "Mixtral 8x7B",         speed: "fast",      provider: "groq"   },
      { id: "gemma2-9b-it",                 label: "Gemma 2 9B",           speed: "very fast", provider: "groq"   },
      { id: "gemma-7b-it",                  label: "Gemma 7B",             speed: "very fast", provider: "groq"   },
      { id: "gemini-1.5-flash",             label: "Gemini 1.5 Flash",     speed: "very fast", provider: "gemini" },
      { id: "gemini-1.5-pro",               label: "Gemini 1.5 Pro",       speed: "fast",      provider: "gemini" },
      { id: "gemini-2.0-flash",             label: "Gemini 2.0 Flash",     speed: "very fast", provider: "gemini" },
    ]

FULL IMPLEMENTATION:

import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const MIN_GAP_MS = 2500;
let _lastCallTime = 0;

async function throttle() {
  const elapsed = Date.now() - _lastCallTime;
  if (elapsed < MIN_GAP_MS) {
    await new Promise(res => setTimeout(res, MIN_GAP_MS - elapsed));
  }
}

export async function callModel(
  modelId: string,
  input: string,
  context?: string
): Promise<{ output: string; latencyMs: number }> {
  await throttle();

  const systemPrompt = context
    ? `You are a helpful AI assistant. Use this context to answer: ${context}`
    : "You are a helpful AI assistant. Answer accurately and concisely.";

  const start = Date.now();
  _lastCallTime = Date.now();

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
```

### agent.service.ts

```
triggerAgentRun(deploymentId, newModelId, triggerEvent)
  1. Fetch WatchedDeployment from DB (include suite + testCases)
  2. Get previousScore: find last COMPLETED EvalRun for this suite, take overallScore
  3. Create AgentRun in DB (status: "running")
  4. Build payload with full eval suite + test cases + callback URL
  5. Fire-and-forget: POST to process.env.EVAL_ENGINE_URL/agent/run
  6. Return { agentRunId } immediately

updateAgentRunResult(agentRunId, result)
  — Python agent calls /api/agent-runs/[id]/result when done
  — IDEMPOTENCY CHECK: if AgentRun.status is already "completed", return 409
  — Otherwise update AgentRun: newScore, decision, regressionFound, reportSummary,
    agentTrace, status: "completed"
```

### report.service.ts

```
generateComplianceReport(runId)
  — Fetch EvalRun + all TestResults (include metricScores) + EvalSuite + TestCase details
  — Build PDF using @react-pdf/renderer
  — Include per-test-case metric breakdown with judge reasons
  — Return PDF buffer for download
```

---

## 9. PYTHON EVAL ENGINE (localhost:8002)

Two endpoints. Runs as a local FastAPI process alongside Next.js.

### POST /evaluate

**Request:**

```json
{
  "test_cases": [
    {
      "id": "tc_abc123",
      "input": "What is the risk level for this patient?",
      "expected_output": "High risk — immediate intervention required.",
      "context": "Patient: 67yo male, chest pain, BP 180/110, diaphoretic.",
      "actual_output": "Medium risk — observe for 2 hours."
    }
  ],
  "metrics": [
    "answer_relevancy",
    "hallucination",
    "faithfulness",
    "correctness"
  ]
}
```

**Response:**

```json
{
  "results": [
    {
      "id": "tc_abc123",
      "passed": false,
      "scores": {
        "answer_relevancy": 0.79,
        "hallucination": 0.61,
        "faithfulness": 0.7,
        "correctness": 0.28
      },
      "reasons": {
        "answer_relevancy": "The response addresses the question of risk level but uses incorrect classification criteria.",
        "hallucination": "The response contradicts the provided context which indicates a high-acuity presentation.",
        "faithfulness": "The response is grounded in the context but draws an incorrect conclusion.",
        "correctness": "The expected output classifies as high risk with immediate intervention; actual output under-triages significantly."
      },
      "overall_score": 0.595
    }
  ],
  "summary": {
    "total": 1,
    "passed": 0,
    "failed": 1,
    "average_score": 0.595
  }
}
```

**IMPORTANT:** The response includes both `scores` AND `reasons`. The Next.js eval service must store these in both `TestResult.reasons` (Json) and individual `MetricScore.reason` (String) rows.

### POST /agent/run

**Request:**

```json
{
  "agent_run_id": "ar_xyz",
  "deployment_id": "dep_abc",
  "trigger_event": "Model downgraded from llama3-70b to llama3-8b",
  "new_model_id": "llama3-8b-8192",
  "previous_score": 0.88,
  "threshold": 0.75,
  "callback_url": "http://localhost:3000/api/agent-runs/ar_xyz/result",
  "slack_webhook_url": "https://hooks.slack.com/...",
  "eval_suite": {
    "id": "suite_123",
    "name": "Medical Triage Safety Evals",
    "test_cases": [
      {
        "id": "tc_1",
        "input": "...",
        "expected_output": "...",
        "context": "..."
      }
    ]
  }
}
```

**Response (immediate 202):**

```json
{ "status": "started", "agent_run_id": "ar_xyz" }
```

Agent runs async. When done, POSTs full results to `callback_url` with retry logic.

---

## 10. LANGGRAPH AGENT ARCHITECTURE

```
eval_engine/agent/watcher_agent.py
```

### State (eval_engine/agent/state.py)

```python
from typing import TypedDict, Optional, List

class WatcherState(TypedDict):
    # --- Inputs (set before graph starts) ---
    agent_run_id: str
    deployment_id: str
    trigger_event: str
    new_model_id: str
    previous_score: float
    threshold: float
    callback_url: str
    slack_webhook_url: Optional[str]
    eval_suite: dict             # { id, name, test_cases: [...] }

    # --- Built during execution ---
    test_results: List[dict]     # [{ id, actual_output, latency_ms }]
    scored_results: List[dict]   # [{ id, passed, scores, reasons, overall_score }]
    overall_score: float
    regression_found: bool
    decision: str                # "PASS" | "FAIL" | "ERROR"
    report_summary: str          # LLM-generated narrative
    agent_trace: List[dict]      # [{ node, timestamp, summary, status }]
```

### Graph (eval_engine/agent/watcher_agent.py)

```python
from langgraph.graph import StateGraph, START, END
from .nodes import (
    trigger_received, load_eval_suite, run_model,
    score_results, compare_baseline, generate_report, notify
)
from .state import WatcherState

graph = StateGraph(WatcherState)

graph.add_node("trigger_received",  trigger_received.invoke)
graph.add_node("load_eval_suite",   load_eval_suite.invoke)
graph.add_node("run_model",         run_model.invoke)
graph.add_node("score_results",     score_results.invoke)
graph.add_node("compare_baseline",  compare_baseline.invoke)
graph.add_node("generate_report",   generate_report.invoke)
graph.add_node("notify",            notify.invoke)

graph.add_edge(START, "trigger_received")
graph.add_edge("trigger_received", "load_eval_suite")
graph.add_edge("load_eval_suite",  "run_model")
graph.add_edge("run_model",        "score_results")
graph.add_edge("score_results",    "compare_baseline")
graph.add_edge("compare_baseline", "generate_report")
graph.add_edge("generate_report",  "notify")
graph.add_edge("notify",           END)

watcher = graph.compile()
```

### What each node does

```
trigger_received   — Validate state, append trace entry
load_eval_suite    — Confirm test cases present, log count to agent_trace
run_model          — For each test case: call Groq API with new_model_id using the
                     throttled groq_client (2.5s gap between calls). Store
                     { id, actual_output, latency_ms } in test_results.
score_results      — Call run_deepeval() from metrics/deepeval_runner.py.
                     Uses Veridian GroqJudge (llama-3.3-70b-versatile, temp=0).
                     Stores scored_results including reasons per metric.
compare_baseline   — Set regression_found = overall_score < threshold, set decision = "PASS"/"FAIL"
generate_report    — Call Groq LLM (llama-3.3-70b-versatile): prompt includes scored
                     summary + per-metric reasons. Produce 2-3 sentence report_summary.
notify             — POST full results to callback_url with 5-retry exponential backoff.
                     If regression + slack_webhook_url: POST Slack message.
```

### Node template (copy for each node)

```python
# eval_engine/agent/nodes/run_model.py
from ..state import WatcherState
from datetime import datetime, timezone

def invoke(state: WatcherState) -> WatcherState:
    # Modern LangChain patterns: use model.invoke(prompt) rather than old predict/run calls
    # ... do the work ...
    state["agent_trace"].append({
        "node": "run_model",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "summary": f"Ran {len(state['test_results'])} test cases against {state['new_model_id']}",
        "status": "done"
    })
    return state
```

---

## 11. VERIDIAN CUSTOM EVAL ENGINE (eval_engine/metrics/deepeval_runner.py)

**This is one of the most critical files in the project. Read this section fully before implementing.**

### Architecture Decision

Veridian uses a custom GroqJudge implementation instead of the deepeval library.
The file is named `deepeval_runner.py` for import compatibility with the rest of the codebase.
The judge model, temperature, scoring behavior, and output format are identical to
the original spec — but with zero dependency conflicts and domain-aware structured rubrics.

**Do NOT install deepeval. Do NOT import deepeval anywhere.**

When a hackathon judge asks how scoring works, the answer is:
"We built our own eval engine with structured rubrics tuned for healthcare, BFSI,
and hiring domains. The judge is always llama-3.3-70b-versatile at temperature=0
for deterministic, reproducible scores."

### The Judge Hierarchy Rule

The model doing evaluation must always be stronger than the model being evaluated.
JUDGE_MODEL is always "llama-3.3-70b-versatile" — hardcoded, never configurable.
Temperature MUST be 0 for deterministic scores.

### Four Metrics with Structured Rubrics

**answer_relevancy** — Does the response address what was asked?

- 1.0: Directly and fully addresses the question with appropriate detail
- 0.75: Addresses the question but misses some important aspects
- 0.5: Partially addresses the question
- 0.25: Tangentially related but mostly misses the question
- 0.0: Does not address the question at all

**hallucination** — Does the response contradict or fabricate beyond context?

- 1.0: No hallucinations — all claims supported by context (higher = better)
- 0.75: Minor unsupported claims, no direct contradictions
- 0.5: Some unsupported claims or mild contradictions
- 0.25: Contradicts context in significant ways
- 0.0: Severely contradicts context or fabricates critical information

**faithfulness** — Are claims grounded in the provided context?

- 1.0: Every claim directly supported by context
- 0.75: Most claims supported, minor reasonable extrapolations
- 0.5: Some claims supported, others unsupported
- 0.25: Few claims supported by context
- 0.0: Ignores context entirely or contradicts it

**correctness** — Does the response match the expected answer?

- 1.0: Semantically equivalent to or better than expected answer
- 0.75: Mostly correct with minor omissions
- 0.5: Partially correct — gets some key points, misses others
- 0.25: Right general direction but significant errors
- 0.0: Wrong, misleading, or contradicts expected answer

### Full Implementation

````python
# eval_engine/metrics/deepeval_runner.py
"""
Veridian Custom Eval Engine
Judge: llama-3.3-70b-versatile at temperature=0 (deterministic)
Structured rubrics tuned for healthcare, BFSI, and hiring domains.
2.5s throttle prevents Groq rate limit errors.
One metric failure never kills the entire run.
DO NOT import deepeval — this file replaces it entirely.
"""
import os
import json
import time
from groq import Groq

_client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
JUDGE_MODEL = "llama-3.3-70b-versatile"

MIN_GAP_SECONDS = 2.5
_last_call_time = 0.0


def _throttled_groq_call(prompt: str) -> str:
    global _last_call_time
    elapsed = time.time() - _last_call_time
    if elapsed < MIN_GAP_SECONDS:
        time.sleep(MIN_GAP_SECONDS - elapsed)
    _last_call_time = time.time()
    try:
        response = _client.chat.completions.create(
            model=JUDGE_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an expert AI quality evaluation judge with deep expertise "
                        "in healthcare, financial services, and hiring domains. "
                        "You evaluate AI model outputs with clinical precision. "
                        "You must respond with ONLY a valid JSON object — "
                        "no markdown fences, no explanation outside the JSON."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0,
            max_tokens=300,
        )
        _last_call_time = time.time()
        return response.choices[0].message.content
    except Exception as e:
        _last_call_time = time.time()
        raise RuntimeError(f"Groq judge call failed: {str(e)}")


def _parse_judge_response(raw: str, metric: str) -> tuple[float, str]:
    try:
        clean = raw.strip()
        if "```" in clean:
            parts = clean.split("```")
            for part in parts:
                part = part.strip()
                if part.startswith("json"):
                    part = part[4:].strip()
                if part.startswith("{"):
                    clean = part
                    break
        parsed = json.loads(clean)
        score = max(0.0, min(1.0, float(parsed["score"])))
        reason = str(parsed.get("reason", "No reason provided"))
        return round(score, 4), reason
    except Exception as e:
        return 0.0, f"Judge parse error for {metric}: {str(e)}"


def _score_answer_relevancy(tc: dict) -> tuple[float, str]:
    prompt = f"""Evaluate ANSWER RELEVANCY: Does the AI response directly and completely address what was asked?

QUESTION: {tc['input']}
AI RESPONSE: {tc['actual_output']}

Scoring rubric:
- 1.0: Response directly and fully addresses the question with appropriate detail
- 0.75: Response addresses the question but misses some important aspects
- 0.5: Response partially addresses the question
- 0.25: Response is tangentially related but mostly misses the question
- 0.0: Response does not address the question at all

Respond with ONLY this JSON object:
{{"score": <float 0.0-1.0>, "reason": "<specific one-sentence explanation>"}}"""
    raw = _throttled_groq_call(prompt)
    return _parse_judge_response(raw, "answer_relevancy")


def _score_hallucination(tc: dict) -> tuple[float, str]:
    context = tc.get("context") or "No context provided"
    prompt = f"""Evaluate HALLUCINATION: Does the AI response contradict or fabricate information beyond what the context supports?

CONTEXT: {context}
AI RESPONSE: {tc['actual_output']}

Scoring rubric (higher score = LESS hallucination = BETTER):
- 1.0: No hallucinations — all claims supported by or consistent with context
- 0.75: Minor unsupported claims but no direct contradictions
- 0.5: Some unsupported claims or mild contradictions
- 0.25: Contradicts context in significant ways
- 0.0: Severely contradicts context or fabricates critical information

Respond with ONLY this JSON object:
{{"score": <float 0.0-1.0>, "reason": "<specific one-sentence explanation>"}}"""
    raw = _throttled_groq_call(prompt)
    return _parse_judge_response(raw, "hallucination")


def _score_faithfulness(tc: dict) -> tuple[float, str]:
    context = tc.get("context") or "No context provided"
    prompt = f"""Evaluate FAITHFULNESS: Are the claims in the AI response grounded in and supported by the provided context?

CONTEXT: {context}
AI RESPONSE: {tc['actual_output']}

Scoring rubric:
- 1.0: Every claim directly supported by context
- 0.75: Most claims supported, minor extrapolations are reasonable
- 0.5: Some claims supported, others are unsupported extrapolations
- 0.25: Few claims are supported by context
- 0.0: Response ignores context entirely or contradicts it

Respond with ONLY this JSON object:
{{"score": <float 0.0-1.0>, "reason": "<specific one-sentence explanation>"}}"""
    raw = _throttled_groq_call(prompt)
    return _parse_judge_response(raw, "faithfulness")


def _score_correctness(tc: dict) -> tuple[float, str]:
    prompt = f"""Evaluate CORRECTNESS: How accurately does the AI response match the expected correct answer?

QUESTION: {tc['input']}
EXPECTED CORRECT ANSWER: {tc['expected_output']}
AI RESPONSE: {tc['actual_output']}

Scoring rubric:
- 1.0: Semantically equivalent to or better than expected answer
- 0.75: Mostly correct with minor omissions or differences
- 0.5: Partially correct — gets some key points but misses others
- 0.25: Right general direction but significant errors
- 0.0: Wrong, misleading, or contradicts the expected answer

Respond with ONLY this JSON object:
{{"score": <float 0.0-1.0>, "reason": "<specific one-sentence explanation>"}}"""
    raw = _throttled_groq_call(prompt)
    return _parse_judge_response(raw, "correctness")


_SCORERS = {
    "answer_relevancy": _score_answer_relevancy,
    "hallucination": _score_hallucination,
    "faithfulness": _score_faithfulness,
    "correctness": _score_correctness,
}


def run_deepeval(test_cases_payload: list[dict]) -> list[dict]:
    """
    Veridian Eval Engine entry point.
    Input:  list of dicts with keys: id, input, expected_output, actual_output, context
    Output: list of dicts with keys: id, passed, scores, reasons, overall_score
    One metric failure never kills the run — failures are isolated per metric.
    """
    metrics = ["answer_relevancy", "hallucination", "faithfulness", "correctness"]
    results = []

    for tc in test_cases_payload:
        scores = {}
        reasons = {}

        for metric in metrics:
            scorer = _SCORERS.get(metric)
            if not scorer:
                scores[metric] = 0.0
                reasons[metric] = f"Unknown metric: {metric}"
                continue
            try:
                score, reason = scorer(tc)
                scores[metric] = score
                reasons[metric] = reason
            except Exception as e:
                scores[metric] = 0.0
                reasons[metric] = f"Metric evaluation error: {str(e)}"

        overall = round(sum(scores.values()) / len(scores), 4) if scores else 0.0
        passed = overall >= 0.5

        results.append({
            "id": tc["id"],
            "passed": passed,
            "scores": scores,
            "reasons": reasons,
            "overall_score": overall,
        })

    return results
````

---

## 12. GROQ THROTTLE CLIENT (eval_engine/models/groq_client.py)

**All Groq calls for the model runner node must go through this module.**
Both Next.js and Python share the same API key (same 30 RPM bucket).
At 2.5s minimum gap: max ~24 calls/min — leaves headroom for the GroqJudge calls.

```python
# eval_engine/models/groq_client.py
import time
import os
from groq import Groq

_client = Groq(api_key=os.environ["GROQ_API_KEY"])

MIN_GAP_SECONDS = 2.5
_last_call_time = 0.0


def call_groq(model_id: str, prompt: str, system: str = "", temperature: float = 0.1) -> dict:
    """
    Throttled Groq call. Enforces minimum 2.5s between calls.
    Returns { output, latency_ms }.
    Raises RuntimeError on API failure — caller must handle.
    """
    global _last_call_time

    elapsed = time.time() - _last_call_time
    if elapsed < MIN_GAP_SECONDS:
        time.sleep(MIN_GAP_SECONDS - elapsed)

    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})

    start = time.time()
    _last_call_time = time.time()

    try:
        response = _client.chat.completions.create(
            model=model_id,
            messages=messages,
            temperature=temperature,
            max_tokens=1024,
        )
        _last_call_time = time.time()
        return {
            "output": response.choices[0].message.content,
            "latency_ms": int((time.time() - start) * 1000),
        }
    except Exception as e:
        _last_call_time = time.time()
        raise RuntimeError(f"Groq call failed [{model_id}]: {str(e)}")
```

---

## 13. NOTIFY NODE — RETRY + IDEMPOTENCY (eval_engine/agent/nodes/notify.py)

**This is the most failure-prone integration point. Implement exactly as specified.**

The Python agent POSTs back to Next.js when the agent run finishes. If Next.js is
slow, the callback can fail. The retry loop handles this transparently.

The Next.js callback endpoint returns 409 if the result was already stored — this
is not an error, it means a previous retry already delivered successfully. Treat 409
as success.

```python
# eval_engine/agent/nodes/notify.py
import httpx
import asyncio
from datetime import datetime, timezone
from ..state import WatcherState

MAX_RETRIES = 5
RETRY_DELAYS_SECONDS = [2, 4, 8, 16, 32]  # Exponential backoff


async def _post_with_retry(url: str, payload: dict) -> bool:
    async with httpx.AsyncClient(timeout=30.0) as client:
        for attempt, delay in enumerate(RETRY_DELAYS_SECONDS[:MAX_RETRIES]):
            try:
                response = await client.post(url, json=payload)
                if response.status_code in (200, 201, 409):
                    return True
                print(
                    f"[notify] Attempt {attempt + 1}: got HTTP {response.status_code}, "
                    f"retrying in {delay}s"
                )
            except (httpx.ConnectError, httpx.TimeoutException, httpx.NetworkError) as e:
                print(f"[notify] Attempt {attempt + 1}: network error ({e}), retrying in {delay}s")

            await asyncio.sleep(delay)

    print(f"[notify] All {MAX_RETRIES} attempts exhausted. Callback delivery FAILED.")
    return False


def invoke(state: WatcherState) -> WatcherState:
    payload = {
        "agent_run_id":     state["agent_run_id"],
        "new_score":        state["overall_score"],
        "previous_score":   state["previous_score"],
        "regression_found": state["regression_found"],
        "decision":         state["decision"],
        "report_summary":   state["report_summary"],
        "agent_trace":      state["agent_trace"],
        "scored_results":   state["scored_results"],
    }

    callback_url = state["callback_url"]
    success = asyncio.run(_post_with_retry(callback_url, payload))

    if state["regression_found"] and state.get("slack_webhook_url"):
        slack_payload = {
            "text": (
                f":rotating_light: *Regression detected* — {state['decision']}\n"
                f"Score: `{state['previous_score']:.2f}` → `{state['overall_score']:.2f}` "
                f"(threshold: `{state['threshold']:.2f}`)\n"
                f"_{state['report_summary']}_"
            )
        }
        try:
            asyncio.run(
                httpx.AsyncClient().post(state["slack_webhook_url"], json=slack_payload)
            )
        except Exception as e:
            print(f"[notify] Slack notification failed (non-fatal): {e}")

    state["agent_trace"].append({
        "node": "notify",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "summary": (
            f"Callback {'delivered successfully' if success else 'FAILED after all retries'}. "
            f"Slack {'alert sent' if state['regression_found'] else 'skipped (no regression)'}."
        ),
        "status": "done" if success else "error",
    })

    return state
```

---

## 14. CALLBACK ENDPOINT — IDEMPOTENCY (src/app/api/agent-runs/[id]/result/route.ts)

**This endpoint must be idempotent.** The Python retry loop may deliver the same
result multiple times. If the run is already completed, return 409 — do not
re-apply the update.

```ts
// src/app/api/agent-runs/[id]/result/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const ResultSchema = z.object({
  agent_run_id: z.string(),
  new_score: z.number(),
  previous_score: z.number(),
  regression_found: z.boolean(),
  decision: z.string(),
  report_summary: z.string(),
  agent_trace: z.array(z.any()),
  scored_results: z.array(z.any()),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const body = await req.json();
    const data = ResultSchema.parse(body);

    const existing = await prisma.agentRun.findUnique({
      where: { id: params.id },
      select: { status: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Agent run not found" },
        { status: 404 },
      );
    }

    if (existing.status === "completed") {
      return NextResponse.json(
        { message: "Already completed — idempotent duplicate ignored" },
        { status: 409 },
      );
    }

    await prisma.agentRun.update({
      where: { id: params.id },
      data: {
        newScore: data.new_score,
        previousScore: data.previous_score,
        regressionFound: data.regression_found,
        decision: data.decision,
        reportSummary: data.report_summary,
        agentTrace: data.agent_trace,
        status: "completed",
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError)
      return NextResponse.json({ error: error.errors }, { status: 400 });
    return NextResponse.json(
      { error: "Failed to save result" },
      { status: 500 },
    );
  }
}
```

---

## 15. SCORE BREAKDOWN COMPONENT (src/components/runs/ScoreBreakdown.tsx)

**The judge's reasons are the trust layer. Always render them alongside scores.**

```tsx
// src/components/runs/ScoreBreakdown.tsx
interface MetricScore {
  metricName: string;
  score: number;
  passed: boolean;
  reason: string | null;
}

interface ScoreBreakdownProps {
  metrics: MetricScore[];
}

export function ScoreBreakdown({ metrics }: ScoreBreakdownProps) {
  return (
    <div className="space-y-3">
      {metrics.map((m) => (
        <div key={m.metricName} className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium capitalize text-sm">
              {m.metricName.replace(/_/g, " ")}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono font-medium">
                {(m.score * 100).toFixed(0)}%
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  m.passed
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {m.passed ? "pass" : "fail"}
              </span>
            </div>
          </div>
          {m.reason && (
            <p className="text-sm text-muted-foreground italic border-l-2 border-muted pl-3 mt-2">
              {m.reason}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
```

---

## 16. LIVE AGENT PROGRESS (Polling — no SSE)

The UI polls `/api/agent-runs/[id]` every 2 seconds while `status === "running"`.

```ts
// src/hooks/useAgentRunPolling.ts
import { useQuery } from "@tanstack/react-query";

export function useAgentRunPolling(agentRunId: string | null) {
  return useQuery({
    queryKey: ["agent-run", agentRunId],
    queryFn: () => fetch(`/api/agent-runs/${agentRunId}`).then((r) => r.json()),
    enabled: !!agentRunId,
    refetchInterval: (data) => {
      if (data?.status === "completed" || data?.status === "error")
        return false;
      return 2000;
    },
  });
}
```

---

## 17. FOLDER STRUCTURE

```
veridian/
│
├── web/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   │
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── (dashboard)/
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── dashboard/page.tsx
│   │   │   │   ├── suites/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── new/page.tsx
│   │   │   │   │   └── [id]/
│   │   │   │   │       ├── page.tsx
│   │   │   │   │       └── run/page.tsx
│   │   │   │   ├── runs/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── [id]/page.tsx
│   │   │   │   ├── deployments/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── new/page.tsx
│   │   │   │   │   └── [id]/page.tsx
│   │   │   │   └── agent/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   └── api/
│   │   │       ├── suites/route.ts + [id]/
│   │   │       ├── runs/route.ts + [id]/
│   │   │       ├── deployments/route.ts + [id]/trigger/
│   │   │       ├── agent-runs/route.ts + [id]/result/
│   │   │       └── dashboard/route.ts + quality-trend/ + model-comparison/ + metric-trend/
│   │   │
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   ├── layout/ (Sidebar, Header, PageShell)
│   │   │   ├── suites/ (SuiteCard, TestCaseTable, AddTestCaseForm)
│   │   │   ├── runs/ (RunStatusBadge, ResultsTable, ScoreBreakdown, ModelRunForm)
│   │   │   ├── dashboard/ (StatCard, QualityTrendChart, ModelComparisonChart)
│   │   │   └── agent/ (AgentRunCard, AgentTraceViewer, RegressionAlert)
│   │   │
│   │   ├── services/
│   │   │   ├── eval.service.ts
│   │   │   ├── model.service.ts
│   │   │   ├── agent.service.ts
│   │   │   └── report.service.ts
│   │   │
│   │   ├── lib/prisma.ts
│   │   ├── hooks/
│   │   └── types/index.ts
│   │
│   ├── package.json
│   └── .env.local
│
├── eval_engine/
│   ├── main.py
│   ├── requirements.txt
│   ├── .env
│   ├── routers/evaluate.py + agent.py
│   ├── agent/watcher_agent.py + state.py + nodes/
│   ├── metrics/deepeval_runner.py   ← Veridian GroqJudge (NOT deepeval library)
│   ├── models/groq_client.py
│   └── schemas/evaluate_schema.py + agent_schema.py
│
├── CONTEXT.md
└── README.md
```

---

## 18. ENVIRONMENT VARIABLES

### Next.js — `.env.local`

```env
DATABASE_URL="postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/veridian?sslmode=require&pgbouncer=true&connect_timeout=15"
DIRECT_URL="postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/veridian?sslmode=require"
GROQ_API_KEY="gsk_..."
GEMINI_API_KEY="your_gemini_api_key_here"  # from aistudio.google.com
EVAL_ENGINE_URL="http://localhost:3001"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Python Eval Engine — `eval_engine/.env`

```env
GROQ_API_KEY="gsk_..."
```

---

## 19. PACKAGE.JSON DEPENDENCIES

```json
{
  "dependencies": {
    "next": "^15.0.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "typescript": "^5.0.0",
    "@prisma/client": "^5.0.0",
    "@prisma/adapter-neon": "^5.0.0",
    "@neondatabase/serverless": "^0.9.0",
    "ws": "^8.18.0",
    "zod": "^3.23.0",
    "@tanstack/react-query": "^5.0.0",
    "zustand": "^4.5.0",
    "recharts": "^2.12.0",
    "react-hook-form": "^7.51.0",
    "@hookform/resolvers": "^3.3.0",
    "groq-sdk": "^0.9.0",
    "@google/generative-ai": "latest",
    "@react-pdf/renderer": "^3.4.0",
    "tailwind-merge": "^2.3.0",
    "clsx": "^2.1.0",
    "class-variance-authority": "^0.7.0",
    "lucide-react": "^0.383.0"
  },
  "devDependencies": {
    "prisma": "^5.0.0",
    "@types/node": "^20.0.0",
    "@types/react": "^18.0.0",
    "@types/ws": "^8.0.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```

---

## 20. PYTHON requirements.txt

```
fastapi==0.111.0
uvicorn==0.29.0
langgraph>=1.0.0
langchain>=0.2.0
langchain-core>=0.2.38
langchain-groq>=0.1.6
groq>=0.9.0
httpx==0.27.0
pydantic>=2.7.1
python-dotenv==1.0.1
```

**deepeval is NOT in requirements.txt. Do not add it.**

---

## 21. MODEL REFERENCE

| Model ID                                      | Provider | Speed     | Notes                       |
| --------------------------------------------- | -------- | --------- | --------------------------- |
| llama-3.3-70b-versatile                       | Groq     | Fast      | JUDGE ONLY — never testable |
| meta-llama/llama-4-scout-17b-16e-instruct     | Groq     | Very fast | Latest Llama 4              |
| meta-llama/llama-4-maverick-17b-128e-instruct | Groq     | Fast      | Latest Llama 4              |
| llama3-70b-8192                               | Groq     | Fast      | Demo baseline model         |
| llama3-8b-8192                                | Groq     | Very fast | Demo regression model       |
| llama-3.1-8b-instant                          | Groq     | Very fast | Fast inference              |
| openai/gpt-oss-120b                           | Groq     | Fast      | Best reasoning on Groq      |
| openai/gpt-oss-20b                            | Groq     | Very fast | Fast GPT OSS                |
| qwen/qwen3-32b                                | Groq     | Fast      | Strong reasoning            |
| moonshotai/kimi-k2-instruct                   | Groq     | Fast      | 256K context                |
| mixtral-8x7b-32768                            | Groq     | Fast      | Long context                |
| gemma2-9b-it                                  | Groq     | Very fast | Lightweight                 |
| gemini-2.0-flash                              | Gemini   | Very fast | Best free Gemini            |
| gemini-1.5-pro                                | Gemini   | Fast      | High quality                |
| gemini-1.5-flash                              | Gemini   | Very fast | Fast Gemini                 |

**Judge model rule:** `llama-3.3-70b-versatile` is ONLY used inside `deepeval_runner.py` as `JUDGE_MODEL`.
It is never listed as a testable model in `getAvailableModels()`.

---

## 22. SEED DATA (prisma/seed.ts)

Seed creates a complete working demo environment so the hackathon demo works from first run.

**1. EvalSuite:** "Medical Triage AI — Safety Evals", domain: "healthcare", 10 test cases

**2. EvalRun A — Baseline (good model)**

- modelId: "llama3-70b-8192", status: COMPLETED, overallScore: 0.88, passedCount: 9, failedCount: 1

**3. EvalRun B — Regression (bad model)**

- modelId: "llama3-8b-8192", status: COMPLETED, overallScore: 0.54, passedCount: 4, failedCount: 6, triggeredBy: "agent"

**4. Seed TestResult + MetricScore rows for both runs:**
Each EvalRun must have 10 TestResult rows. Each TestResult must have 4 MetricScore rows (one per metric).
Both are written in the same Prisma transaction. Without MetricScore rows the dashboard charts are empty.

**5. WatchedDeployment:** "Triage AI — Production", currentModel: "llama3-70b-8192", threshold: 0.75

**6. AgentRun** linked to Run B:

- triggerEvent: "Model downgraded from llama3-70b-8192 to llama3-8b-8192 for cost reduction"
- previousScore: 0.88, newScore: 0.54, regressionFound: true, decision: "FAIL", status: "completed"
- agentTrace: 7 completed step objects (one per node)

---

## 23. HACKATHON LIVE DEMO SCRIPT (3 minutes)

**Before demo:** Both services running, seed data loaded, browser open on /dashboard.

**[0:00 — 0:30] Dashboard**
Open /dashboard. Point to stat cards: "3 suites · 12 runs · 2 regressions caught."
_"This is Veridian — the quality layer your AI is missing in production."_

**[0:30 — 1:00] Eval Suite**
Click "Medical Triage AI." Show 10 test cases — input, expected output.
_"These are the questions we ask the model. Real patient scenarios. We define what correct looks like."_

**[1:00 — 1:20] Watched Deployment**
Navigate to Deployments → "Triage AI Production."
Show: current model llama3-70b, threshold 0.75, last score 0.88 (green).
_"We're watching this deployment. If quality ever drops below 0.75, the agent fires."_

**[1:20 — 2:20] Fire the Agent — THE MONEY SHOT**
Click "Simulate Version Change." Set new model: llama3-8b. Click Trigger.
Go to Agent page. Watch trace update node by node every 2 seconds:
✓ trigger*received → ✓ load_eval_suite → ✓ run_model → ✓ score_results → ✓ compare_baseline → ✓ generate_report → ✓ notify
Red banner appears: **"⚠️ REGRESSION DETECTED — Score dropped 0.88 → 0.54. Rollback recommended."**
*"The agent caught it. Zero human involvement."\_

**[2:20 — 2:40] The Report**
Click into the failed run. Show per-case breakdown. Show the judge's reasoning per metric.
_"Full audit trail. Every test case scored. The judge explains every verdict. One-click PDF for any regulator."_

**[2:40 — 3:00] Close**
_"Every other team built a chatbot. We built the infrastructure that makes sure chatbots don't silently break when they're making decisions about real people. This is Veridian."_

---

## 24. CODING RULES FOR AI IDEs

1. **Always `async/await`** — never `.then()` chains
2. **Route Handlers only do HTTP** — parse body, validate with Zod, call service, return response. Zero business logic in route files.
3. **All DB access via Prisma** — never raw SQL
4. **Always use `prisma` from `src/lib/prisma.ts`** — never `new PrismaClient()` anywhere else
5. **Zod validates every API request body** — no unvalidated input ever reaches Prisma
6. **TanStack Query for all data fetching** — never `useEffect + fetch` in components
7. **Shadcn components via CLI** — `npx shadcn@latest add [component]`, never copy-paste manually
8. **Agent runs are async** — `POST /deployments/[id]/trigger` returns 202 + `{ agentRunId }` immediately. Python POSTs back to `/api/agent-runs/[id]/result` when done.
9. **Polling not SSE** — use `useAgentRunPolling` hook (TanStack Query `refetchInterval`) for live agent progress
10. **Never hardcode env vars** — always `process.env.VARIABLE_NAME`
11. **Python eval engine URL** — always `process.env.EVAL_ENGINE_URL`. Default port is 8002 — never hardcode any port.
12. **Neon connection string** — `DATABASE_URL` has `pgbouncer=true` for runtime. `DIRECT_URL` is for migrations only. Never swap them.
13. **Never call Groq in parallel** — in eval.service.ts use `for...of` over test cases, never `Promise.all`. The 2.5s throttle only works sequentially.
14. **Always write MetricScore rows** — when creating a TestResult, always also `createMany` MetricScore rows in the same transaction. Never create one without the other.
15. **Always include reasons in API responses** — any endpoint returning TestResult data must include the `metricScores` relation so the UI can render judge reasoning.
16. **Callback endpoint returns 409 for duplicates** — the Python retry loop treats 409 as success. Never return 200 for a duplicate delivery as that would mask bugs.
17. **Judge model is not a testable model** — `llama-3.3-70b-versatile` appears only inside `deepeval_runner.py` as `JUDGE_MODEL`. It never appears in `getAvailableModels()`.
18. **`@react-pdf/renderer` is in package.json** — always include it when installing dependencies.
19. **Do NOT install or import deepeval** — Veridian uses its own GroqJudge eval engine in `metrics/deepeval_runner.py`. The file name is kept for import compatibility only.
20. **Multi-provider model routing** — callModel() detects provider
    from getAvailableModels(). Groq models use groq-sdk. Gemini models
    use @google/generative-ai. The 2.5s throttle applies to ALL
    providers. Never hardcode provider logic outside model.service.ts.

---

## 25. SETUP COMMANDS

```bash
# ── NEXT.JS SETUP ──────────────────────────────────────────

npm install
cp .env.example .env.local
# Fill in DATABASE_URL, DIRECT_URL, GROQ_API_KEY, EVAL_ENGINE_URL=http://localhost:3001

npx prisma generate
npx prisma migrate dev
npx prisma db seed
npm run dev                # http://localhost:3000


# ── PYTHON EVAL ENGINE ─────────────────────────────────────

cd eval_engine
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Fill in GROQ_API_KEY

uvicorn main:app --reload --port 8002
curl http://localhost:8002/health
# Should return: {"status":"ok"}


# ── VERIFY FULL STACK ──────────────────────────────────────

curl http://localhost:3000/api/dashboard
curl http://localhost:3000/api/runs
```

---

_Single source of truth for Veridian — LunaticBytes · TechnoTarang 2026_
_Two terminals. One connection string. Custom GroqJudge eval engine. Go build._
