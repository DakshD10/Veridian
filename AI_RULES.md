# VERIDIAN — AI Rules & Instructions

### Paste this at the top of EVERY prompt you give to Codex, Cursor, or Windsurf.

### These rules prevent hallucination, garbage imports, and broken patterns.

---

## PRIME DIRECTIVE

You are building **Veridian** — an AI evaluation and regression testing platform.
Before writing any code, read every rule in this file.
If a rule conflicts with your instinct — follow the rule.
If you are unsure about something — write a comment and stop. Do not guess.

---

## RULE 1 — NEVER INVENT IMPORTS

Only import from packages that exist in `package.json` or `requirements.txt`.

### JavaScript/TypeScript — Allowed imports

```
next, react, react-dom
@prisma/client, @prisma/adapter-neon
@neondatabase/serverless, ws
zod
@tanstack/react-query
zustand
recharts
react-hook-form, @hookform/resolvers/zod
groq-sdk
tailwind-merge, clsx, class-variance-authority
lucide-react
shadcn/ui components (only ones already installed)
```

### JavaScript/TypeScript — NEVER import these (not installed)

```
axios                     → use native fetch() instead
express                   → this is Next.js, not Express
mongoose                  → use Prisma only
next-auth                 → no auth in this project
socket.io                 → use polling, not websockets
redis, ioredis            → no Redis in this project
bullmq                    → no job queues, use async/await
@langchain/core           → not installed, use groq-sdk directly
openai                    → use groq-sdk instead
```

### Python — Allowed imports

```
fastapi, uvicorn
deepeval
langgraph, langchain_groq
groq
httpx
pydantic
dotenv
datetime, typing, asyncio, os, json  ← stdlib, always fine
```

### Python — NEVER import these

```
flask                     → using FastAPI only
requests                  → use httpx instead
langchain                 → use langchain_groq specifically
openai                    → use groq instead
celery                    → no task queues
sqlalchemy                → using Prisma, not SQLAlchemy
django                    → wrong framework entirely
```

---

## RULE 2 — DATABASE ACCESS

**There is ONE way to access the database. Always use it.**

```typescript
// CORRECT — always import from this exact path
import { prisma } from "@/lib/prisma";

// WRONG — never do any of these
import { PrismaClient } from "@prisma/client"; // never instantiate directly
const prisma = new PrismaClient(); // never do this
import db from "@/db"; // this file doesn't exist
```

**Prisma query rules:**

- Always use `await` on every Prisma call
- Always wrap in try/catch
- Never use `prisma.$queryRaw` unless explicitly asked
- Always use relations via `include`, never manual joins

```typescript
// CORRECT
const suites = await prisma.evalSuite.findMany({
  include: { _count: { select: { testCases: true } } },
});

// WRONG — don't do raw queries
const suites = await prisma.$queryRaw`SELECT * FROM eval_suites`;
```

---

## RULE 3 — ROUTE HANDLER PATTERN

Every API route must follow this exact pattern. No exceptions.

```typescript
// src/app/api/[resource]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    // 1. Parse query params if needed
    const { searchParams } = new URL(req.url);
    const suiteId = searchParams.get("suiteId");

    // 2. Query database
    const data = await prisma.evalSuite.findMany();

    // 3. Return response
    return NextResponse.json(data);
  } catch (error) {
    console.error("[GET /api/resource]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // 1. Parse body
    const body = await req.json();

    // 2. Validate with Zod
    const schema = z.object({
      name: z.string().min(1, "Name is required"),
      description: z.string().optional(),
    });
    const data = schema.parse(body);

    // 3. Database operation
    const result = await prisma.evalSuite.create({ data });

    // 4. Return with correct status
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("[POST /api/resource]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
```

**Route handler rules:**

- NEVER put business logic in route handlers — call a service instead
- ALWAYS validate request body with Zod before touching Prisma
- ALWAYS wrap in try/catch with specific ZodError handling
- NEVER use `req.body` — use `await req.json()`
- NEVER use `res.json()` — use `NextResponse.json()`
- Dynamic route params: `{ params }: { params: { id: string } }` as second argument

