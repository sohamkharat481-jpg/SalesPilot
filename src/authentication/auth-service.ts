import { WorkspaceUser } from '../types';

/**
 * Authentication service helper.
 */
export class AuthService {
  /**
   * Validates if the user is authorized to perform premium operations.
   */
  public static isPremiumUser(user: WorkspaceUser | null): boolean {
    if (!user) return false;
    return user.tier === 'PROFESSIONAL' || user.tier === 'AGENCY';
  }

  /**
   * Evaluates role rights for workspace campaign management.
   */
  public static canManageCampaigns(user: WorkspaceUser | null): boolean {
    if (!user) return false;
    const role = (user.role || '').toUpperCase();
    if (role === 'VIEWER') return false;
    return ['OWNER', 'ADMIN', 'MANAGER', 'SALES', 'SALES_REP', 'MARKETING', 'MEMBER', 'CLIENT', 'SUPER_ADMIN'].includes(role) || Boolean(user.isFounder);
  }
}
