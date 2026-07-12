# 💼 CRM Module

The CRM (Customer Relationship Management) engine coordinates B2B client profile cards, kanban sales pipelines, deal valuations, status transitions, and action alerts.

## 📁 Directory Architecture
```
crm/
├── stages/              # Deal stages conversion pipelines
├── rating/              # AI lead scoring algorithm configurations
└── crm-service.ts       # Pipeline revenue and Deal modifier utilities
```

## 🛠 Scalable Enterprise Guidelines
- **Idempotency**: Guarantee that shifting a deal stage twice yields identical CRM metrics.
- **Transactional Consistency**: CRM status changes must synchronize with the main contacts list.
- **INR Normalization**: Express all local deals in high-precision B2B values.
