# 💳 Direct UPI Payments & Subscriptions Module

Coordinates direct Scan & Pay UPI transactions, UTR submission, admin verification, and authoritative subscription entitlement management.

## 📁 Architecture
```
payments/
├── upiConfig.ts         # Centralized UPI ID, QR, Business Name configuration
├── pricingConfig.ts     # Canonical server-authoritative plans, prices, limits & tax
└── upiPaymentService.ts # Persistent database service (Supabase/PostgreSQL & LocalDB)
```

## 🔐 Security & Entitlement Model
1. **Server-Side Canonical Pricing**: Client amounts are NEVER trusted. Server resolves amount from canonical plan and billing cycle.
2. **Direct UPI QR Flow**: Customer scans QR code or clicks UPI intent link (`upi://pay?pa=...`) and enters payment UTR.
3. **Pending Verification**: Submissions are held in `PENDING_VERIFICATION` status until verified by an authorized admin. Subscriptions are NEVER auto-activated by user input.
4. **Admin Approval & Activation**: Only authorized billing administrators can approve or reject payments, activating subscriptions and issuing invoices.
