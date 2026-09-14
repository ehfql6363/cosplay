import { useState } from 'react';
import type { Theme } from '../types';
import { usePrefersReducedMotion } from '../lib/motion';

interface Props {
  themes: Theme[];
  /** 안전 필터가 켜져 있으면 실제로 뽑을 수 있는 캐릭터 수가 줄어든다. */
  parkSafeOnly: boolean;
  onConfirm: (theme: Theme) => void;
  onBack: () => void;
  error: string | null;
}

const CX = 160;
const CY = 160;
const R = 148;

/** 섹터를 번갈아 칠할 색. 어두운 바탕 위에서 서로 확실히 구분되는 조합. */
const FILLS = [
  'rgb(255 95 162 / 0.85)',
  'rgb(95 227 255 / 0.85)',
  'rgb(255 216 77 / 0.85)',
  'rgb(157 240 122 / 0.85)',
];

function polar(deg: number, r: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
}

function sectorPath(start: number, end: number) {
  const s = polar(start, R);
  const e = polar(end, R);
  const largeArc = end - start > 180 ? 1 : 0;
  return `M ${CX} ${CY} L ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${R} ${R} 0 ${largeArc} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)} Z`;
}

export default function ThemeWheel({ themes, parkSafeOnly, onConfirm, onBack, error }: Props) {
  const [rotation, setRotation] = useState(0);
  const [pending, setPending] = useState<number | null>(null);
  const [landed, setLanded] = useState<number | null>(null);
  const reducedMotion = usePrefersReducedMotion();

  const step = 360 / themes.length;
  const spinning = pending !== null;

  const spin = () => {
    if (spinning) return;
    const target = Math.floor(Math.random() * themes.length);

    // 바늘은 12시에 고정이므로, 당첨 섹터의 중심각만큼 되돌려 놓으면 그 섹터가 위로 온다.
    // 회전값은 계속 누적해 항상 시계 방향으로만 돌게 한다.
    const center = target * step + step / 2;
    const wanted = (360 - (center % 360)) % 360;
    const current = ((rotation % 360) + 360) % 360;
    let delta = wanted - current;
    if (delta <= 0) delta += 360;

    // 온전한 바퀴 수를 반드시 더한다. delta 만 움직이면 바로 옆 칸이 걸렸을 때
    // 45도만 까딱하고 끝나 룰렛처럼 보이지 않는다.
    // 동작 줄이기를 켰으면 바퀴 수를 줄이되 0 으로 두지는 않는다.
    const turns = reducedMotion ? 2 : 5;

    setLanded(null);
    setPending(target);
    setRotation(rotation + 360 * turns + delta);
  };

  const picked = landed === null ? null : themes[landed];

  return (
    <div className="space-y-6">
      <header className="text-center">
        <h2 className="text-2xl font-black">오늘의 주제는?</h2>
        <p className="mt-1 text-sm text-white/55">버튼을 눌러 돌려 주세요. 아이가 눌러도 좋아요.</p>
      </header>

      <div className="relative mx-auto w-full max-w-[340px]">
        {/* 12시 방향 바늘 */}
        <div
          className={`absolute top-[-6px] left-1/2 z-10 ${spinning ? 'pointer-ticking' : ''}`}
          style={{ transform: 'translateX(-50%)' }}
          aria-hidden
        >
          <div className="size-0 border-x-[13px] border-t-[26px] border-x-transparent border-t-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]" />
        </div>

        <svg
          viewBox="0 0 320 320"
          className="w-full drop-shadow-[0_10px_40px_rgba(255,95,162,0.2)]"
          role="img"
          aria-label={`주제 룰렛: ${themes.map((t) => t.name).join(', ')}`}
        >
          <circle cx={CX} cy={CY} r={R + 7} fill="#141a3a" stroke="rgb(255 255 255 / 0.14)" />
          <g
            className="wheel-spin"
            style={{ transform: `rotate(${rotation}deg)`, transformOrigin: '160px 160px' }}
            onTransitionEnd={() => {
              // 회전이 실제로 멈춘 뒤에 결과를 공개한다.
              if (pending === null) return;
              setLanded(pending);
              setPending(null);
            }}
          >
            {themes.map((theme, i) => {
              const start = i * step;
              const center = start + step / 2;
              // 라벨은 호에 나란히 눕힌다. 당첨 섹터는 언제나 12시로 오고 그때 회전이
              // 정확히 상쇄되므로, 이렇게 두면 뽑힌 이름만은 항상 똑바로 선다.
              // 쉬는 동안 아래쪽 라벨이 거꾸로 보이는 것은 실제 룰렛과 같은 모습이다.
              const labelR = R * 0.74;
              return (
                <g key={theme.id}>
                  <path
                    d={sectorPath(start, start + step)}
                    fill={FILLS[i % FILLS.length]}
                    stroke="#0b1026"
                    strokeWidth={2}
                  />
                  <g transform={`rotate(${center} ${CX} ${CY})`}>
                    <text x={CX} y={CY - labelR - 13} textAnchor="middle" fontSize="16" aria-hidden>
                      {theme.emoji}
                    </text>
                    <text
                      x={CX}
                      y={CY - labelR + 7}
                      textAnchor="middle"
                      fontSize="12"
                      fontWeight="800"
                      fill="#070b1c"
                    >
                      {theme.name}
                    </text>
                  </g>
                </g>
              );
            })}
          </g>
          <circle cx={CX} cy={CY} r={26} fill="#0b1026" stroke="rgb(255 255 255 / 0.2)" />
          <text x={CX} y={CY + 6} textAnchor="middle" fontSize="18" aria-hidden>
            🎭
          </text>
        </svg>
      </div>

      <div className="min-h-[104px]">
        {picked ? (
          <div className="rounded-3xl border border-neon-yellow/35 bg-neon-yellow/10 p-5 text-center">
            <p className="text-sm text-white/60">주제 결정!</p>
            <p className="mt-1 text-3xl font-black">
              {picked.emoji} {picked.name}
            </p>
            <p className="mt-1 text-sm text-white/55">
              고를 수 있는 캐릭터{' '}
              {parkSafeOnly
                ? picked.characters.filter((ch) => ch.parkRisk === null).length
                : picked.characters.length}
              명
            </p>
          </div>
        ) : (
          <p className="pt-8 text-center text-white/35">{spinning ? '두구두구…' : ''}</p>
        )}
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-2xl border border-neon-pink/40 bg-neon-pink/10 px-4 py-3 text-sm text-neon-pink"
        >
          {error}
        </p>
      )}

      <div className="space-y-3">
        <button
          type="button"
          onClick={spin}
          disabled={spinning}
          className="w-full rounded-3xl bg-linear-to-r from-neon-pink to-neon-yellow py-4 text-lg font-black text-night-950 shadow-xl shadow-neon-pink/25 transition active:scale-[0.99] disabled:opacity-50"
        >
          {spinning ? '돌아가는 중…' : picked ? '다시 돌리기' : '룰렛 돌리기'}
        </button>

        {picked && !spinning && (
          <button
            type="button"
            onClick={() => onConfirm(picked)}
            className="w-full rounded-3xl border border-white/15 bg-night-800 py-4 text-lg font-black transition active:scale-[0.99]"
          >
            이 주제로 캐스팅하기 →
          </button>
        )}

        <button
          type="button"
          onClick={onBack}
          className="w-full rounded-2xl py-2 text-sm text-white/45 transition hover:text-white"
        >
          ← 명단 고치기
        </button>
      </div>
    </div>
  );
}
