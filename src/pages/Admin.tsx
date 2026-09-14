import { useMemo, useState } from 'react';
import type { Character, Difficulty, Gender, MemberKind, ParkRisk, Theme } from '../types';
import { DEFAULT_THEMES, loadThemes, resetThemes, sanitizeThemes, saveThemes } from '../lib/themeStore';
import { useIdFactory } from '../lib/storage';
import { canCast } from '../lib/assign';

/** 주제가 이 규모를 감당하는지 관리 화면에서 바로 보여 준다. */
const YARDSTICK: { kind: MemberKind; gender: Gender; label: string }[] = [
  { kind: 'adult', gender: 'male', label: '어른 남' },
  { kind: 'adult', gender: 'female', label: '어른 여' },
  { kind: 'child', gender: 'male', label: '아이 남' },
  { kind: 'child', gender: 'female', label: '아이 여' },
];

function bucketCount(theme: Theme, kind: MemberKind, gender: Gender): number {
  return theme.characters.filter(
    (c) => c.parkRisk === null && c.fits.includes(kind) && (c.gender === null || c.gender === gender),
  ).length;
}

/** 어른 남2·여2 + 아이 남2·여2 를 두 필터 켠 채로 감당하는가. */
function handlesMixedGroup(theme: Theme): boolean {
  const members = YARDSTICK.flatMap(({ kind, gender }) =>
    [0, 1].map((i) => ({ id: `${kind}${gender}${i}`, name: 'x', kind, gender })),
  );
  return canCast({ members, characters: theme.characters, parkSafeOnly: true, matchGender: true });
}

const FIELD =
  'w-full rounded-xl border border-white/10 bg-night-800 px-3 py-2 text-sm outline-none focus:border-neon-cyan/60';
const CHIP = 'rounded-lg px-2.5 py-1 text-xs font-bold transition';