---

## RULE 4 — SERVICE LAYER

Business logic lives in `src/services/`. Route handlers call services. Services call Prisma.

```typescript
// src/services/eval.service.ts

// CORRECT structure
export async function startEvalRun(suiteId: string, modelId: string) {
  // All the logic here
  const suite = await prisma.evalSuite.findUnique({ where: { id: suiteId } });
  // ...
  return result;
}

// Route handler calls it like this
import { startEvalRun } from "@/services/eval.service";

export async function POST(req: NextRequest) {
  const { suiteId, modelId } = schema.parse(await req.json());
  const run = await startEvalRun(suiteId, modelId);
  return NextResponse.json(run, { status: 201 });
}
```

**Service rules:**

- Services are plain async functions — no classes
- Services import `prisma` from `@/lib/prisma`
- Services import `groq` from `@/lib/groq`
- Services throw errors — route handlers catch them
- Never import a service into another service (keep flat)

---

## RULE 5 — GROQ API CALLS

```typescript
// CORRECT — use the singleton
import { groq } from "@/lib/groq";

const response = await groq.chat.completions.create({
  model: "llama3-70b-8192",
  messages: [{ role: "user", content: prompt }],
  temperature: 0.1,
  max_tokens: 1024,
});

const output = response.choices[0].message.content;

// WRONG — never do these
import Groq from "groq-sdk";
const client = new Groq({ apiKey: "..." }); // never instantiate directly
const client = new Groq({ apiKey: process.env.GROQ_API_KEY }); // still wrong
```

**Available Groq models — only use these IDs exactly:**

```
llama3-70b-8192       ← quality runs, report generation
llama3-8b-8192        ← fast runs, demo regression model
mixtral-8x7b-32768    ← long context
gemma2-9b-it          ← fallback
```

---

## RULE 6 — ENVIRONMENT VARIABLES

```typescript
// CORRECT
process.env.GROQ_API_KEY;
process.env.EVAL_ENGINE_URL;
process.env.DATABASE_URL;
process.env.NEXT_PUBLIC_APP_URL; // client-side (public)

// WRONG — never hardcode these
const key = "gsk_abc123...";
const url = "http://localhost:8001"; // use process.env.EVAL_ENGINE_URL
const url = "http://localhost:3000"; // use process.env.NEXT_PUBLIC_APP_URL
```

**Rule:** Every URL, key, and secret comes from `process.env`. No exceptions.

---

## RULE 7 — FRONTEND DATA FETCHING

```typescript
// CORRECT — always TanStack Query
import { useQuery, useMutation } from "@tanstack/react-query";

function SuitesPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["suites"],
    queryFn: () => fetch("/api/suites").then((r) => r.json()),
  });
}

// WRONG — never useEffect + fetch
function SuitesPage() {
  const [suites, setSuites] = useState([]);
  useEffect(() => {
    fetch("/api/suites")
      .then((r) => r.json())
      .then(setSuites); // ❌ never
  }, []);
}
```

**TanStack Query rules:**

- queryKey must be an array: `['suites']`, `['suites', id]`
- Always handle `isLoading` and `error` states
- Use `useMutation` for POST/PUT/DELETE, never fetch in event handlers
- Invalidate queries after mutations: `queryClient.invalidateQueries({ queryKey: ['suites'] })`

---

## RULE 8 — COMPONENT RULES

```typescript
// CORRECT component structure
"use client"; // only if component uses hooks or browser APIs

import { useState } from "react";
import { Button } from "@/components/ui/button"; // shadcn
import { cn } from "@/lib/utils";

interface Props {
  suiteId: string;
  onSuccess?: () => void;
}

export function SuiteCard({ suiteId, onSuccess }: Props) {
  // component code
}

// WRONG — never do these in components
import axios from "axios"; // not installed
import { useRouter } from "next/router"; // wrong — use next/navigation
import { useRouter } from "next/navigation"; // correct
fetch("/api/..."); // inside useEffect without TanStack Query  // wrong
```

