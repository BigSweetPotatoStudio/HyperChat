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
