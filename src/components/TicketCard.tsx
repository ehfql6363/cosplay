import type { Character, Member } from '../types';
import { KIND_LABEL, PARK_RISK_LABEL } from '../types';

interface Props {
  member: Member;
  character: Character;
  locked: boolean;
  delayMs: number;
  onToggleLock: () => void;
  onReroll: () => void;
}

export default function TicketCard({
  member,
  character,
  locked,
  delayMs,
  onToggleLock,
  onReroll,
}: Props) {
  const isAdult = member.kind === 'adult';

  return (
    <article
      className="ticket-in relative overflow-hidden rounded-3xl border border-white/12 bg-linear-to-br from-night-800 to-night-900 shadow-xl shadow-black/40"
      style={{ animationDelay: `${delayMs}ms` }}
    >
      {locked && (
        <div
          className="absolute inset-0 rounded-3xl border-2 border-neon-yellow/70"
          aria-hidden
        />
      )}

      <div className="flex items-center justify-between gap-2 px-5 pt-4">
        <h3 className="min-w-0 truncate text-lg font-black">{member.name}</h3>
        <span
          className={`shrink-0 rounded-lg px-2 py-1 text-xs font-bold ${
            isAdult ? 'bg-neon-cyan/15 text-neon-cyan' : 'bg-neon-lime/15 text-neon-lime'
          }`}
        >
          {isAdult ? '🧑' : '🧒'} {KIND_LABEL[member.kind]}
        </span>
      </div>

      <p className="px-5 pt-2 pb-5 text-3xl leading-tight font-black text-neon-yellow">
        {character.name}
      </p>

      {/* 절취선 */}
      <div className="relative">
        <div className="absolute top-1/2 -left-2.5 size-5 -translate-y-1/2 rounded-full bg-night-950" />
        <div className="absolute top-1/2 -right-2.5 size-5 -translate-y-1/2 rounded-full bg-night-950" />
        <div className="mx-5 border-t border-dashed border-white/20" />
      </div>

      <div className="px-5 py-4">
        <p className="text-xs font-bold tracking-wide text-white/40">준비물</p>
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {character.items.map((item) => (
            <li
              key={item}
              className="rounded-lg bg-white/6 px-2.5 py-1 text-sm whitespace-nowrap text-white/80"
            >
              {item}
            </li>
          ))}
        </ul>

        {character.parkRisk && (
          <p className="mt-3 rounded-xl bg-neon-pink/10 px-3 py-2 text-xs text-neon-pink">
            ⚠️ {PARK_RISK_LABEL[character.parkRisk]}이 필요해요. 입장 규정을 미리 확인하세요.
          </p>
        )}

        <div className="mt-4 flex gap-2" data-no-export>
          <button
            type="button"
            onClick={onToggleLock}
            aria-pressed={locked}
            className={`flex-1 rounded-xl px-3 py-2 text-sm font-bold transition ${
              locked
                ? 'bg-neon-yellow text-night-950'
                : 'bg-white/6 text-white/65 hover:bg-white/10 hover:text-white'
            }`}
          >
            {locked ? '🔒 고정됨' : '🔓 고정'}
          </button>
          <button
            type="button"
            onClick={onReroll}
            disabled={locked}
            className="flex-1 rounded-xl bg-white/6 px-3 py-2 text-sm font-bold text-white/65 transition hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:hover:bg-white/6"
          >
            🎲 다시
          </button>
        </div>
      </div>
    </article>
  );
}
