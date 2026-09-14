import { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import type { Assignment, Member, Theme } from '../types';
import { copyText, downloadDataUrl, formatResult } from '../lib/share';
import { usePrefersReducedMotion } from '../lib/motion';
import TicketCard from './TicketCard';
import Confetti from './Confetti';

interface Props {
  theme: Theme;
  members: Member[];
  assignments: Assignment[];
  locked: string[];
  /** 전체 추첨 직후에만 카드를 순차로 등장시킨다. 한 장만 다시 뽑을 때는 그 카드만 바로 뒤집힌다. */
  stagger: boolean;
  revealKey: number;
  error: string | null;
  onToggleLock: (memberId: string) => void;
  /** 다른 캐릭터로 실제로 바뀌었으면 true. 후보가 동나면 false 를 돌려준다. */
  onRerollOne: (memberId: string) => boolean;
  onRerollAll: () => void;
  onBackToWheel: () => void;
  onEditMembers: () => void;
}

type Status = { kind: 'ok' | 'error'; text: string } | null;

export default function ResultBoard({
  theme,
  members,
  assignments,
  locked,
  stagger,
  revealKey,
  error,
  onToggleLock,
  onRerollOne,
  onRerollAll,
  onBackToWheel,
  onEditMembers,
}: Props) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>(null);
  const [saving, setSaving] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

  const charById = new Map(theme.characters.map((c) => [c.id, c]));
  const pickedBy = new Map(assignments.map((a) => [a.memberId, a.characterId]));
  const lockedSet = new Set(locked);

  const flash = (kind: 'ok' | 'error', text: string) => {
    setStatus({ kind, text });
    window.setTimeout(() => setStatus(null), 2600);
  };

  const saveImage = async () => {
    const sheet = sheetRef.current;
    if (!sheet || saving) return;
    setSaving(true);

    // 버튼을 숨겨 카드 높이가 줄어든 상태로 찍는다. (index.css 의 [data-exporting])
    sheet.dataset.exporting = 'true';
    const options = { backgroundColor: '#070b1c', pixelRatio: 2 };
    try {
      let dataUrl: string;
      try {
        dataUrl = await toPng(sheet, options);
      } catch {
        // 웹폰트를 인라인으로 가져오지 못하는 브라우저에서는 폰트를 건너뛰고 다시 시도한다.
        dataUrl = await toPng(sheet, { ...options, skipFonts: true });
      }
      downloadDataUrl(dataUrl, `코스프레-캐스팅-${theme.name}.png`);
      flash('ok', '이미지를 저장했어요.');
    } catch {
      flash('error', '이미지 저장에 실패했어요. 화면을 캡처해 주세요.');
    } finally {
      delete sheet.dataset.exporting;
      setSaving(false);
    }
  };

  const copy = async () => {
    const ok = await copyText(formatResult(theme, members, assignments));
    flash(ok ? 'ok' : 'error', ok ? '결과를 복사했어요.' : '복사에 실패했어요.');
  };

  return (
    <div className="space-y-5">
      {/* 컨페티는 순수한 장식이라 동작 줄이기를 켜면 띄우지 않는다. */}
      {stagger && !reducedMotion && <Confetti seed={revealKey} />}

      <div ref={sheetRef} className="space-y-4 rounded-3xl">
        <header className="rounded-3xl border border-white/10 bg-night-900/70 px-5 py-4 text-center">
          <p className="text-sm text-white/50">오늘의 코스프레 캐스팅</p>
          <h2 className="mt-0.5 text-2xl font-black">
            {theme.emoji} {theme.name}
          </h2>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          {members.map((m, i) => {
            const character = charById.get(pickedBy.get(m.id) ?? '');
            if (!character) return null;
            return (
              <TicketCard
                // 캐릭터가 바뀐 카드만 다시 마운트되어 등장 애니메이션이 재생된다.
                key={`${m.id}:${character.id}`}
                member={m}
                character={character}
                themeId={theme.id}
                locked={lockedSet.has(m.id)}
                delayMs={stagger ? Math.min(i, 9) * 90 : 0}
                onToggleLock={() => onToggleLock(m.id)}
                onReroll={() => {
                  if (!onRerollOne(m.id)) {
                    flash('error', `${m.name}에게 줄 다른 캐릭터가 남지 않았어요.`);
                  }
                }}
              />
            );
          })}
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-2xl border border-neon-pink/40 bg-neon-pink/10 px-4 py-3 text-sm text-neon-pink"
        >
          {error}
        </p>
      )}

      <div aria-live="polite" className="min-h-[1.5rem]">
        {status && (
          <p
            className={`text-center text-sm ${
              status.kind === 'ok' ? 'text-neon-lime' : 'text-neon-pink'
            }`}
          >
            {status.text}
          </p>
        )}
      </div>

      <div className="space-y-3">
        <button
          type="button"
          onClick={onRerollAll}
          className="w-full rounded-3xl bg-linear-to-r from-neon-pink to-neon-yellow py-4 text-lg font-black text-night-950 shadow-xl shadow-neon-pink/25 transition active:scale-[0.99]"
        >
          🎲 전체 다시 뽑기
          {locked.length > 0 && (
            <span className="ml-1 text-sm font-bold opacity-70">(고정 {locked.length}명 제외)</span>
          )}
        </button>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={saveImage}
            disabled={saving}
            className="rounded-2xl border border-white/15 bg-night-800 py-3.5 font-bold transition active:scale-[0.99] disabled:opacity-50"
          >
            {saving ? '저장 중…' : '🖼 이미지 저장'}
          </button>
          <button
            type="button"
            onClick={copy}
            className="rounded-2xl border border-white/15 bg-night-800 py-3.5 font-bold transition active:scale-[0.99]"
          >
            📋 결과 복사
          </button>
        </div>

        <div className="flex justify-center gap-4 pt-1 text-sm text-white/45">
          <button type="button" onClick={onBackToWheel} className="transition hover:text-white">
            주제 다시 뽑기
          </button>
          <span aria-hidden>·</span>
          <button type="button" onClick={onEditMembers} className="transition hover:text-white">
            명단 고치기
          </button>
        </div>
      </div>
    </div>
  );
}
