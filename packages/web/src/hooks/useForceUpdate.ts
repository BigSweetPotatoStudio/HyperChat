/**
 * 强制刷新组件的自定义 Hook
 * 通过更新状态来触发组件重新渲染
 */
import { useState, useCallback } from 'react';

/**
 * 使用强制更新的 Hook
 * @returns {Function} refresh - 触发组件重新渲染的函数
 */
export function useForceUpdate(): () => void {
  const [, setNum] = useState<number>(0);
  
  /**
   * 刷新组件状态，触发重新渲染
   */
  const refresh = useCallback((): void => {
    setNum((x) => x + 1);
  }, []);
  
  return refresh;
}
