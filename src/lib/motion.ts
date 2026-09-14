import { useEffect, useState } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

/**
 * 사용자의 "동작 줄이기" 설정을 구독한다.
 *
 * CSS 로 못 줄이는 부분(룰렛을 몇 바퀴 돌릴지, 컨페티를 뿌릴지)을 정하는 데 쓴다.
 * 설정을 켜도 룰렛은 계속 돌아간다. 바퀴 수만 줄어든다.
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia(QUERY).matches
      : false,
  );

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia(QUERY);
    const sync = () => setReduced(mq.matches);
    sync(); // 첫 렌더 이후에 설정이 바뀌었을 수도 있다.
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  return reduced;
}
