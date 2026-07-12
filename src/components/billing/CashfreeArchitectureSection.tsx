import React, { useState } from 'react';
import { Code, Terminal, Server, ArrowRight, ShieldCheck, Cpu, Layers } from 'lucide-react';

export function CashfreeArchitectureSection() {
  const [activeCodeTab, setActiveCodeTab] = useState<'server-order' | 'webhook-listen' | 'client-sdk'>('server-order');

  const codeSnippets = {
    'server-order': `// server/routes/payments.ts
import express from 'express';
import axios from 'axios';
import crypto from 'crypto';

const router = express.Router();

/**
 * 1. Create Order endpoint with Cashfree API
 * This registers an unpaid transaction and retrieves a payment_session_id.
 */
router.post('/create-order', async (req, res) => {
  const { tier, valueInr, customerEmail, customerPhone } = req.body;
  const orderId = \`SP_ORDER_\${tier}_\${Date.now()}\`;

  try {
    // 18% standard India Goods & Services Tax (GST)
    const gstAmount = Math.round(valueInr * 0.18);
    const totalAmount = valueInr + gstAmount;

    const payload = {
      order_id: orderId,
      order_amount: totalAmount,
      order_currency: 'INR',
      customer_details: {
        customer_id: 'CUST_HORIZON_MEDIA_01',
        customer_email: customerEmail || 'sohamkharat481@gmail.com',
        customer_phone: customerPhone || '9999999999',
      },
      order_meta: {
        return_url: 'https://salespilot.ai/billing?order_id={order_id}',
        notify_url: 'https://salespilot.ai/api/v1/payments/webhook',
      }
    };

    const response = await axios.post(
      process.env.CASHFREE_ENV === 'PROD'
        ? 'https://api.cashfree.com/pg/orders'
        : 'https://sandbox.cashfree.com/pg/orders',
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': process.env.CASHFREE_APP_ID || 'MOCK_APP_ID',
          'x-client-secret': process.env.CASHFREE_SECRET_KEY || 'MOCK_SECRET_KEY',
          'x-api-version': '2023-08-01'
        }
      }
    );

    res.json({
      success: true,
      order_id: orderId,
      cashfreeResponse: response.data // Contains payment_session_id
    });
  } catch (error: any) {
    console.error('Cashfree order generation failure:', error.response?.data || error.message);
    res.status(500).json({ success: false, error: 'Could not provision order context' });
  }
});

export default router;`,
    'webhook-listen': `// server/routes/webhooks.ts
import express from 'express';
import crypto from 'crypto';

const router = express.Router();

/**
 * 2. Cashfree Webhook Listener
 * Verifies authenticity before updating subscription tiers.
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.headers['x-webhook-signature'] as string;
  const timestamp = req.headers['x-webhook-timestamp'] as string;
  const rawBody = req.body.toString();

  if (!signature || !timestamp) {
    return res.status(401).json({ error: 'Missing security tokens' });
  }

  // Verify signature using Cashfree public secret key
  const secretKey = process.env.CASHFREE_SECRET_KEY!;
  const expectedSignature = crypto
    .createHmac('sha256', secretKey)
    .update(timestamp + rawBody)
    .digest('base64');

  if (signature !== expectedSignature) {
    return res.status(403).json({ error: 'Signature mismatch' });
  }

  const payload = JSON.parse(rawBody);

  // Handle transaction outcome
  if (payload.event === 'ORDER_PAID') {
    const { order_id, order_amount } = payload.data.order;
    console.log(\`Captured payment for order \${orderId}: ₹\${order_amount} INR\`);

    // TODO: Update database to mark user subscription tier active
    // await db.users.update({ where: { orderId }, data: { status: 'ACTIVE' } });
  }

  res.status(200).send('OK');
});

export default router;`,
    'client-sdk': `// src/components/billing/CashfreeClient.ts
/**
 * 3. Client Side Cashfree JS SDK Loader
 * Integrates directly within the frontend DOM safely.
 */
export async function loadCashfreeWebSdk(): Promise<any> {
  return new Promise((resolve, reject) => {
    if ((window as any).Cashfree) {
      return resolve((window as any).Cashfree);
    }
    const script = document.createElement('script');
    script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
    script.async = true;
    script.onload = () => {
      resolve((window as any).Cashfree);
    };
    script.onerror = () => {
      reject(new Error('Failed to load Cashfree script asset'));
    };
    document.body.appendChild(script);
  });
}

export async function initiateSdkCheckout(paymentSessionId: string) {
  const CashfreeSdk = await loadCashfreeWebSdk();
  
  const cashfree = new CashfreeSdk({
    mode: 'sandbox' // Swap to 'production' on deploy
  });

  // Renders beautiful local UPI, Netbanking & Card interface
  await cashfree.checkout({
    paymentSessionId,
    redirectTarget: '_modal' // Keep inside iframe modal safely
  });
}`
  };

  return (
    <div id="cashfree_architecture_section" className="space-y-6">
      
      {/* Overview header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <h3 className="text-xs font-mono font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-4.5 h-4.5 text-blue-600" /> Cashfree PG API Flow Design
          </h3>
          <p className="text-xs text-slate-500 mt-1">Modular architecture blueprint matching Indian RBI payment gateway recommendations.</p>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded font-semibold text-slate-500">GATEWAY DRAFT v3</span>
      </div>

      {/* Visual Sequence flow diagram */}
      <div className="p-6 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl space-y-4">
        <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest block">Sequential Integration Flow</span>
        
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 text-center text-xs">
          
          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-full lg:w-1/4 space-y-1.5 shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center font-bold mx-auto">1</div>
            <strong className="block text-slate-800 dark:text-slate-200">React Client</strong>
            <p className="text-[10px] text-slate-500">Post details to backend to initialize order parameters.</p>
          </div>

          <ArrowRight className="w-5 h-5 text-slate-350 transform rotate-90 lg:rotate-0" />

          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-full lg:w-1/4 space-y-1.5 shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center font-bold mx-auto">2</div>
            <strong className="block text-slate-800 dark:text-slate-200">Express Backend</strong>
            <p className="text-[10px] text-slate-500">Post secret key order payload to Cashfree Sandbox API.</p>
          </div>

          <ArrowRight className="w-5 h-5 text-slate-350 transform rotate-90 lg:rotate-0" />

          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-full lg:w-1/4 space-y-1.5 shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-600 flex items-center justify-center font-bold mx-auto">3</div>
            <strong className="block text-slate-800 dark:text-slate-200">Cashfree PG</strong>
            <p className="text-[10px] text-slate-500">Captures funds, sends signature-verified Webhook POST back.</p>
          </div>

        </div>
      </div>

      {/* Code Viewer tabs */}
      <div className="space-y-4">
        <div className="flex flex-wrap gap-1 border-b border-slate-200 dark:border-slate-800">
          {[
            { id: 'server-order', label: 'Order Generation Route', icon: Server },
            { id: 'webhook-listen', label: 'Signature Webhook', icon: ShieldCheck },
            { id: 'client-sdk', label: 'JS SDK Client Checkout', icon: Code }
          ].map((c) => {
            const Icon = c.icon;
            const active = activeCodeTab === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setActiveCodeTab(c.id as any)}
                className={`px-3 py-2 text-[11px] font-semibold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                  active 
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold bg-slate-50/60 dark:bg-slate-850/30' 
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {c.label}
              </button>
            );
          })}
        </div>

        {/* Code Block Container */}
        <div className="p-4 bg-slate-950 text-slate-100 border border-slate-900 rounded-xl overflow-x-auto text-[11px] font-mono leading-relaxed max-h-[360px] relative">
          <pre>{codeSnippets[activeCodeTab]}</pre>
        </div>
      </div>

    </div>
  );
}
