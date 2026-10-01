/**
 * Canonical Server-Side Plans, Limits & Pricing Configuration
 * 
 * Production billing MUST use these canonical values.
 * Client-submitted prices are NEVER trusted.
 */

/**
 * Temporary Founder-Only ₹1 UPI Test Mode Flag
 * Set to true to enable founder ₹1 connectivity test mode on production.
 * Set to false to disable immediately.
 */
export const ENABLE_FOUNDER_TEST_MODE = true;

export type CanonicalPlanId = 'FREE_TRIAL' | 'STARTER' | 'GROWTH' | 'BUSINESS' | 'ENTERPRISE' | 'TEST_PAYMENT';
export type BillingCycle = 'monthly' | 'annual';

export interface PlanPricing {
  id: CanonicalPlanId;
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  currency: 'INR';
  description: string;
  features: string[];
  limits: {
    leads: number;
    campaigns: number;
    teamMembers: number;
    meetings: number;
    calls: number;
    aiOutreach: number;
  };
}

export const CANONICAL_PLANS: Record<CanonicalPlanId, PlanPricing> = {
  FREE_TRIAL: {
    id: 'FREE_TRIAL',
    name: '1-Day Free Trial',
    monthlyPrice: 0,
    annualPrice: 0,
    currency: 'INR',
    description: 'Instant full access for 24 hours to explore all SalesPilot features.',
    features: [
      '24-Hour Premium Access',
      '50 Lead Searches',
      '1 Outreach Campaign',
      '2 Team Members',
      'Full CRM & Calendar Integration'
    ],
    limits: {
      leads: 50,
      campaigns: 1,
      teamMembers: 2,
      meetings: 5,
      calls: 10,
      aiOutreach: 100
    }
  },
  STARTER: {
    id: 'STARTER',
    name: 'Starter Pilot',
    monthlyPrice: 2499,
    annualPrice: 24990,
    currency: 'INR',
    description: 'Ideal for solo sales representatives and emerging outbound operations.',
    features: [
      '1 Workspace Account',
      '1,000 Lead Searches / mo',
      '5 Outreach Campaigns',
      '3 Team Members',
      'Direct Dialing & Call Recording',
      'Gmail & Google Calendar Sync'
    ],
    limits: {
      leads: 1000,
      campaigns: 5,
      teamMembers: 3,
      meetings: 50,
      calls: 200,
      aiOutreach: 2500
    }
  },
  GROWTH: {
    id: 'GROWTH',
    name: 'Growth Professional',
    monthlyPrice: 5999,
    annualPrice: 59990,
    currency: 'INR',
    description: 'Perfect for expanding sales teams needing multichannel workflows.',
    features: [
      'Up to 10 Workspace Seats',
      '5,000 Lead Searches / mo',
      '20 Multichannel Campaigns',
      '10 Team Members',
      'AI Vinci Outreach Copywriting',
      '1,000 Automated Calls / mo'
    ],
    limits: {
      leads: 5000,
      campaigns: 20,
      teamMembers: 10,
      meetings: 250,
      calls: 1000,
      aiOutreach: 10000
    }
  },
  BUSINESS: {
    id: 'BUSINESS',
    name: 'Scale Business',
    monthlyPrice: 11999,
    annualPrice: 119990,
    currency: 'INR',
    description: 'Designed for scaling sales organizations and fast-growing businesses.',
    features: [
      'Up to 25 Workspace Seats',
      '20,000 Lead Searches / mo',
      '50 Multichannel Campaigns',
      '25 Team Members',
      'Deep AI Company Research & Enrichment',
      '5,000 Calling Minutes',
      'Custom Webhook Integrations'
    ],
    limits: {
      leads: 20000,
      campaigns: 50,
      teamMembers: 25,
      meetings: 1000,
      calls: 5000,
      aiOutreach: 50000
    }
  },
  ENTERPRISE: {
    id: 'ENTERPRISE',
    name: 'Enterprise Agency',
    monthlyPrice: 29999,
    annualPrice: 249990,
    currency: 'INR',
    description: 'Bespoke high-volume solutions for agencies and enterprise sales floors.',
    features: [
      'Unlimited Workspace Seats',
      'Unlimited Lead Searches',
      'Unlimited Campaigns & Sequences',
      'Unlimited AI Outreach Generation',
      'Custom Inbound/Outbound Trunks',
      'Dedicated Account Manager & 24/7 SLA'
    ],
    limits: {
      leads: 999999,
      campaigns: 999999,
      teamMembers: 999999,
      meetings: 999999,
      calls: 999999,
      aiOutreach: 999999
    }
  },
  TEST_PAYMENT: {
    id: 'TEST_PAYMENT',
    name: '₹1 Test Payment',
    monthlyPrice: 1,
    annualPrice: 1,
    currency: 'INR',
    description: 'Development-only test payment.',
    features: ['Test payment flow verification'],
    limits: {
      leads: 0,
      campaigns: 0,
      teamMembers: 0,
      meetings: 0,
      calls: 0,
      aiOutreach: 0
    }
  }
};

/**
 * Normalizes user/client plan inputs to canonical plan IDs.
 */
export function normalizePlanId(plan: string): CanonicalPlanId {
  const upper = (plan || '').toUpperCase().trim();
  if (upper === 'PROFESSIONAL') return 'BUSINESS';
  if (upper === 'AGENCY') return 'ENTERPRISE';
  if (upper === 'FREE' || upper === 'TRIAL') return 'FREE_TRIAL';
  if (upper in CANONICAL_PLANS) return upper as CanonicalPlanId;
  return 'STARTER';
}

/**
 * Calculates server-authoritative payable price.
 * Never trust an amount supplied by the frontend.
 */
export function calculateCanonicalPayablePrice(plan: string, cycle: string): {
  planId: CanonicalPlanId;
  billingCycle: 'monthly' | 'annual';
  baseAmount: number;
  gstRate: number;
  gstAmount: number;
  totalAmount: number;
  currency: 'INR';
} {
  const planId = normalizePlanId(plan);
  const billingCycle: 'monthly' | 'annual' = (cycle || '').toLowerCase() === 'annual' ? 'annual' : 'monthly';

  if (planId === 'TEST_PAYMENT') {
    return {
      planId: 'TEST_PAYMENT',
      billingCycle,
      baseAmount: 1,
      gstRate: 0,
      gstAmount: 0,
      totalAmount: 1,
      currency: 'INR'
    };
  }

  const planConfig = CANONICAL_PLANS[planId];
  const baseAmount = billingCycle === 'annual' ? planConfig.annualPrice : planConfig.monthlyPrice;
  const gstRate = 0.18; // 18% GST standard Indian rate
  const gstAmount = Math.round(baseAmount * gstRate);
  const totalAmount = baseAmount + gstAmount;

  return {
    planId,
    billingCycle,
    baseAmount,
    gstRate,
    gstAmount,
    totalAmount,
    currency: 'INR'
  };
}
