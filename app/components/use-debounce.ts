import { useCallback, useRef } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useDebounce<T extends (...args: any[]) => void>({
  callback,
  delay = 500,
}: {
  callback: T;
  delay?: number;
}): (...args: Parameters<T>) => void {
  const ref = useRef<ReturnType<typeof setTimeout>>(null);

  const wrapper = useCallback(
    (...args: Parameters<T>) => {
      if (ref.current) clearTimeout(ref.current);

      ref.current = setTimeout(() => {
        callback(args);
      }, delay);
    },
    [callback, delay],
  );

  return wrapper;
}
