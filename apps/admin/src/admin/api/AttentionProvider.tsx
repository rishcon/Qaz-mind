import React, { createContext, useContext } from 'react';
import { adminApi, Overview } from './client';
import { useAdminData } from './useAdminData';

type AttentionItem = Overview['attention'][number];

interface AttentionValue {
  items: AttentionItem[];
  loaded: boolean;
  reload: () => void;
}

const AttentionContext = createContext<AttentionValue>({ items: [], loaded: false, reload: () => undefined });

/** Items that need a staff action (reviews, unanswered invitations), refreshed every minute from the server. */
export const AttentionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data, reload } = useAdminData(() => adminApi.overview(), [], 60000);
  return (
    <AttentionContext.Provider value={{ items: data?.attention ?? [], loaded: data !== null, reload }}>
      {children}
    </AttentionContext.Provider>
  );
};

export function useAttention(): AttentionValue {
  return useContext(AttentionContext);
}
