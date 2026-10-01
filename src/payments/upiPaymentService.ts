import { getPrivilegedSupabaseServerClient, getSupabaseServerClient } from '../lib/supabase.server';
import { LocalDB } from '../database/localDb';
import { getUpiBillingConfig } from './upiConfig';
import { calculateCanonicalPayablePrice, normalizePlanId, CANONICAL_PLANS, CanonicalPlanId } from './pricingConfig';

export interface PaymentRecord {
  id: string;
  organization_id: string;
  user_id: string;
  plan: CanonicalPlanId;
  billing_cycle: 'monthly' | 'annual';
  amount: number;
  currency: string;
  upi_id: string;
  utr: string;
  payment_status: 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED';
  payment_datetime: string;
  submitted_at: string;
  verified_at?: string | null;
  verified_by?: string | null;
  subscription_id?: string | null;
  rejection_reason?: string | null;
  notes?: string | null;
  // Joined display fields
  customer_name?: string;
  customer_email?: string;
  organization_name?: string;
}

export interface SubscriptionRecord {
  id: string;
  organization_id: string;
  user_id?: string;
  plan: CanonicalPlanId;
  billing_cycle: 'monthly' | 'annual';
  status: 'ACTIVE' | 'PENDING_VERIFICATION' | 'EXPIRED' | 'CANCELLED';
  current_period_start: string;
  current_period_end: string;
  created_at: string;
  updated_at: string;
}

export interface InvoiceRecord {
  id: string;
  invoice_number: string;
  organization_id: string;
  user_id: string;
  payment_id: string;
  plan: CanonicalPlanId;
  billing_cycle: 'monthly' | 'annual';
  base_amount: number;
  gst_amount: number;
  total_amount: number;
  currency: string;
  status: 'PAID';
  issued_at: string;
  paid_at: string;
  payment_method: 'UPI';
  utr: string;
}

const localDb = LocalDB.getInstance();

export class UpiPaymentService {
  /**
   * Submits a customer UPI payment for verification.
   * Calculates canonical price strictly on server.
   * Status is initialized to PENDING_VERIFICATION. Subscription is NOT auto-activated.
   */
  public static async submitPayment(params: {
    organizationId: string;
    userId: string;
    plan: string;
    billingCycle: string;
    utr: string;
    paymentDateTime?: string;
    notes?: string;
    customerName?: string;
    customerEmail?: string;
  }): Promise<{ success: boolean; payment?: PaymentRecord; error?: string }> {
    const { organizationId, userId, plan, billingCycle, utr, paymentDateTime, notes } = params;

    if (!organizationId || !userId) {
      return { success: false, error: 'Organization ID and User ID are required.' };
    }

    const cleanUtr = (utr || '').trim().toUpperCase();
    if (!cleanUtr || cleanUtr.length < 6) {
      return { success: false, error: 'A valid UPI Transaction Reference (UTR) is required (minimum 6 characters).' };
    }

    // 1. Duplicate UTR check across all organizations
    const isDuplicate = await this.checkDuplicateUtr(cleanUtr);
    if (isDuplicate) {
      return { success: false, error: 'This UTR / Transaction ID has already been submitted.' };
    }

    // 2. Server canonical pricing resolution
    const pricing = calculateCanonicalPayablePrice(plan, billingCycle);
    const upiConfig = getUpiBillingConfig();

    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const nowIso = new Date().toISOString();

    const payment: PaymentRecord = {
      id: paymentId,
      organization_id: organizationId,
      user_id: userId,
      plan: pricing.planId,
      billing_cycle: pricing.billingCycle,
      amount: pricing.totalAmount,
      currency: 'INR',
      upi_id: upiConfig.upiId,
      utr: cleanUtr,
      payment_status: 'PENDING_VERIFICATION',
      payment_datetime: paymentDateTime || nowIso,
      submitted_at: nowIso,
      verified_at: null,
      verified_by: null,
      subscription_id: null,
      rejection_reason: null,
      notes: notes || null,
      customer_name: params.customerName || '',
      customer_email: params.customerEmail || ''
    };

    // 3. Save to database
    await this.persistPaymentRecord(payment);

    // 4. Update organization's subscription status to PENDING_VERIFICATION (without granting plan entitlement yet)
    await this.setSubscriptionPending(organizationId, userId, pricing.planId, pricing.billingCycle);

    console.log(`[UPI BILLING] Payment ${paymentId} submitted with UTR ${cleanUtr} for org ${organizationId}. Amount: ₹${pricing.totalAmount}. Status: PENDING_VERIFICATION`);

    return { success: true, payment };
  }

