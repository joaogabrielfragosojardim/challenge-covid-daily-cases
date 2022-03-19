import { useRef } from "react";

export const useDebounce = (fn: any, delay: any) => {
  const timeoutRef = useRef<any>(null);

  function debouncedFn(...rest: any) {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      fn(...rest);
    }, delay);
  }

  return debouncedFn;
};
