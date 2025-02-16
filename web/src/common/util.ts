import React from "react";
import { useLocation } from "react-router-dom";

export function debounce<T>(func: T, wait): T {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      (func as any)(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  } as any;
}


export function useQuery() {
  const { search } = useLocation();

  return React.useMemo(() => new URLSearchParams(search), [search]);
}