  /**
   * Checks whether a UTR has already been registered.
   */
  public static async checkDuplicateUtr(utr: string): Promise<boolean> {
    const cleanUtr = utr.trim().toUpperCase();

    // Check Supabase first
    const client = getSupabaseServerClient();
    if (client) {
      try {
        const { data, error } = await client
          .from('payments')
          .select('id')
          .eq('utr', cleanUtr)
          .maybeSingle();

        if (!error && data) {
          return true;
        }
      } catch (err) {
        // Fall back to localDb check
      }
    }

    // Check LocalDB
    const existing = localDb.getPayments().find(p => (p.utr || '').toUpperCase() === cleanUtr);
    return Boolean(existing);
  }

  /**
   * Retrieves payments for an organization.
   */
  public static async getPaymentsForOrg(organizationId: string): Promise<PaymentRecord[]> {
    const client = getSupabaseServerClient();
    if (client) {
      try {
        const { data, error } = await client
          .from('payments')
          .select('*')
          .eq('organization_id', organizationId)
          .order('submitted_at', { ascending: false });

        if (!error && data && data.length > 0) {
          return data as PaymentRecord[];
        }
      } catch (err) {}
    }

    return localDb.getPayments()
      .filter(p => p.organization_id === organizationId)
      .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());
  }

  /**
   * Retrieves all pending payments across all organizations (for authorized Admins).
   */
  public static async getAllPendingPayments(): Promise<PaymentRecord[]> {
    const client = getSupabaseServerClient();
    if (client) {
      try {
        const { data, error } = await client
          .from('payments')
          .select('*')
          .eq('payment_status', 'PENDING_VERIFICATION')
          .order('submitted_at', { ascending: false });

        if (!error && data) {
          return data as PaymentRecord[];
        }
      } catch (err) {}
    }

    return localDb.getPayments()
      .filter(p => p.payment_status === 'PENDING_VERIFICATION')
      .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());
  }

  /**
   * Admin approves a payment:
   * 1. Marks payment VERIFIED, sets verified_at and verified_by
   * 2. Sets persistent subscription ACTIVE with calculated period end (1 month or 1 year)
   * 3. Activates user and organization plan entitlement
   * 4. Generates persistent tax invoice
   */
  public static async approvePayment(paymentId: string, adminUserId: string): Promise<{
    success: boolean;
    payment?: PaymentRecord;
    subscription?: SubscriptionRecord;
    invoice?: InvoiceRecord;
    error?: string;
  }> {
    // 1. Locate payment
    let payment: PaymentRecord | null = null;
    const client = getSupabaseServerClient();

    if (client) {
      try {
        const { data } = await client
          .from('payments')
          .select('*')
          .eq('id', paymentId)
          .maybeSingle();
        if (data) payment = data as PaymentRecord;
      } catch (err) {}
    }

    if (!payment) {
      payment = localDb.getPayments().find(p => p.id === paymentId) || null;
    }

    if (!payment) {
      return { success: false, error: `Payment record ${paymentId} not found.` };
    }

    if (payment.payment_status === 'VERIFIED') {
      return { success: false, error: 'Payment is already verified.' };
    }

    const now = new Date();
    const periodStart = now.toISOString();
    const periodEndDate = new Date(now);
    if (payment.billing_cycle === 'annual') {
      periodEndDate.setFullYear(periodEndDate.getFullYear() + 1);
    } else {
      periodEndDate.setDate(periodEndDate.getDate() + 30);
    }
    const periodEnd = periodEndDate.toISOString();

    const subId = payment.subscription_id || `sub_${payment.organization_id}_${Date.now()}`;

    // Update payment
    payment.payment_status = 'VERIFIED';
    payment.verified_at = periodStart;
    payment.verified_by = adminUserId;
    payment.subscription_id = subId;

    // Create / Update Subscription (Skip for TEST_PAYMENT)
    let subscription: SubscriptionRecord | null = null;
    if (payment.plan !== 'TEST_PAYMENT') {
      subscription = {
        id: subId,
        organization_id: payment.organization_id,
        user_id: payment.user_id,
        plan: payment.plan,
        billing_cycle: payment.billing_cycle,
        status: 'ACTIVE',
        current_period_start: periodStart,
        current_period_end: periodEnd,
        created_at: periodStart,
        updated_at: periodStart
      };
    }

    // Calculate invoice amounts (Skip for TEST_PAYMENT: No GST / commercial invoice issued)
    let invoice: InvoiceRecord | null = null;
    let invoiceNumber = 'N/A (TEST_PAYMENT)';
    if (payment.plan !== 'TEST_PAYMENT') {
      const pricing = calculateCanonicalPayablePrice(payment.plan, payment.billing_cycle);
      invoiceNumber = `SP-${now.getFullYear()}-INV-${Math.floor(1000 + Math.random() * 9000)}`;
      invoice = {
        id: `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        invoice_number: invoiceNumber,
        organization_id: payment.organization_id,
        user_id: payment.user_id,
        payment_id: payment.id,
        plan: payment.plan,
        billing_cycle: payment.billing_cycle,
        base_amount: pricing.baseAmount,
        gst_amount: pricing.gstAmount,
        total_amount: payment.amount,
        currency: 'INR',
        status: 'PAID',
        issued_at: periodStart,
        paid_at: periodStart,
        payment_method: 'UPI',
        utr: payment.utr
      };
    }

    // Persist to Supabase if configured
    if (client) {
      try {
        await client.from('payments').upsert(payment);
        if (subscription) await client.from('subscriptions').upsert(subscription);
        if (invoice) await client.from('invoices').upsert(invoice);
        // Update organizations and users tier
        if (subscription) {
            await client.from('organizations').update({ plan: payment.plan, tier: payment.plan }).eq('id', payment.organization_id);
            await client.from('users').update({ tier: payment.plan, subscription_status: 'ACTIVE' }).eq('id', payment.user_id);
        }
      } catch (err) {
        console.warn('[UPI BILLING] Supabase approval sync notice:', err);
      }
    }

    // Persist to LocalDB
    localDb.updatePayment(payment.id, payment);
    if (subscription) localDb.saveSubscription(subscription);
    if (invoice) localDb.addInvoice(invoice);

    // Update local user and organization
    if (subscription) {
      const org = localDb.getOrganizationById(payment.organization_id);
      if (org) {
        (org as any).tier = payment.plan;
        (org as any).plan = payment.plan;
        try { localDb.save(); } catch (_) {}
      }
      const usr = localDb.getUserById(payment.user_id);
      if (usr) {
        usr.tier = payment.plan as any;
        (usr as any).subscriptionStatus = 'ACTIVE';
        try { localDb.save(); } catch (_) {}
      }
    }

    console.log(`[UPI BILLING] [APPROVED] Payment ${paymentId} verified by admin ${adminUserId}. Subscription activated for org ${payment.organization_id} with tier ${payment.plan}. Invoice ${invoiceNumber} issued.`);

    return { success: true, payment, subscription, invoice };
  }

  /**
   * Admin rejects a payment:
   * Sets status REJECTED with optional reason.
   * Subscription remains unchanged!
   */
  public static async rejectPayment(paymentId: string, adminUserId: string, reason?: string): Promise<{
    success: boolean;
    payment?: PaymentRecord;
    error?: string;
  }> {
    let payment: PaymentRecord | null = null;
    const client = getSupabaseServerClient();

    if (client) {
      try {
        const { data } = await client
          .from('payments')
          .select('*')
          .eq('id', paymentId)
          .maybeSingle();
        if (data) payment = data as PaymentRecord;
      } catch (err) {}
    }

    if (!payment) {
      payment = localDb.getPayments().find(p => p.id === paymentId) || null;
    }

    if (!payment) {
      return { success: false, error: `Payment record ${paymentId} not found.` };
    }

    payment.payment_status = 'REJECTED';
    payment.rejection_reason = reason || 'Payment could not be verified with bank records. Please check the UTR and re-submit.';
    payment.verified_by = adminUserId;

    if (client) {
      try {
        await client.from('payments').upsert(payment);
      } catch (err) {}
    }

    localDb.updatePayment(payment.id, payment);

    // Revert subscription status if it was pending verification
    const existingSub = localDb.getSubscriptionByOrgId(payment.organization_id);
    if (existingSub && existingSub.status === 'PENDING_VERIFICATION') {
      existingSub.status = 'CANCELLED';
      localDb.saveSubscription(existingSub);
    }

    console.log(`[UPI BILLING] [REJECTED] Payment ${paymentId} rejected by admin ${adminUserId}. Reason: ${reason}`);

    return { success: true, payment };
  }

  /**
   * Retrieves active or authoritative subscription for an organization.
   */
  public static async getSubscription(organizationId: string): Promise<{
    subscription: SubscriptionRecord | null;
    pendingPayment: PaymentRecord | null;
    latestPayment: PaymentRecord | null;
  }> {
    let sub: SubscriptionRecord | null = null;
    const client = getSupabaseServerClient();

    if (client) {
      try {
        const { data } = await client
          .from('subscriptions')
          .select('*')
          .eq('organization_id', organizationId)
          .maybeSingle();
        if (data) sub = data as SubscriptionRecord;
      } catch (err) {}
    }

    if (!sub) {
      sub = localDb.getSubscriptionByOrgId(organizationId);
    }

    const orgPayments = await this.getPaymentsForOrg(organizationId);
    const pendingPayment = orgPayments.find(p => p.payment_status === 'PENDING_VERIFICATION') || null;
    const latestPayment = orgPayments[0] || null;

    // Check expiry
    if (sub && sub.status === 'ACTIVE' && sub.current_period_end) {
      const now = new Date().getTime();
      const end = new Date(sub.current_period_end).getTime();
      if (now > end) {
        sub.status = 'EXPIRED';
        if (client) {
          try {
            await client.from('subscriptions').update({ status: 'EXPIRED' }).eq('id', sub.id);
          } catch (_) {}
        }
        localDb.saveSubscription(sub);
      }
    }

    return { subscription: sub, pendingPayment, latestPayment };
  }

  /**
   * Retrieves verified invoices for an organization.
   */
  public static async getInvoices(organizationId: string): Promise<InvoiceRecord[]> {
    const client = getSupabaseServerClient();
    if (client) {
      try {
        const { data, error } = await client
          .from('invoices')
          .select('*')
          .eq('organization_id', organizationId)
          .order('issued_at', { ascending: false });

        if (!error && data && data.length > 0) {
          return data as InvoiceRecord[];
        }
      } catch (err) {}
    }

    return localDb.getInvoices()
      .filter(i => i.organization_id === organizationId)
      .sort((a, b) => new Date(b.issued_at).getTime() - new Date(a.issued_at).getTime());
  }

  // Helper persistence methods
  private static async persistPaymentRecord(payment: PaymentRecord): Promise<void> {
    const client = getSupabaseServerClient();
    if (client) {
      try {
        await client.from('payments').upsert(payment);
      } catch (err) {
        console.warn('[UPI BILLING] Supabase persist payment notice:', err);
      }
    }
    localDb.addPayment(payment);
  }

  private static async setSubscriptionPending(
    orgId: string, 
    userId: string, 
    plan: CanonicalPlanId, 
    cycle: 'monthly' | 'annual'
  ): Promise<void> {
    const existing = localDb.getSubscriptionByOrgId(orgId);
    const sub: SubscriptionRecord = {
      id: existing?.id || `sub_${orgId}_${Date.now()}`,
      organization_id: orgId,
      user_id: userId,
      plan,
      billing_cycle: cycle,
      status: 'PENDING_VERIFICATION',
      current_period_start: existing?.current_period_start || new Date().toISOString(),
      current_period_end: existing?.current_period_end || new Date().toISOString(),
      created_at: existing?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const client = getSupabaseServerClient();
    if (client) {
      try {
        await client.from('subscriptions').upsert(sub);
      } catch (err) {}
    }

    localDb.saveSubscription(sub);
  }
}
