import { useMemo } from 'react';

const COLORS = ['#FF5FA2', '#FFD84D', '#5FE3FF', '#9DF07A', '#FFFFFF'];

/** 결과 공개 순간에 한 번 흩날리는 종이조각. 순수 CSS 라 렌더 비용이 거의 없다. */
export default function Confetti({ seed }: { seed: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: 40 }, (_, i) => ({
        key: `${seed}-${i}`,
        left: `${Math.random() * 100}%`,
        delay: `${Math.random() * 900}ms`,
        duration: `${2200 + Math.random() * 1600}ms`,
        color: COLORS[i % COLORS.length],
        drift: `${(Math.random() - 0.5) * 160}px`,
        spin: `${360 + Math.random() * 720}deg`,
      })),
    [seed],
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden>
      {pieces.map((p) => (
        <span
          key={p.key}
          className="confetti-piece"
          style={
            {
              left: p.left,
              backgroundColor: p.color,
              animationDelay: p.delay,
              animationDuration: p.duration,
              '--drift': p.drift,
              '--spin': p.spin,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
