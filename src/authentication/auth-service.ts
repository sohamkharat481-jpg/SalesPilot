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
   * Evaluates role rights for workspaces.
   */
  public static canManageCampaigns(user: WorkspaceUser | null): boolean {
    if (!user) return false;
    // All tiers can manage campaigns, starter has quota bounds
    return true;
  }
}
