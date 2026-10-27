import { useCallback, useEffect, useRef, useState } from 'react';
import { errorText } from './client';

export interface AdminData<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  reload: () => void;
}

/**
 * Loads data from the server and reloads it when `deps` change or `reload()` is called.
 * With `refreshMs` the data is refreshed on that interval while the page is open, so numbers stay current.
 */
export function useAdminData<T>(load: () => Promise<T>, deps: unknown[], refreshMs?: number): AdminData<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const loadRef = useRef(load);
  loadRef.current = load;

  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadRef
      .current()
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setError(null);
      })
      .catch((err) => {
        if (!cancelled) setError(errorText(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  useEffect(() => {
    if (!refreshMs) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') setTick((t) => t + 1);
    }, refreshMs);
    return () => window.clearInterval(timer);
  }, [refreshMs]);

  return { data, error, loading, reload };
}

/** Runs one write and reports its outcome; success is reported only after the server accepted the change. */
export async function runAction(
  action: () => Promise<unknown>,
  successText: string,
  report: (result: { tone: 'success' | 'error'; text: string }) => void,
): Promise<boolean> {
  try {
    await action();
    report({ tone: 'success', text: successText });
    return true;
  } catch (error) {
    report({ tone: 'error', text: errorText(error) });
    return false;
  }
}
