import { useCallback, useEffect, useState } from 'react';

/**
 * localStorage 에 붙은 useState.
 * 시크릿 모드나 저장소가 막힌 브라우저에서도 앱은 그대로 동작해야 하므로
 * 읽기·쓰기를 모두 try/catch 로 감싸고 실패하면 메모리 상태만 쓴다.
 */
export function usePersistedState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? initial : (JSON.parse(raw) as T);
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // 저장 못 해도 진행에는 지장이 없다.
    }
  }, [key, value]);

  return [value, setValue] as const;
}

/** crypto.randomUUID 가 없는 환경(구형 사파리, http 접속)까지 커버하는 id 생성기. */
export function useIdFactory() {
  return useCallback(() => {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }
    return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
  }, []);
}
