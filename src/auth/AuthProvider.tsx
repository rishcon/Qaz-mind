import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ApiError } from '../api/client';
import { ApiProfile, ApiUser, MeResponse, authApi, profileApi } from '../api/endpoints';

// The server is the only source of identity. Nothing about the user is read from localStorage.

export type AuthStatus = 'loading' | 'anonymous' | 'authenticated';

export interface AuthContextValue {
  status: AuthStatus;
  user: ApiUser | null;
  onboardingCompleted: boolean;
  profile: ApiProfile | null;
  /** Applies a session returned by the API (login, verification, reset). */
  applySession: (me: MeResponse) => Promise<void>;
  /** Reloads the personal profile, e.g. after onboarding or a settings change. */
  refreshProfile: () => Promise<void>;
  /** Forgets the local session state. The caller is responsible for calling the logout endpoint. */
  clearSession: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthState {
  status: AuthStatus;
  user: ApiUser | null;
  onboardingCompleted: boolean;
  profile: ApiProfile | null;
}

const ANONYMOUS: AuthState = { status: 'anonymous', user: null, onboardingCompleted: false, profile: null };

async function loadProfile(onboardingCompleted: boolean): Promise<ApiProfile | null> {
  if (!onboardingCompleted) return null;
  try {
    return await profileApi.getProfile();
  } catch {
    // The session is valid; the profile is loaded again on the next visit to the dashboard.
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({ ...ANONYMOUS, status: 'loading' });

  const applySession = useCallback(async (me: MeResponse) => {
    const profile = await loadProfile(me.onboarding_completed);
    setState({
      status: 'authenticated',
      user: me.user,
      onboardingCompleted: me.onboarding_completed,
      profile,
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await authApi.me();
        const profile = await loadProfile(me.onboarding_completed);
        if (!cancelled) {
          setState({ status: 'authenticated', user: me.user, onboardingCompleted: me.onboarding_completed, profile });
        }
      } catch (error) {
        // 401 is the normal "not logged in" answer. Other failures also fall back to the public site.
        if (!cancelled) {
          if (!(error instanceof ApiError) || error.status !== 401) {
            console.warn('Не удалось проверить сессию:', error);
          }
          setState(ANONYMOUS);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const refreshProfile = useCallback(async () => {
    const profile = await loadProfile(true);
    setState((prev) => ({ ...prev, onboardingCompleted: true, profile: profile ?? prev.profile }));
  }, []);

  const clearSession = useCallback(() => setState(ANONYMOUS), []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status: state.status,
      user: state.user,
      onboardingCompleted: state.onboardingCompleted,
      profile: state.profile,
      applySession,
      refreshProfile,
      clearSession,
    }),
    [state, applySession, refreshProfile, clearSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return value;
}