**Component rules:**

- All components are named exports, not default exports (except page.tsx and layout.tsx)
- Always define a TypeScript interface for props — never use `any`
- Shadcn components live in `src/components/ui/` — import from there
- Custom components live in `src/components/[feature]/`
- Never put Prisma imports in components — data comes from API via TanStack Query
- `'use client'` only when needed (hooks, event handlers, browser APIs)
- Pages (`page.tsx`) are server components by default — keep them that way

---

## RULE 9 — PYTHON FASTAPI RULES

```python
# CORRECT route structure
from fastapi import APIRouter, HTTPException
from schemas.evaluate_schema import EvaluateRequest, EvaluateResponse

router = APIRouter()

@router.post("/evaluate", response_model=EvaluateResponse)
async def evaluate(request: EvaluateRequest):
    try:
        # logic here
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# WRONG
@app.post("/evaluate")     # never use app directly — use router
def evaluate(request):     # never sync — always async
    pass
```

**Python rules:**

- All FastAPI routes are `async def` — never plain `def`
- Always use Pydantic models for request and response — never raw dicts
- All HTTP calls use `httpx.AsyncClient` — never `requests`
- Environment variables via `os.getenv('GROQ_API_KEY')` — never hardcode
- Always `load_dotenv()` at the top of `main.py`

---

## RULE 10 — LANGGRAPH AGENT RULES

```python
# CORRECT node structure
from ..state import WatcherState
from datetime import datetime, timezone

def run(state: WatcherState) -> WatcherState:
    # 1. Do the work
    results = []  # whatever this node computes

    # 2. Update state (always return full state)
    state["test_results"] = results

    # 3. Always append to agent_trace
    state["agent_trace"].append({
        "node": "run_model",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "summary": f"Ran {len(results)} test cases against {state['new_model_id']}",
        "status": "done"
    })

    return state  # always return state

# WRONG
def run(state):           # missing type hint
    return {"results": results}   # never return partial state
```

**LangGraph rules:**

- Every node function signature: `def run(state: WatcherState) -> WatcherState`
- Every node must append to `state["agent_trace"]` before returning
- Always return the full state object — never a partial dict
- Never use `async def` for LangGraph nodes — they are synchronous
- Never raise exceptions inside nodes — catch and set `state["decision"] = "ERROR"`

---

## RULE 11 — STYLING RULES

```typescript
// CORRECT — use cn() for conditional classes
import { cn } from '@/lib/utils'

<div className={cn(
  "base-classes here",
  isActive && "active-class",
  variant === 'error' && "error-class"
)} />

// CORRECT — use Tailwind utility classes only
<div className="flex items-center gap-4 p-6 rounded-lg border bg-card" />

// WRONG — never inline styles
<div style={{ display: 'flex', padding: '24px' }} />  // ❌

// WRONG — never arbitrary Tailwind unless necessary
<div className="p-[13px] mt-[27px]" />  // ❌ use standard scale
```

**Styling rules:**

- Use Tailwind utility classes — no CSS modules, no styled-components
- Use `cn()` from `@/lib/utils` for conditional classes
- Use Shadcn design tokens: `bg-card`, `text-muted-foreground`, `border`, `ring` etc.
- Score colors: green = passing (≥0.75), amber = borderline (≥0.5), red = failing (<0.5)
- Never use arbitrary values unless standard scale doesn't cover it

---

## RULE 12 — ERROR HANDLING

```typescript
// CORRECT — specific error types
try {
  const data = schema.parse(body)
  const result = await prisma.evalSuite.create({ data })
  return NextResponse.json(result, { status: 201 })
} catch (error) {
  if (error instanceof z.ZodError) {
    return NextResponse.json({ error: error.errors }, { status: 400 })
  }
  if (error instanceof Error) {
    console.error('[context]', error.message)
  }
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
}

// WRONG
} catch (e) {
  return NextResponse.json({ error: e })  // exposes internals
}
} catch (e: any) {                        // never use any
  throw e                                 // never rethrow without handling
}
```