export default function Admin({ onExit }: { onExit: () => void }) {
  const [themes, setThemes] = useState<Theme[]>(() => loadThemes());
  const [open, setOpen] = useState<string | null>(null);
  // 캐릭터도 접어 둔다. 18명짜리 주제를 다 펼치면 화면이 끝없이 길어진다.
  const [openChar, setOpenChar] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const newId = useIdFactory();

  const dirty = useMemo(
    () => JSON.stringify(themes) !== JSON.stringify(DEFAULT_THEMES),
    [themes],
  );

  const commit = (next: Theme[]) => {
    setThemes(next);
    if (!saveThemes(next)) {
      setStatus('저장에 실패했어요. 브라우저 저장소가 막혀 있는 것 같습니다.');
    }
  };

  const patchTheme = (id: string, patch: Partial<Theme>) =>
    commit(themes.map((t) => (t.id === id ? { ...t, ...patch } : t)));

  const patchCharacter = (themeId: string, charId: string, patch: Partial<Character>) =>
    commit(
      themes.map((t) =>
        t.id === themeId
          ? { ...t, characters: t.characters.map((c) => (c.id === charId ? { ...c, ...patch } : c)) }
          : t,
      ),
    );

  const addTheme = () => {
    const id = `custom-${newId()}`;
    commit([
      ...themes,
      {
        id,
        name: '새 주제',
        emoji: '🎭',
        characters: [blankCharacter(`${id}-0`)],
      },
    ]);
    setOpen(id);
  };

  const addCharacter = (themeId: string) =>
    commit(
      themes.map((t) =>
        t.id === themeId ? { ...t, characters: [...t.characters, blankCharacter(newId())] } : t,
      ),
    );

  const removeCharacter = (themeId: string, charId: string) =>
    commit(
      themes.map((t) =>
        t.id === themeId ? { ...t, characters: t.characters.filter((c) => c.id !== charId) } : t,
      ),
    );

  const exportBackup = () => {
    const blob = new Blob([JSON.stringify(themes, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `코스프레-주제-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
    setStatus('백업 파일을 저장했어요.');
  };

  const importBackup = async (file: File) => {
    try {
      const parsed = sanitizeThemes(JSON.parse(await file.text()));
      if (parsed.length === 0) {
        setStatus('불러온 파일에서 쓸 수 있는 주제를 못 찾았어요.');
        return;
      }
      commit(parsed);
      setStatus(`${parsed.length}개 주제를 불러왔어요.`);
    } catch {
      setStatus('파일을 읽지 못했어요. 백업 파일이 맞는지 확인해 주세요.');
    }
  };

  const restoreDefaults = () => {
    resetThemes();
    setThemes(DEFAULT_THEMES);
    setStatus('기본 주제로 되돌렸어요.');
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))]">
      <header className="mb-5">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-xl font-black">🛠 주제 관리</h1>
          <button
            type="button"
            onClick={onExit}
            className="rounded-xl border border-white/15 bg-night-800 px-4 py-2 text-sm font-bold transition hover:bg-night-700"
          >
            캐스팅으로 →
          </button>
        </div>

        <p className="mt-4 rounded-2xl border border-neon-yellow/35 bg-neon-yellow/10 px-4 py-3 text-sm leading-relaxed text-neon-yellow/90">
          <b>이 기기의 브라우저에만 저장됩니다.</b> 새로고침하거나 브라우저를 닫아도 남지만,
          브라우저 데이터를 지우거나 시크릿 모드로 열면 사라집니다. 다른 기기·브라우저에서는
          기본 주제가 보입니다. 공들여 고쳤다면 아래 <b>백업 저장</b>을 눌러 파일로 남겨 두세요.
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={exportBackup}
            className="rounded-xl bg-neon-cyan px-4 py-2 text-sm font-bold text-night-950"
          >
            💾 백업 저장
          </button>
          <label className="cursor-pointer rounded-xl border border-white/15 bg-night-800 px-4 py-2 text-sm font-bold transition hover:bg-night-700">
            📂 백업 불러오기
            <input
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void importBackup(file);
                e.target.value = '';
              }}
            />
          </label>
          {dirty && (
            <button
              type="button"
              onClick={restoreDefaults}
              className="rounded-xl border border-white/15 px-4 py-2 text-sm font-bold text-white/60 transition hover:text-neon-pink"
            >
              기본값으로 되돌리기
            </button>
          )}
        </div>

        <div aria-live="polite" className="min-h-[1.5rem] pt-2">
          {status && <p className="text-sm text-neon-lime">{status}</p>}
        </div>
      </header>

      <main className="flex-1 space-y-3">
        {themes.map((theme) => {
          const isOpen = open === theme.id;
          const ok = handlesMixedGroup(theme);
          return (
            <section
              key={theme.id}
              className="rounded-3xl border border-white/10 bg-night-900/70 shadow-xl shadow-black/30"
            >
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : theme.id)}
                className="flex w-full items-center gap-3 px-5 py-4 text-left"
              >
                <span className="text-2xl">{theme.emoji}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold">{theme.name}</span>
                  <span className="block text-xs text-white/45">
                    캐릭터 {theme.characters.length}명 ·{' '}
                    {YARDSTICK.map((y) => `${y.label} ${bucketCount(theme, y.kind, y.gender)}`).join(
                      ' · ',
                    )}
                  </span>
                </span>
                <span
                  className={`shrink-0 rounded-lg px-2 py-1 text-xs font-bold ${
                    ok ? 'bg-neon-lime/15 text-neon-lime' : 'bg-neon-pink/15 text-neon-pink'
                  }`}
                >
                  {ok ? '8인 OK' : '8인 부족'}
                </span>
                <span aria-hidden className="text-white/30">
                  {isOpen ? '▲' : '▼'}
                </span>
              </button>

              {isOpen && (
                <div className="space-y-4 border-t border-white/10 px-5 py-4">
                  <div className="flex gap-2">
                    <input
                      value={theme.emoji}
                      onChange={(e) => patchTheme(theme.id, { emoji: e.target.value })}
                      aria-label="주제 이모지"
                      className={`${FIELD} w-16 text-center text-lg`}
                    />
                    <input
                      value={theme.name}
                      onChange={(e) => patchTheme(theme.id, { name: e.target.value })}
                      aria-label="주제 이름"
                      className={FIELD}
                    />
                  </div>
                  <p className="text-xs text-white/40">
                    룰렛 칸에 들어가야 해서 이름은 다섯 글자 안쪽이 좋아요.
                  </p>

                  {!ok && (
                    <p className="rounded-xl bg-neon-pink/10 px-3 py-2 text-xs leading-relaxed text-neon-pink">
                      두 필터를 모두 켠 상태에서 어른 남2·여2, 아이 남2·여2 를 배정할 수 없습니다.
                      이대로 두면 그런 모임에서는 이 주제가 룰렛에 오르지 않아요.
                    </p>
                  )}

                  <ul className="space-y-3">
                    {theme.characters.map((ch) => (
                      <li key={ch.id} className="rounded-2xl border border-white/10 bg-night-800/60">
                        <div className="flex items-center gap-2 p-3">
                          <button
                            type="button"
                            onClick={() => setOpenChar(openChar === ch.id ? null : ch.id)}
                            className="flex min-w-0 flex-1 items-center gap-2 text-left"
                          >
                            <span className="min-w-0 flex-1 truncate font-bold">{ch.name}</span>
                            <span className="shrink-0 text-xs text-white/40">
                              {summarize(ch)}
                            </span>
                            <span aria-hidden className="shrink-0 text-white/30">
                              {openChar === ch.id ? '▲' : '▼'}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => removeCharacter(theme.id, ch.id)}
                            aria-label={`${ch.name} 삭제`}
                            className="shrink-0 rounded-xl px-2 text-white/35 transition hover:bg-white/5 hover:text-neon-pink"
                          >
                            ✕
                          </button>
                        </div>

                        {openChar === ch.id && (
                        <div className="px-3 pb-3">
                        <input
                          value={ch.name}
                          onChange={(e) => patchCharacter(theme.id, ch.id, { name: e.target.value })}
                          aria-label="캐릭터 이름"
                          className={`${FIELD} font-bold`}
                        />

                        <input
                          value={ch.look}
                          onChange={(e) => patchCharacter(theme.id, ch.id, { look: e.target.value })}
                          placeholder="이렇게 보이면 성공 (예: 노란 옷에 뾰족한 귀)"
                          aria-label="이렇게 보이면 성공"
                          className={`${FIELD} mt-2`}
                        />

                        <input
                          value={ch.items.join(', ')}
                          onChange={(e) =>
                            patchCharacter(theme.id, ch.id, {
                              items: e.target.value
                                .split(',')
                                .map((s) => s.trim())
                                .filter(Boolean),
                            })
                          }
                          placeholder="준비물 (쉼표로 구분)"
                          aria-label="준비물"
                          className={`${FIELD} mt-2`}
                        />

                        <div className="mt-3 flex flex-wrap gap-3">
                          <Group label="담당">
                            {(
                              [
                                [['adult', 'child'], '어른·아이'],
                                [['adult'], '어른만'],
                                [['child'], '아이만'],
                              ] as [MemberKind[], string][]
                            ).map(([fits, label]) => (
                              <Toggle
                                key={label}
                                on={ch.fits.slice().sort().join() === fits.slice().sort().join()}
                                onClick={() => patchCharacter(theme.id, ch.id, { fits })}
                              >
                                {label}
                              </Toggle>
                            ))}
                          </Group>

                          <Group label="성별">
                            {(
                              [
                                ['male', '남'],
                                ['female', '여'],
                                [null, '무관'],
                              ] as [Gender | null, string][]
                            ).map(([gender, label]) => (
                              <Toggle
                                key={label}
                                on={ch.gender === gender}
                                onClick={() => patchCharacter(theme.id, ch.id, { gender })}
                              >
                                {label}
                              </Toggle>
                            ))}
                          </Group>

                          <Group label="난이도">
                            {([1, 2, 3] as Difficulty[]).map((d) => (
                              <Toggle
                                key={d}
                                on={ch.difficulty === d}
                                onClick={() => patchCharacter(theme.id, ch.id, { difficulty: d })}
                              >
                                {d}
                              </Toggle>
                            ))}
                          </Group>

                          <Group label="파크 주의">
                            {(
                              [
                                [null, '없음'],
                                ['mask', '탈·가면'],
                                ['prop', '무기소품'],
                              ] as [ParkRisk, string][]
                            ).map(([risk, label]) => (
                              <Toggle
                                key={label}
                                on={ch.parkRisk === risk}
                                onClick={() => patchCharacter(theme.id, ch.id, { parkRisk: risk })}
                              >
                                {label}
                              </Toggle>
                            ))}
                          </Group>
                        </div>
                        </div>
                        )}
                      </li>
                    ))}
                  </ul>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => addCharacter(theme.id)}
                      className="rounded-xl bg-neon-cyan/15 px-4 py-2 text-sm font-bold text-neon-cyan"
                    >
                      + 캐릭터 추가
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        commit(themes.filter((t) => t.id !== theme.id));
                        setOpen(null);
                      }}
                      className="rounded-xl px-4 py-2 text-sm font-bold text-white/45 transition hover:text-neon-pink"
                    >
                      주제 삭제
                    </button>
                  </div>
                </div>
              )}
            </section>
          );
        })}

        <button
          type="button"
          onClick={addTheme}
          className="w-full rounded-3xl border border-dashed border-white/20 py-4 font-bold text-white/60 transition hover:border-neon-cyan/50 hover:text-white"
        >
          + 주제 추가
        </button>
      </main>

      <footer className="pt-8 text-center text-xs leading-relaxed text-white/25">
        여기서 추가한 캐릭터는 의상 미리보기 도형이 없습니다. 색과 실루엣은 코드
        (<code>src/data/outfits.ts</code>)에 있어요.
      </footer>
    </div>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-[11px] font-bold tracking-wide text-white/35">{label}</p>
      <div className="flex gap-1">{children}</div>
    </div>
  );
}

function Toggle({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`${CHIP} ${on ? 'bg-neon-yellow text-night-950' : 'bg-white/6 text-white/55 hover:text-white'}`}
    >
      {children}
    </button>
  );
}

/** 접힌 상태에서도 담당·성별·난이도는 보이게 한다. */
function summarize(ch: Character): string {
  const kind =
    ch.fits.length === 2 ? '어른·아이' : ch.fits[0] === 'adult' ? '어른만' : '아이만';
  const gender = ch.gender === 'male' ? '남' : ch.gender === 'female' ? '여' : '무관';
  return `${kind} · ${gender} · 난이도${ch.difficulty}${ch.parkRisk ? ' · ⛔' : ''}`;
}

function blankCharacter(id: string): Character {
  return {
    id,
    name: '새 캐릭터',
    look: '',
    difficulty: 2,
    fits: ['adult', 'child'],
    gender: null,
    items: ['준비물 미정'],
    parkRisk: null,
  };
}
