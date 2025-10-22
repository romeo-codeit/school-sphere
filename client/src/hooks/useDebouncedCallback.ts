import { useRef, useCallback } from 'react';

// Debounce that returns a stable callback and a cancel function
export function useDebouncedCallback(fn: (...args: any[]) => void, delay = 500) {
  const timer = useRef<number | null>(null);

  const debounced = useCallback((...args: any[]) => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      fn(...args);
      timer.current = null;
    }, delay);
  }, [fn, delay]);

  const cancel = useCallback(() => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = null;
  }, []);

  return { debounced, cancel };
}