---

## RULE 13 — WHAT TO DO WHEN UNSURE

If you are not 100% sure about something — do this instead of guessing:

```typescript
// Write a TODO comment and move on
// TODO: implement PDF generation using @react-pdf/renderer
// Leaving as stub for now

export async function generateComplianceReport(runId: string) {
  // stub — returns empty buffer until implemented
  return Buffer.from("");
}
```

**Never:**

- Invent a package that might exist
- Guess a Prisma API method that you're not sure about
- Hallucinate an environment variable name
- Write code that depends on a file that hasn't been created yet

**Always:**

- Use a stub/placeholder when implementation is unclear
- Write a comment explaining what needs to go there
- Stop and ask rather than guessing

---

## RULE 14 — FILE NAMING AND LOCATION

```
src/app/api/**/route.ts          ← API route handlers ONLY
src/app/(dashboard)/**/page.tsx  ← UI pages ONLY
src/components/[feature]/*.tsx   ← React components
src/services/*.service.ts        ← Business logic
src/lib/*.ts                     ← Singletons and utilities
src/hooks/use*.ts                ← React hooks (camelCase, starts with use)
src/types/index.ts               ← All TypeScript types
src/store/*.store.ts             ← Zustand stores

eval_engine/routers/*.py         ← FastAPI routers
eval_engine/agent/nodes/*.py     ← LangGraph nodes
eval_engine/schemas/*_schema.py  ← Pydantic models
eval_engine/metrics/*.py         ← DeepEval wrappers
eval_engine/models/*.py          ← LLM client wrappers
```

**Never create files outside these locations without explicit instruction.**

---

## RULE 15 — THE AGENT CALLBACK FLOW

This is the most complex flow. Follow it exactly.

```
1. Next.js POST /api/deployments/[id]/trigger
   → Creates AgentRun in DB (status: "running")
   → POSTs to http://localhost:8001/agent/run with callback_url
   → Returns { agentRunId } immediately (202)

2. Python agent runs autonomously (7 nodes)
   → When complete, POSTs to callback_url:
     POST http://localhost:3000/api/agent-runs/[id]/result
     Body: { decision, newScore, regressionFound, reportSummary, agentTrace, evalRunId }

3. Next.js POST /api/agent-runs/[id]/result
   → Updates AgentRun in DB (status: "completed")
   → Returns 200

4. Frontend polls GET /api/agent-runs/[id] every 2 seconds
   → Shows trace steps as they appear in agentRun.agentTrace
   → Stops polling when status === "completed"
```

**Never change this flow. Never make it synchronous. Never use SSE.**

---

## QUICK REFERENCE CARD

| Question                         | Answer                                                                  |
| -------------------------------- | ----------------------------------------------------------------------- |
| How to access DB?                | `import { prisma } from '@/lib/prisma'`                                 |
| How to call Groq?                | `import { groq } from '@/lib/groq'`                                     |
| How to fetch data in components? | TanStack Query `useQuery`                                               |
| How to call eval engine?         | `fetch(process.env.EVAL_ENGINE_URL + '/evaluate')`                      |
| HTTP client in Python?           | `httpx.AsyncClient`                                                     |
| Where does business logic go?    | `src/services/*.service.ts`                                             |
| What validates API input?        | Zod schema in route handler                                             |
| How to style conditionally?      | `cn()` from `@/lib/utils`                                               |
| Agent callback URL?              | `process.env.NEXT_PUBLIC_APP_URL + '/api/agent-runs/' + id + '/result'` |
| How to handle unknown?           | Write a TODO stub, never guess                                          |

---

_This file is law. When in doubt, re-read it._
_Project: Veridian — Cipher · TechnoTarang 2026_
