import type { Outfit } from '../data/outfits';

/**
 * 의상 미리보기.
 *
 * 캐릭터 그림이 아니라 "무슨 색 옷에 머리에 뭘 쓰는가" 만 도형으로 보여 준다.
 * 준비물 목록만으로는 잘 안 그려지는 색 조합과 실루엣을 한눈에 잡아 주는 것이 목적이다.
 */
export default function OutfitPreview({ outfit, className }: { outfit: Outfit; className?: string }) {
  const { head, top, bottom, headgear, silhouette, accent } = outfit;

  return (
    <svg
      viewBox="0 0 64 92"
      className={className}
      role="img"
      aria-label="의상 색과 실루엣 미리보기"
    >
      {/* 망토·목도리 같은 포인트는 몸 뒤에 깔아 실루엣을 넓혀 준다 */}
      {accent && (
        <path d="M14 36 Q32 30 50 36 L54 76 Q32 70 10 76 Z" fill={accent} opacity={0.85} />
      )}

      {silhouette === 'dress' ? (
        <path d="M22 36 H42 L50 80 Q32 85 14 80 Z" fill={bottom} />
      ) : (
        <>
          <rect x={22} y={56} width={8.5} height={26} rx={3.5} fill={bottom} />
          <rect x={33.5} y={56} width={8.5} height={26} rx={3.5} fill={bottom} />
        </>
      )}

      {/* 상의 */}
      <rect x={19} y={35} width={26} height={24} rx={7} fill={top} />

      {/* 머리 */}
      <circle cx={32} cy={20} r={13} fill={head} />

      {headgear === 'ears' && (
        <>
          <ellipse cx={21} cy={8} rx={4.5} ry={7} fill={head} transform="rotate(-18 21 8)" />
          <ellipse cx={43} cy={8} rx={4.5} ry={7} fill={head} transform="rotate(18 43 8)" />
        </>
      )}
      {headgear === 'hat' && (
        <>
          <rect x={14} y={11} width={36} height={4} rx={2} fill={head} />
          <path d="M21 12 Q32 0 43 12 Z" fill={head} />
        </>
      )}
      {headgear === 'hood' && (
        <path d="M17 22 Q17 4 32 4 Q47 4 47 22 Q32 15 17 22 Z" fill={head} opacity={0.92} />
      )}
      {headgear === 'crown' && (
        <path d="M23 9 L27 13 L32 6 L37 13 L41 9 L41 14 H23 Z" fill="#E8C154" />
      )}
      {headgear === 'mask' && (
        <rect x={19} y={16} width={26} height={7} rx={3} fill="#12141F" opacity={0.75} />
      )}
    </svg>
  );
}
