import { useCallback, useState } from 'react';
import type { Assignment, Member, Theme } from './types';
import { THEMES } from './data/themes';
import { assignCharacters } from './lib/assign';
import { usePersistedState } from './lib/storage';
import MemberSetup from './components/MemberSetup';
import ThemeWheel from './components/ThemeWheel';
import ResultBoard from './components/ResultBoard';

type Step = 'setup' | 'wheel' | 'result';

const STEPS: { id: Step; label: string }[] = [
  { id: 'setup', label: '명단' },
  { id: 'wheel', label: '주제' },
  { id: 'result', label: '캐스팅' },
];

export default function App() {
  const [members, setMembers] = usePersistedState<Member[]>('cosplay.members', []);
  const [parkSafeOnly, setParkSafeOnly] = usePersistedState('cosplay.parkSafeOnly', true);

  const [step, setStep] = useState<Step>('setup');
  const [theme, setTheme] = useState<Theme | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [locked, setLocked] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [stagger, setStagger] = useState(true);
  const [revealKey, setRevealKey] = useState(0);

  const runDraw = useCallback(
    (
      target: Theme,
      keep: Assignment[],
      opts: { stagger: boolean; exclude?: string[] },
    ): boolean => {
      const res = assignCharacters({
        members,
        characters: target.characters,
        keep,
        exclude: opts.exclude,
        parkSafeOnly,
      });
      if (!res.ok) {
        setError(res.message);
        return false;
      }
      setError(null);
      setAssignments(res.assignments);
      setStagger(opts.stagger);
      if (opts.stagger) setRevealKey((k) => k + 1);
      return true;
    },
    [members, parkSafeOnly],
  );

  /** 명단이 바뀌면 이전 캐스팅은 더 이상 유효하지 않다. */
  const updateMembers = (next: Member[]) => {
    setMembers(next);
    setAssignments([]);
    setLocked([]);
    setError(null);
  };

  const confirmTheme = (picked: Theme) => {
    setTheme(picked);
    setLocked([]);
    if (runDraw(picked, [], { stagger: true })) setStep('result');
  };

  const rerollAll = () => {
    if (!theme) return;
    runDraw(
      theme,
      assignments.filter((a) => locked.includes(a.memberId)),
      { stagger: true },
    );
  };

  /** 실제로 다른 캐릭터로 바뀌었는지 돌려준다. 바뀐 게 없으면 호출한 쪽에서 안내한다. */
  const rerollOne = (memberId: string): boolean => {
    if (!theme) return false;
    const current = assignments.find((a) => a.memberId === memberId);
    const keep = assignments.filter((a) => a.memberId !== memberId);
    // 방금 맡았던 캐릭터를 빼고 한 번 시도해, 다시 뽑았는데 그대로인 상황을 피한다.
    if (current && runDraw(theme, keep, { stagger: false, exclude: [current.characterId] })) {
      return true;
    }
    // 남은 후보가 그것뿐이었다는 뜻. 제외 없이 되돌려 놓고 바뀐 게 없다고 알린다.
    runDraw(theme, keep, { stagger: false });
    return false;
  };

  const toggleLock = (memberId: string) =>
    setLocked((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId],
    );

  const goTo = (next: Step) => {
    setError(null);
    setStep(next);
  };

  const activeIndex = STEPS.findIndex((s) => s.id === step);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))]">
      <header className="mb-6">
        <h1 className="text-center text-xl font-black tracking-tight">
          <span className="glow-pulse">🎭</span> 오늘의 코스프레 캐스팅
        </h1>
        <ol className="mt-4 flex items-center justify-center gap-2 text-xs font-bold">
          {STEPS.map((s, i) => (
            <li key={s.id} className="flex items-center gap-2">
              <span
                aria-current={step === s.id ? 'step' : undefined}
                className={`rounded-full px-3 py-1.5 transition ${
                  i === activeIndex
                    ? 'bg-neon-yellow text-night-950'
                    : i < activeIndex
                      ? 'bg-white/10 text-white/70'
                      : 'text-white/30'
                }`}
              >
                {s.label}
              </span>
              {i < STEPS.length - 1 && (
                <span aria-hidden className="text-white/20">
                  ›
                </span>
              )}
            </li>
          ))}
        </ol>
      </header>

      <main className="flex-1">
        {step === 'setup' && (
          <MemberSetup
            members={members}
            onChange={updateMembers}
            parkSafeOnly={parkSafeOnly}
            onParkSafeChange={setParkSafeOnly}
            onNext={() => goTo('wheel')}
          />
        )}

        {step === 'wheel' && (
          <ThemeWheel
            themes={THEMES}
            parkSafeOnly={parkSafeOnly}
            onConfirm={confirmTheme}
            onBack={() => goTo('setup')}
            error={error}
          />
        )}

        {step === 'result' && theme && (
          <ResultBoard
            theme={theme}
            members={members}
            assignments={assignments}
            locked={locked}
            stagger={stagger}
            revealKey={revealKey}
            error={error}
            onToggleLock={toggleLock}
            onRerollOne={rerollOne}
            onRerollAll={rerollAll}
            onBackToWheel={() => goTo('wheel')}
            onEditMembers={() => goTo('setup')}
          />
        )}
      </main>

      <footer className="pt-8 text-center text-xs leading-relaxed text-white/25">
        놀이공원마다 코스튬 입장 규정이 다릅니다. 방문 전 해당 파크 공지를 확인해 주세요.
      </footer>
    </div>
  );
}
