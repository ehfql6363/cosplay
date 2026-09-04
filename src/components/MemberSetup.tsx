import { useState } from 'react';
import type { Member, MemberKind } from '../types';
import { KIND_LABEL } from '../types';
import { useIdFactory } from '../lib/storage';

interface Props {
  members: Member[];
  onChange: (next: Member[]) => void;
  parkSafeOnly: boolean;
  onParkSafeChange: (next: boolean) => void;
  onNext: () => void;
}

export default function MemberSetup({
  members,
  onChange,
  parkSafeOnly,
  onParkSafeChange,
  onNext,
}: Props) {
  const [draft, setDraft] = useState('');
  const [kind, setKind] = useState<MemberKind>('adult');
  const newId = useIdFactory();

  const adults = members.filter((m) => m.kind === 'adult').length;
  const children = members.length - adults;

  /** 쉼표·줄바꿈으로 여러 명을 한 번에 넣을 수 있게 한다. 단톡방 명단을 붙여넣는 게 제일 빠르다. */
  const add = () => {
    const names = draft
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (names.length === 0) return;
    onChange([...members, ...names.map((name) => ({ id: newId(), name, kind }))]);
    setDraft('');
  };

  const toggleKind = (id: string) =>
    onChange(
      members.map((m) =>
        m.id === id ? { ...m, kind: m.kind === 'adult' ? 'child' : 'adult' } : m,
      ),
    );

  const remove = (id: string) => onChange(members.filter((m) => m.id !== id));

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white/10 bg-night-900/70 p-5 shadow-xl shadow-black/30">
        <h2 className="text-lg font-bold">누가 함께 가나요?</h2>
        <p className="mt-1 text-sm text-white/55">
          이름을 넣고 어른·아이만 정해 주세요. 쉼표나 줄바꿈으로 여러 명을 한 번에 넣을 수 있어요.
        </p>

        <div
          role="radiogroup"
          aria-label="추가할 구성원 구분"
          className="mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-night-800 p-1"
        >
          {(['adult', 'child'] as const).map((k) => (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={kind === k}
              onClick={() => setKind(k)}
              className={`rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                kind === k
                  ? 'bg-neon-yellow text-night-950 shadow-lg shadow-neon-yellow/20'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              {k === 'adult' ? '🧑 어른' : '🧒 아이'}
            </button>
          ))}
        </div>

        <div className="mt-3 flex gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                add();
              }
            }}
            placeholder="예: 지우, 민서, 아빠"
            aria-label="이름"
            className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-night-800 px-4 py-3 text-base outline-none placeholder:text-white/30 focus:border-neon-cyan/60"
          />
          <button
            type="button"
            onClick={add}
            disabled={draft.trim() === ''}
            className="rounded-2xl bg-neon-cyan px-5 font-bold text-night-950 transition disabled:opacity-30"
          >
            추가
          </button>
        </div>
      </section>

      {members.length > 0 && (
        <section className="rounded-3xl border border-white/10 bg-night-900/70 p-5 shadow-xl shadow-black/30">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-bold">명단 {members.length}명</h2>
            <p className="text-sm text-white/55">
              어른 {adults} · 아이 {children}
            </p>
          </div>

          <ul className="mt-3 space-y-2">
            {members.map((m) => (
              <li
                key={m.id}
                className="flex items-center gap-2 rounded-2xl border border-white/10 bg-night-800/70 py-2 pr-2 pl-4"
              >
                <span className="min-w-0 flex-1 truncate font-semibold">{m.name}</span>
                <button
                  type="button"
                  onClick={() => toggleKind(m.id)}
                  aria-label={`${m.name} 구분 바꾸기 (현재 ${KIND_LABEL[m.kind]})`}
                  className={`rounded-xl px-3 py-1.5 text-sm font-bold transition ${
                    m.kind === 'adult'
                      ? 'bg-neon-cyan/15 text-neon-cyan'
                      : 'bg-neon-lime/15 text-neon-lime'
                  }`}
                >
                  {m.kind === 'adult' ? '🧑 어른' : '🧒 아이'}
                </button>
                <button
                  type="button"
                  onClick={() => remove(m.id)}
                  aria-label={`${m.name} 삭제`}
                  className="rounded-xl px-3 py-1.5 text-white/35 transition hover:bg-white/5 hover:text-neon-pink"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-3xl border border-white/10 bg-night-900/70 p-5 shadow-xl shadow-black/30">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={parkSafeOnly}
            onChange={(e) => onParkSafeChange(e.target.checked)}
            className="mt-1 size-5 shrink-0 accent-neon-yellow"
          />
          <span>
            <span className="font-bold">놀이공원용으로 안전한 캐릭터만</span>
            <span className="mt-1 block text-sm text-white/55">
              얼굴 전체를 덮는 탈·가면이나 무기류 소품이 필요한 캐릭터를 후보에서 뺍니다.
              에버랜드나 롯데월드처럼 파크마다 코스튬 규정이 따로 있으니, 가시기 전에 해당 파크
              공지를 한 번 확인해 주세요.
            </span>
          </span>
        </label>
      </section>

      <button
        type="button"
        onClick={onNext}
        disabled={members.length < 2}
        className="w-full rounded-3xl bg-linear-to-r from-neon-pink to-neon-yellow py-4 text-lg font-black text-night-950 shadow-xl shadow-neon-pink/25 transition active:scale-[0.99] disabled:from-white/10 disabled:to-white/10 disabled:text-white/30 disabled:shadow-none"
      >
        {members.length < 2 ? '2명 이상 넣어 주세요' : '주제 뽑으러 가기 →'}
      </button>
    </div>
  );
}
