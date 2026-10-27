import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { adminApi, ApiError, StaffSession, UNAUTHORIZED_EVENT } from '../api/client';

export type StaffAuthStatus = 'loading' | 'signed_out' | 'mfa_setup' | 'mfa_verify' | 'ready';

interface StaffAuthValue {
  status: StaffAuthStatus;
  session: StaffSession | null;
  /** UX only: the server checks every permission again on each request. */
  can: (permission: string) => boolean;
  refresh: () => Promise<void>;
  afterPassword: (next: 'mfa_setup' | 'mfa_verify') => void;
  afterMfa: (session: StaffSession) => void;
  signOut: () => Promise<void>;
}

const StaffAuthContext = createContext<StaffAuthValue | null>(null);

export const StaffAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<StaffAuthStatus>('loading');
  const [session, setSession] = useState<StaffSession | null>(null);

  const refresh = useCallback(async () => {
    try {
      const current = await adminApi.session();
      setSession(current);
      setStatus(current.mfa_verified ? 'ready' : current.mfa_enrolled ? 'mfa_verify' : 'mfa_setup');
    } catch (error) {
      setSession(null);
      setStatus(error instanceof ApiError && error.status === 401 ? 'signed_out' : 'signed_out');
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Any 401 from the server (expired or revoked session) returns to the sign-in screen.
  useEffect(() => {
    const onUnauthorized = () => {
      setSession(null);
      setStatus((s) => (s === 'ready' ? 'signed_out' : s));
    };
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, []);

  const value: StaffAuthValue = {
    status,
    session,
    can: (permission) => Boolean(session?.permissions.includes(permission)),
    refresh,
    afterPassword: (next) => setStatus(next),
    afterMfa: (next) => {
      setSession(next);
      setStatus('ready');
    },
    signOut: async () => {
      try {
        await adminApi.logout();
      } finally {
        setSession(null);
        setStatus('signed_out');
      }
    },
  };

  return <StaffAuthContext.Provider value={value}>{children}</StaffAuthContext.Provider>;
};

export function useStaff(): StaffAuthValue {
  const value = useContext(StaffAuthContext);
  if (!value) throw new Error('useStaff must be used inside StaffAuthProvider');
  return value;
}

export const ROLE_TITLES: Record<string, string> = {
  OWNER: 'Владелец платформы',
  PLATFORM_ADMIN: 'Администратор платформы',
  CONTENT_MANAGER: 'Контент-менеджер',
  CONTENT_REVIEWER: 'Рецензент',
  SUPPORT_AGENT: 'Поддержка',
  FINANCE_MANAGER: 'Лицензии и финансы',
  ANALYST: 'Аналитик',
};
