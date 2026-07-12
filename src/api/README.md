# 🌐 API Module

The versioned API Routing and Validation module maps controllers, validates request payloads, and standardizes payload envelopes.

## 📁 Directory Architecture
```
api/
├── v1/                  # REST API Version 1 endpoints (Leads, Deals, Payments)
└── routes-registry.ts   # Main route registration maps
```

## 🛠 Scalable Enterprise Guidelines
- **Standardized Formats**: Respond strictly with standard envelopes containing `success: boolean` and detailed `data` or `error` strings.
- **Fail-Safe Try/Catch**: Wrap all router controllers in global catch middleware to prevent server process crashes.
- **Strict Method Scoping**: Explicitly enforce suitable verbs (e.g. `POST` for mutations, `GET` for fetches).
