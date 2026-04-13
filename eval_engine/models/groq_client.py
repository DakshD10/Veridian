"""
groq_client.py — thin wrapper around GroqPool singleton.

Preserves the original call signature so every existing caller works
without modifications:
    call_groq(model_id, prompt, system="", temperature=0.1) -> dict

The throttle and key-rotation logic now lives in provider_pool.GroqPool.
"""

import time
from provider_pool import groq_pool


def call_groq(
    model_id: str,
    prompt: str,
    system: str = "",
    temperature: float = 0.1,
    max_tokens: int = 2048,
) -> dict:
    """
    Drop-in replacement for all existing Groq calls.
    Converts (model_id, prompt, system) → OpenAI-style messages list,
    routes through the round-robin pool, and returns { output, latency_ms }.
    Raises RuntimeError on API failure — caller must handle.
    """
    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})

    start = time.time()
    try:
        content = groq_pool.call(
            model=model_id,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        return {
            "output": content,
            "latency_ms": int((time.time() - start) * 1000),
        }
    except Exception as e:
        raise RuntimeError(f"Groq call failed [{model_id}]: {str(e)}")
