# 📅 Calendar Module

Handles appointment slots calculation, timezone conversions, Google Calendar Sync, and dynamic meeting generation.

## 📁 Directory Architecture
```
calendar/
├── slots/               # Timezone lookup grids
└── scheduler-service.ts # Availability algorithms
```

## 🛠 Scalable Enterprise Guidelines
- **Timezone Normalization**: Always save dates in UTC and convert to regional time zones on client views.
- **Double-booking prevention**: Lock dynamic slots during checkouts to avoid overlapping appointments.
- **Link Integrity**: Pre-bake reliable meeting rooms via Google Meet structure logic.
