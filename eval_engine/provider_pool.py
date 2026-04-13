"""
provider_pool.py — Veridian Three-Pool Architecture
Last updated: TechnoTarang 2026 migration (DeepSeek removed)

Three completely isolated Groq accounts:
  groq_runner_pool   → GROQ_API_KEY_1 + GROQ_API_KEY_2  (eval runs, red team execute)
  groq_judge_client  → GROQ_JUDGE_MODEL key              (gpt-oss-120b, temp=0, scoring + red team gen/analyze)
  gemini_pool        → GEMINI_API_KEY_1 + GEMINI_API_KEY_2 (suite gen + report writing ONLY)

DeepSeek REMOVED. openai SDK REMOVED. All LLM calls go through groq SDK or google-generativeai only.
"""

import os
import time
import threading
import groq as groq_sdk
from google import genai
from dotenv import load_dotenv

load_dotenv()

RUNNER_MIN_GAP = 2.5
GEMINI_MIN_GAP = 4.5
JUDGE_MODEL    = "llama-3.3-70b-versatile"


class GroqPool:
    """
    Unified 3-Key Pool (GROQ_API_KEY_1, GROQ_API_KEY_2, GROQ_JUDGE_MODEL -> API_KEY_3).
    Role: Handles ALL Groq requests (runner AND judging) natively.
    Yields 90 RPM overall.
    """

    def __init__(self):
        keys = [
            os.getenv("GROQ_API_KEY_1"),
            os.getenv("GROQ_API_KEY_2"),
            os.getenv("GROQ_JUDGE_MODEL")
        ]
        self._keys = [k for k in keys if k]
        if not self._keys:
            raise RuntimeError("No Groq keys found. Set GROQ_API_KEY_1, etc.")
        self._clients = [groq_sdk.Groq(api_key=k) for k in self._keys]
        self._last_call_time = {i: 0.0 for i in range(len(self._keys))}
        self._lock = threading.Lock()
        print(f"[GroqPool] Ready. Keys={len(self._keys)} EffectiveRPM={len(self._keys)*30}")

    def _lru_index(self) -> int:
        now = time.time()
        return max(range(len(self._keys)), key=lambda i: now - self._last_call_time[i])

    def call(self, model: str, messages: list, temperature: float = 0.1, max_tokens: int = 1024) -> str:
        """Standard sequential call with LRU key selection and 2.5s throttle."""
        with self._lock:
            idx = self._lru_index()
            gap = time.time() - self._last_call_time[idx]
            if gap < RUNNER_MIN_GAP:
                time.sleep(RUNNER_MIN_GAP - gap)
            self._last_call_time[idx] = time.time()
        print(f"[GroqPool] model={model} key={idx}")
        resp = self._clients[idx].chat.completions.create(
            model=model, messages=messages, temperature=temperature, max_tokens=max_tokens
        )
        return resp.choices[0].message.content

    def call_with_key(self, key_index: int, model: str, messages: list,
                      temperature: float = 0.1, max_tokens: int = 1024) -> str:
        """
        Pinned-key call for parallel workers (Red Team / Eval Evals).
        Worker manages its own timing. Ensures 3 concurrent threads can hit 3 unique accounts.
        """
        if key_index >= len(self._clients):
            raise ValueError(f"key_index {key_index} out of range for GroqPool")
        print(f"[GroqPool] parallel model={model} key={key_index}")
        resp = self._clients[key_index].chat.completions.create(
            model=model, messages=messages, temperature=temperature, max_tokens=max_tokens
        )
        return resp.choices[0].message.content


class GeminiPool:
    """
    LRU rotation: GEMINI_API_KEY_1 + GEMINI_API_KEY_2.
    Used ONLY for suite test case generation and watcher agent report writing.
    NEVER in per-test-case eval loop. NEVER in red team execute_attacks.
    Falls back gracefully — if no keys, calling code must use judge fallback.
    """

    REPORT_MODEL   = "gemini-2.0-flash"
    TEST_GEN_MODEL = "gemini-2.5-pro-preview-05-06"

    def __init__(self):
        keys = [os.getenv("GEMINI_API_KEY_1"), os.getenv("GEMINI_API_KEY_2")]
        self._keys = [k for k in keys if k]
        self._clients = [genai.Client(api_key=k) for k in self._keys]
        self._last_call_time = {i: 0.0 for i in range(len(self._keys))}
        self._lock = threading.Lock()
        if self._keys:
            print(f"[GeminiPool] Ready. Keys={len(self._keys)} EffectiveRPM={len(self._keys)*15}")
        else:
            print("[GeminiPool] WARNING: No keys found. Suite gen/reports will use judge fallback.")

    def _lru_index(self) -> int:
        now = time.time()
        return max(range(len(self._keys)), key=lambda i: now - self._last_call_time[i])

    def _call(self, model: str, prompt: str, temperature: float = 0.7) -> str:
        if not self._clients:
            raise RuntimeError("No Gemini keys configured")
        with self._lock:
            idx = self._lru_index()
            gap = time.time() - self._last_call_time[idx]
            if gap < GEMINI_MIN_GAP:
                time.sleep(GEMINI_MIN_GAP - gap)
            client = self._clients[idx]
            self._last_call_time[idx] = time.time()
        print(f"[GeminiPool] model={model} key={idx}")
        
        resp = client.models.generate_content(
            model=model,
            contents=prompt,
            config=genai.types.GenerateContentConfig(temperature=temperature)
        )
        return resp.text

    def run_model(self, model: str, messages: list, temperature: float = 0.1) -> str:
        """Run a Gemini model with chat-style messages for eval runs."""
        prompt = "\n".join(
            f"{m['role'].upper()}: {m['content']}" for m in messages
        )
        return self._call(model, prompt, temperature=temperature)

    def generate_report(self, prompt: str) -> str:
        return self._call(self.REPORT_MODEL, prompt, temperature=0.3)

    def generate_tests(self, prompt: str) -> str:
        return self._call(self.TEST_GEN_MODEL, prompt, temperature=0.8)

    @property
    def available(self) -> bool:
        return len(self._keys) > 0


# ── Singletons ──────────────────────────────────────────────────────
groq_pool   = GroqPool()
gemini_pool       = GeminiPool()


def provider_health() -> dict:
    return {
        "groq_pool": {
            "keys": len(groq_pool._keys),
            "effective_rpm": len(groq_pool._keys) * 30,
        },
        "gemini_pool": {
            "keys": len(gemini_pool._keys),
            "effective_rpm": len(gemini_pool._keys) * 15,
            "roles": ["suite_generation", "report_writing"],
            "available": gemini_pool.available,
        },
    }
