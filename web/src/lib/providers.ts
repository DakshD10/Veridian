export const PROVIDER_TEMPLATES = [
  {
    id: "ollama",
    label: "Ollama (local)",
    baseUrl: "http://localhost:11434/v1",
    modelId: "llama3",
    apiKey: "",
    description: "Local Ollama instance — no API key required",
  },
  {
    id: "vllm",
    label: "vLLM",
    baseUrl: "http://localhost:8000/v1",
    modelId: "",
    apiKey: "",
    description: "vLLM serving engine — OpenAI-compatible",
  },
  {
    id: "litellm",
    label: "LiteLLM Proxy",
    baseUrl: "http://localhost:4000",
    modelId: "",
    apiKey: "",
    description: "LiteLLM unified proxy for any model",
  },
  {
    id: "huggingface",
    label: "HuggingFace TGI",
    baseUrl: "https://[endpoint].endpoints.huggingface.cloud",
    modelId: "",
    apiKey: "",
    description: "HuggingFace Inference Endpoints",
  },
  {
    id: "azure",
    label: "Azure OpenAI",
    baseUrl: "https://[resource].openai.azure.com/openai/deployments/[deployment]",
    modelId: "",
    apiKey: "",
    description: "Azure OpenAI Service",
  },
  {
    id: "together",
    label: "Together AI",
    baseUrl: "https://api.together.xyz/v1",
    modelId: "",
    apiKey: "",
    description: "Together AI hosted open models",
  },
] as const;

export type ProviderTemplate = (typeof PROVIDER_TEMPLATES)[number];
