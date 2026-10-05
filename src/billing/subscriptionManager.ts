import { LocalDB } from '../database/localDb';
import { isVerifiedFounderEmail } from '../security/founderAllowlist';
import { SubscriptionRecord } from '../payments/upiPaymentService';
import { SalesPilotNotification } from '../types';

const localDb = LocalDB.getInstance();

export interface SubscriptionAccessResult {
  isAllowed: boolean;
  status: 'ACTIVE' | 'EXPIRED' | 'PENDING_VERIFICATION' | 'CANCELLED';
  code?: string;
  error?: string;
  plan?: string;
  expiresAt?: string;
  action?: string;
  daysRemaining?: number;
}

export class SubscriptionManager {
  /**
   * Evaluates server-side subscription access for a given organization and user.
   * NEVER trusts client headers, localStorage, or frontend state.
   */
  public static checkSubscriptionAccess(
    organizationId: string,
    userId?: string,
    email?: string
  ): SubscriptionAccessResult {
    // 1. Founder & Lifetime Privilege Check
    if (isVerifiedFounderEmail(email)) {
      return {
        isAllowed: true,
        status: 'ACTIVE',
        plan: 'ENTERPRISE'
      };
    }

    if (userId) {
      const user = localDb.getUserById(userId);
      if (user && (user.isFounder || isVerifiedFounderEmail(user.email) || user.subscriptionStatus === 'LIFETIME')) {
        return {
          isAllowed: true,
          status: 'ACTIVE',
          plan: 'ENTERPRISE'
        };
      }
    }

    // 2. Authoritative Organization Subscription lookup
    const sub = localDb.getSubscriptionByOrgId(organizationId);
    const now = Date.now();

    if (sub) {
      // 1. Explicit pending verification check (Payment submitted, awaiting admin approval)
      if (sub.status === 'PENDING_VERIFICATION') {
        return {
          isAllowed: false,
          status: 'PENDING_VERIFICATION',
          code: 'PAYMENT_PENDING_VERIFICATION',
          error: 'Your payment is pending verification. Access will be unlocked once verified by an administrator.',
          plan: sub.plan,
          action: 'VIEW_BILLING'
        };
      }

      // 2. Explicit expired or cancelled status
      if (sub.status === 'EXPIRED' || sub.status === 'CANCELLED') {
        return {
          isAllowed: false,
          status: 'EXPIRED',
          code: 'SUBSCRIPTION_EXPIRED',
          error: 'Your SalesPilot subscription has expired. Renew your subscription to continue using SalesPilot.',
          plan: sub.plan,
          expiresAt: sub.current_period_end,
          action: 'RENEW_SUBSCRIPTION',
          daysRemaining: 0
        };
      }

      // 3. Active subscription expiry date/time enforcement
      if (sub.status === 'ACTIVE' && sub.current_period_end) {
        const periodEndTime = new Date(sub.current_period_end).getTime();
        if (now >= periodEndTime) {
          sub.status = 'EXPIRED';
          localDb.saveSubscription(sub);
          if (userId) {
            const u = localDb.getUserById(userId);
            if (u) {
              u.subscriptionStatus = 'EXPIRED';
              localDb.saveUser(u);
            }
          }

          return {
            isAllowed: false,
            status: 'EXPIRED',
            code: 'SUBSCRIPTION_EXPIRED',
            error: 'Your SalesPilot subscription has expired. Renew your subscription to continue using SalesPilot.',
            plan: sub.plan,
            expiresAt: sub.current_period_end,
            action: 'RENEW_SUBSCRIPTION',
            daysRemaining: 0
          };
        }
      }

      if (sub.status === 'ACTIVE') {
        let daysRemaining: number | undefined = undefined;
        if (sub.current_period_end) {
          const diffMs = new Date(sub.current_period_end).getTime() - now;
          daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
        }
        return {
          isAllowed: true,
          status: 'ACTIVE',
          plan: sub.plan,
          expiresAt: sub.current_period_end,
          daysRemaining
        };
      }
    }

    // 3. Fallback checks on user/organization record
    if (userId) {
      const dbUser = localDb.getUserById(userId);
      if (dbUser) {
        if (dbUser.subscriptionStatus === 'EXPIRED') {
          return {
            isAllowed: false,
            status: 'EXPIRED',
            code: 'SUBSCRIPTION_EXPIRED',
            error: 'Your SalesPilot subscription has expired. Renew your subscription to continue using SalesPilot.',
            action: 'RENEW_SUBSCRIPTION',
            daysRemaining: 0
          };
        }

        if (dbUser.subscriptionStatus === 'PENDING_VERIFICATION') {
          return {
            isAllowed: false,
            status: 'PENDING_VERIFICATION',
            code: 'PAYMENT_PENDING_VERIFICATION',
            error: 'Your payment is pending verification. Access will be unlocked once verified by an administrator.',
            action: 'VIEW_BILLING'
          };
        }

        if (dbUser.subscriptionStatus === 'ACTIVE' || dbUser.subscriptionStatus === 'LIFETIME') {
          return {
            isAllowed: true,
            status: 'ACTIVE',
            plan: dbUser.tier || 'STARTER'
          };
        }

        if (dbUser.tier === 'FREE_TRIAL') {
          const org = localDb.getOrganizationById(organizationId);
          if (org?.status === 'EXPIRED' || (org as any)?.tier === 'EXPIRED') {
            return {
              isAllowed: false,
              status: 'EXPIRED',
              code: 'SUBSCRIPTION_EXPIRED',
              error: 'Your SalesPilot subscription has expired. Renew your subscription to continue using SalesPilot.',
              action: 'RENEW_SUBSCRIPTION'
            };
          }
          return {
            isAllowed: true,
            status: 'ACTIVE',
            plan: 'FREE_TRIAL'
          };
        }
      }
    }

    return {
      isAllowed: true,
      status: 'ACTIVE',
      plan: 'STARTER'
    };
  }

