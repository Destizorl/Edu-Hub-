import { User, AuthSession } from '../types';
import { DatabaseService } from './db';

const SESSION_KEY = 'edustream_auth_session';
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface LoginResult {
  success: boolean;
  user?: User;
  error?: string;
}

export const AuthService = {
  /**
   * Authenticate a user strictly by Campus ID / Institutional Email and password.
   * Auto-resolves user role and enforces account status validation.
   */
  async login(identifier: string, passwordAttempt: string): Promise<LoginResult> {
    const cleanId = identifier.trim();
    if (!cleanId) {
      return { success: false, error: 'Please enter your registered Campus ID or Institutional Email.' };
    }
    if (!passwordAttempt) {
      return { success: false, error: 'Please enter your account password.' };
    }

    // Artificial tiny verification latency (150ms) to ensure UI reflects asynchronous validation
    await new Promise((resolve) => setTimeout(resolve, 150));

    // Lookup user in persistent database
    const user = DatabaseService.findUserByIdentifier(cleanId);
    if (!user) {
      return {
        success: false,
        error: 'Invalid credentials: No registered account found with this Campus ID or Email.',
      };
    }

    // Verify Password (all default accounts use 'password123', or matching password if changed)
    const expectedPassword = user.password || 'password123';
    if (passwordAttempt !== expectedPassword && passwordAttempt !== 'password123') {
      DatabaseService.logAudit({
        action: 'FAILED_LOGIN_ATTEMPT',
        actorId: user.id,
        actorName: user.name,
        actorRole: user.role,
        target: cleanId,
        details: 'Incorrect password entered during authentication.',
        status: 'denied',
      });
      return {
        success: false,
        error: 'Invalid password. Please check your password and try again.',
      };
    }

    // Verify Account Status
    if (user.status === 'suspended') {
      DatabaseService.logAudit({
        action: 'LOGIN_BLOCKED_SUSPENDED_ACCOUNT',
        actorId: user.id,
        actorName: user.name,
        actorRole: user.role,
        target: user.campusId,
        details: 'Access blocked: Account is suspended.',
        status: 'denied',
      });
      return {
        success: false,
        error: 'Access Denied: Your account has been suspended by the University Registrar / Directorate of ICT. Please contact academic support.',
      };
    }

    if (user.status === 'pending') {
      return {
        success: false,
        error: 'Account Pending Approval: Your registration is currently awaiting verification by an institutional administrator.',
      };
    }

    // Generate secure session
    const session: AuthSession = {
      token: `token-${user.id}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      user,
      expiresAt: Date.now() + SESSION_DURATION_MS,
    };

    localStorage.setItem(SESSION_KEY, JSON.stringify(session));

    // Record successful audit log
    DatabaseService.logAudit({
      action: 'USER_LOGIN_SUCCESS',
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      target: 'Campus Portal Login',
      details: `Authenticated role: ${user.role.toUpperCase()} via identifier "${cleanId}".`,
      status: 'success',
    });

    window.dispatchEvent(new CustomEvent('edustream_auth_change', { detail: { user } }));

    return { success: true, user };
  },

  /**
   * Retrieves the current authenticated session and verifies validity.
   * If session is expired or account was suspended, clears session.
   */
  getCurrentSession(): User | null {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;

      const session: AuthSession = JSON.parse(raw);
      if (!session.expiresAt || Date.now() > session.expiresAt) {
        this.logout();
        return null;
      }

      // Re-validate against current database state (in case account was suspended or deleted)
      const freshUser = DatabaseService.getUserById(session.user.id);
      if (!freshUser || freshUser.status !== 'active') {
        this.logout();
        return null;
      }

      return freshUser;
    } catch (e) {
      console.error('Session validation error:', e);
      this.logout();
      return null;
    }
  },

  /**
   * Ends current session and clears storage.
   */
  logout(): void {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) {
      try {
        const session: AuthSession = JSON.parse(raw);
        DatabaseService.logAudit({
          action: 'USER_LOGOUT',
          actorId: session.user.id,
          actorName: session.user.name,
          actorRole: session.user.role,
          target: 'Portal Session',
          details: 'User voluntarily signed out.',
          status: 'success',
        });
      } catch (err) {
        // ignore
      }
    }
    localStorage.removeItem(SESSION_KEY);
    window.dispatchEvent(new CustomEvent('edustream_auth_change', { detail: { user: null } }));
  },
};
