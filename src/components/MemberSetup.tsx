import { useState } from 'react';
import type { Gender, Member, MemberKind } from '../types';
import { GENDER_LABEL, KIND_LABEL } from '../types';
import { useIdFactory } from '../lib/storage';

interface Props {
  members: Member[];
  onChange: (next: Member[]) => void;
  parkSafeOnly: boolean;
  onParkSafeChange: (next: boolean) => void;
  matchGender: boolean;
  onMatchGenderChange: (next: boolean) => void;
  onNext: () => void;
}

const KIND_OPTIONS: { value: MemberKind; label: string }[] = [
  { value: 'adult', label: '🧑 어른' },
  { value: 'child', label: '🧒 아이' },
];

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: 'male', label: '남자' },
  { value: 'female', label: '여자' },
];

export default function MemberSetup({
  members,
  onChange,
  parkSafeOnly,
  onParkSafeChange,
  matchGender,
  onMatchGenderChange,
  onNext,
}: Props) {
  const [draft, setDraft] = useState('');
  const [kind, setKind] = useState<MemberKind>('adult');
  const [gender, setGender] = useState<Gender>('male');
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
    onChange([...members, ...names.map((name) => ({ id: newId(), name, kind, gender }))]);
    setDraft('');
  };

  const update = (id: string, patch: Partial<Member>) =>
    onChange(members.map((m) => (m.id === id ? { ...m, ...patch } : m)));

  const remove = (id: string) => onChange(members.filter((m) => m.id !== id));

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white/10 bg-night-900/70 p-5 shadow-xl shadow-black/30">
        <h2 className="text-lg font-bold">누가 함께 가나요?</h2>
        <p className="mt-1 text-sm text-white/55">
          이름을 넣고 어른·아이와 성별만 정해 주세요. 쉼표나 줄바꿈으로 여러 명을 한 번에 넣을 수
          있어요.
        </p>

        <div
          role="radiogroup"
          aria-label="추가할 구성원 구분"
          className="mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-night-800 p-1"
        >
          {KIND_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={kind === opt.value}
              onClick={() => setKind(opt.value)}
              className={`rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                kind === opt.value
                  ? 'bg-neon-yellow text-night-950 shadow-lg shadow-neon-yellow/20'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div
          role="radiogroup"
          aria-label="추가할 구성원 성별"
          className="mt-2 grid grid-cols-2 gap-2 rounded-2xl bg-night-800 p-1"
        >
          {GENDER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={gender === opt.value}
              onClick={() => setGender(opt.value)}
              className={`rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                gender === opt.value
                  ? opt.value === 'male'
                    ? 'bg-violet-400 text-night-950 shadow-lg shadow-violet-400/20'
                    : 'bg-rose-400 text-night-950 shadow-lg shadow-rose-400/20'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              {opt.label}
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
          <p className="mt-1 text-xs text-white/40">배지를 누르면 바꿀 수 있어요.</p>

          <ul className="mt-3 space-y-2">
            {members.map((m) => (
              <li
                key={m.id}
                className="flex items-center gap-1.5 rounded-2xl border border-white/10 bg-night-800/70 py-2 pr-2 pl-4"
              >
                <span className="min-w-0 flex-1 truncate font-semibold">{m.name}</span>
                <button
                  type="button"
                  onClick={() => update(m.id, { kind: m.kind === 'adult' ? 'child' : 'adult' })}
                  aria-label={`${m.name} 구분 바꾸기 (현재 ${KIND_LABEL[m.kind]})`}
                  className={`shrink-0 rounded-xl px-2.5 py-1.5 text-sm font-bold transition ${
                    m.kind === 'adult'
                      ? 'bg-neon-cyan/15 text-neon-cyan'
                      : 'bg-neon-lime/15 text-neon-lime'
                  }`}
                >
                  {m.kind === 'adult' ? '🧑 어른' : '🧒 아이'}
                </button>
                <button
                  type="button"
                  onClick={() => update(m.id, { gender: m.gender === 'male' ? 'female' : 'male' })}
                  aria-label={`${m.name} 성별 바꾸기 (현재 ${GENDER_LABEL[m.gender]}자)`}
                  className={`shrink-0 rounded-xl px-2.5 py-1.5 text-sm font-bold transition ${
                    m.gender === 'male'
                      ? 'bg-violet-400/20 text-violet-300'
                      : 'bg-rose-400/20 text-rose-300'
                  }`}
                >
                  {GENDER_LABEL[m.gender]}
                </button>
                <button
                  type="button"
                  onClick={() => remove(m.id)}
                  aria-label={`${m.name} 삭제`}
                  className="shrink-0 rounded-xl px-2 py-1.5 text-white/35 transition hover:bg-white/5 hover:text-neon-pink"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-4 rounded-3xl border border-white/10 bg-night-900/70 p-5 shadow-xl shadow-black/30">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={matchGender}
            onChange={(e) => onMatchGenderChange(e.target.checked)}
            className="mt-1 size-5 shrink-0 accent-neon-yellow"
          />
          <span>
            <span className="font-bold">성별에 맞춰 배정</span>
            <span className="mt-1 block text-sm text-white/55">
              남자에게 여자 배역이 가지 않게 합니다. 피카츄나 헬로키티처럼 의상에 성별이 드러나지
              않는 배역은 누구나 맡을 수 있어요. 끄면 성별을 가리지 않고 섞습니다.
            </span>
          </span>
        </label>

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