  /**
   * Checks for upcoming subscription expiry and dispatches idempotent renewal reminders.
   * Thresholds:
   * - 7 days before expiry
   * - 3 days before expiry
   * - 1 day before expiry
   * - On expiry day
   *
   * Message: "Your SalesPilot subscription expires soon. Please renew to continue using SalesPilot."
   */
  public static checkAndDispatchRenewalReminders(
    organizationId: string,
    targetUserId?: string
  ): SalesPilotNotification[] {
    const sub = localDb.getSubscriptionByOrgId(organizationId);
    if (!sub || !sub.current_period_end) return [];

    const now = Date.now();
    const periodEndTime = new Date(sub.current_period_end).getTime();
    const diffMs = periodEndTime - now;
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    const recipientUserId = targetUserId || sub.user_id || 'system';
    const notificationsGenerated: SalesPilotNotification[] = [];

    // If subscription already expired
    if (diffMs <= 0) {
      if (sub.status !== 'EXPIRED') {
        sub.status = 'EXPIRED';
        localDb.saveSubscription(sub);
      }

      const notif = localDb.addSalesPilotNotification({
        organizationId,
        userId: recipientUserId,
        type: 'SUBSCRIPTION_EXPIRED',
        title: 'Subscription Expired',
        message: 'Your SalesPilot subscription has expired. Renew your subscription to continue using SalesPilot.',
        entityType: 'SUBSCRIPTION',
        entityId: sub.id,
        priority: 'URGENT',
        idempotencyKey: `sub_expired_${sub.id}`,
        metadata: {
          subscriptionId: sub.id,
          expiredAt: sub.current_period_end,
          plan: sub.plan
        }
      });
      notificationsGenerated.push(notif);
      return notificationsGenerated;
    }

    // Reminders before expiry
    const reminderMessage = 'Your SalesPilot subscription expires soon. Please renew to continue using SalesPilot.';

    // 1. 7 days before expiry
    if (diffDays <= 7 && diffDays > 0) {
      const notif7d = localDb.addSalesPilotNotification({
        organizationId,
        userId: recipientUserId,
        type: 'SUBSCRIPTION_RENEWAL_REMINDER',
        title: 'Subscription Renewal Reminder',
        message: reminderMessage,
        entityType: 'SUBSCRIPTION',
        entityId: sub.id,
        priority: 'MEDIUM',
        idempotencyKey: `sub_reminder_${sub.id}_7d`,
        metadata: {
          daysRemaining: 7,
          expiresAt: sub.current_period_end,
          plan: sub.plan
        }
      });
      notificationsGenerated.push(notif7d);
    }

    // 2. 3 days before expiry
    if (diffDays <= 3 && diffDays > 0) {
      const notif3d = localDb.addSalesPilotNotification({
        organizationId,
        userId: recipientUserId,
        type: 'SUBSCRIPTION_RENEWAL_REMINDER',
        title: 'Subscription Renewal Reminder',
        message: reminderMessage,
        entityType: 'SUBSCRIPTION',
        entityId: sub.id,
        priority: 'HIGH',
        idempotencyKey: `sub_reminder_${sub.id}_3d`,
        metadata: {
          daysRemaining: 3,
          expiresAt: sub.current_period_end,
          plan: sub.plan
        }
      });
      notificationsGenerated.push(notif3d);
    }

    // 3. 1 day before expiry
    if (diffDays <= 1 && diffDays > 0) {
      const notif1d = localDb.addSalesPilotNotification({
        organizationId,
        userId: recipientUserId,
        type: 'SUBSCRIPTION_RENEWAL_REMINDER',
        title: 'Subscription Renewal Reminder',
        message: reminderMessage,
        entityType: 'SUBSCRIPTION',
        entityId: sub.id,
        priority: 'URGENT',
        idempotencyKey: `sub_reminder_${sub.id}_1d`,
        metadata: {
          daysRemaining: 1,
          expiresAt: sub.current_period_end,
          plan: sub.plan
        }
      });
      notificationsGenerated.push(notif1d);
    }

    // 4. On expiry day (less than 24h or same calendar date)
    const isExpiryDay = diffDays <= 0.5 || new Date(now).toDateString() === new Date(periodEndTime).toDateString();
    if (isExpiryDay && diffDays > 0) {
      const notif0d = localDb.addSalesPilotNotification({
        organizationId,
        userId: recipientUserId,
        type: 'SUBSCRIPTION_RENEWAL_REMINDER',
        title: 'Subscription Renewal Reminder - Expiry Day',
        message: reminderMessage,
        entityType: 'SUBSCRIPTION',
        entityId: sub.id,
        priority: 'URGENT',
        idempotencyKey: `sub_reminder_${sub.id}_0d`,
        metadata: {
          daysRemaining: 0,
          isExpiryDay: true,
          expiresAt: sub.current_period_end,
          plan: sub.plan
        }
      });
      notificationsGenerated.push(notif0d);
    }

    return notificationsGenerated;
  }

  /**
   * Sweeps all subscriptions in database and triggers expiry/reminders as due.
   */
  public static sweepAllSubscriptions(): void {
    const subscriptions = localDb.getSubscriptions();
    for (const sub of subscriptions) {
      if (sub && sub.organization_id) {
        this.checkAndDispatchRenewalReminders(sub.organization_id, sub.user_id);
      }
    }
  }
}
