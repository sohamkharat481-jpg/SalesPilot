# 📣 Campaigns Module

The Campaigns Module controls marketing outreach sequences, multi-day drips, custom email step delays, and personalized message rendering.

## 📁 Directory Architecture
```
campaigns/
├── steps/               # Outbound Step structures (Email, LinkedIn message)
├── templates/           # Custom B2B sequence copywriting blueprints
└── sequence-compiler.ts # Variable rendering compiler engine
```

## 🛠 Scalable Enterprise Guidelines
- **Token Personalization**: Handle missing dynamic variables (e.g. `{company}`) gracefully without outputting syntax tags to clients.
- **Chronological Drips**: Delay periods must validate as non-negative steps.
- **Type Enforcements**: Strictly assert step types to EMAIL or LINKEDIN.
