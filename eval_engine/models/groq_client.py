# eval_engine/models/groq_client.py
import time
import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

# Handle missing API key gracefully for import testing
if "GROQ_API_KEY" in os.environ and os.environ["GROQ_API_KEY"]:
    _client = Groq(api_key=os.environ["GROQ_API_KEY"])
else:
    _client = None

MIN_GAP_SECONDS = 2.5
_last_call_time = 0.0


def call_groq(model_id: str, prompt: str, system: str = "", temperature: float = 0.1) -> dict:
    """
    Throttled Groq call. Enforces minimum 2.5s between calls.
    Returns { output, latency_ms }.
    Raises RuntimeError on API failure — caller must handle.
    """
    if not _client:
        raise RuntimeError("GROQ_API_KEY not configured. Please set environment variable.")
    
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
