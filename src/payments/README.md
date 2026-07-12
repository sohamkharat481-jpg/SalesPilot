# 💳 Payments Module

Coordinates Cashfree checkout integrations, order tokens generation, signature verification hashes, and webhook validation algorithms.

## 📁 Directory Architecture
```
payments/
├── providers/           # Billing provider wrappers (Cashfree PG)
└── cashfree-client.ts   # Core client session initializer
```

## 🛠 Scalable Enterprise Guidelines
- **Idempotent Webhooks**: Guard against double webhook triggers from Cashfree.
- **Crypto Signatures**: Always verify HMAC signatures using your merchant keys before upgrading.
- **INR Compliance**: Fully comply with Indian financial transaction flow protocols.
