# 🧠 AI Module

Controls artificial intelligence prompts, LLM orchestration, Structured output schema enforcements, rate-limiting, and error-resilient fallbacks.

## 📁 Directory Architecture
```
ai/
├── prompts/             # Standard prompt string templates
├── testing/             # Prompt quality evaluation metrics
└── gemini-service.ts    # Google GenAI wrapper handlers
```

## 🛠 Scalable Enterprise Guidelines
- **Server-Side Exclusivity**: All Gemini API keys must remain hidden in backend environments. Never prefix keys with `VITE_`.
- **Graceful Failure**: If the Live API times out or quota is exceeded, load pre-baked mock responses to prevent UI degradation.
- **Model Selection**: Prefer `gemini-3.5-flash` for high-speed, cost-effective structured tasks.
