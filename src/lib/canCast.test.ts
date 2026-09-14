import { describe, expect, it } from 'vitest';
import { assignCharacters, canCast, castBlocker } from './assign';
import { THEMES } from '../data/themes';
import type { Gender, Member, MemberKind } from '../types';

const group = (spec: [MemberKind, Gender, number][]): Member[] =>
  spec.flatMap(([kind, gender, n]) =>
    Array.from({ length: n }, (_, i) => ({
      id: `${kind}-${gender}-${i}`,
      name: `${kind}${gender}${i}`,
      kind,
      gender,
    })),
  );

describe('룰렛에 올릴 주제 거르기', () => {
  /**
   * 이 보장이 깨지면 사용자는 룰렛을 다 돌리고 나서야 배정 실패를 보게 된다.
   * canCast 가 true 라고 한 주제는 실제 추첨도 반드시 성공해야 한다.
   */
  it('canCast 가 통과시킨 주제는 실제 추첨도 성공한다', () => {
    const rosters = [
      group([['adult', 'male', 2], ['adult', 'female', 2], ['child', 'male', 2], ['child', 'female', 2]]),
      group([['adult', 'male', 5]]),
      group([['child', 'female', 4]]),
      group([['adult', 'female', 4], ['child', 'male', 1]]),
    ];

    for (const members of rosters) {
      for (const theme of THEMES) {
        for (const parkSafeOnly of [true, false]) {
          for (const matchGender of [true, false]) {
            const opts = { members, characters: theme.characters, parkSafeOnly, matchGender };
            if (!canCast(opts)) continue;
            // 여러 시드로 돌려도 한 번도 실패하면 안 된다
            for (let seed = 0; seed < 10; seed++) {
              const res = assignCharacters({ ...opts, rng: () => (seed * 37 + 11) % 97 / 97 });
              expect(res.ok, `${theme.name} / ${members.length}명 / seed ${seed}`).toBe(true);
            }
          }
        }
      }
    }
  });

  it('감당 못 하는 명단은 걸러내고 이유를 알려준다', () => {
    // 마블에는 어른 여자 안전 배역이 5명뿐이다.
    const tooMany = group([['adult', 'female', 9]]);
    const marvel = THEMES.find((t) => t.id === 'marvel')!;
    const opts = { members: tooMany, characters: marvel.characters, parkSafeOnly: true, matchGender: true };

    expect(canCast(opts)).toBe(false);
    expect(castBlocker(opts)).toContain('어른 여자');
  });

  it('배정되는 주제에는 이유가 없다', () => {
    const small = group([['adult', 'male', 1], ['child', 'female', 1]]);
    const opts = { members: small, characters: THEMES[0].characters, parkSafeOnly: true, matchGender: true };

    expect(canCast(opts)).toBe(true);
    expect(castBlocker(opts)).toBeNull();
  });

  it('명단이 비어 있으면 모든 주제가 통과한다', () => {
    for (const theme of THEMES) {
      expect(canCast({ members: [], characters: theme.characters, parkSafeOnly: true, matchGender: true })).toBe(true);
    }
  });

  /** 필터를 끄면 후보가 늘어나므로, 켠 상태에서 되던 것은 꺼도 되어야 한다. */
  it('필터를 끄면 가능한 주제가 줄지 않는다', () => {
    const members = group([['adult', 'male', 3], ['adult', 'female', 3], ['child', 'male', 2]]);
    for (const theme of THEMES) {
      const strict = canCast({ members, characters: theme.characters, parkSafeOnly: true, matchGender: true });
      const loose = canCast({ members, characters: theme.characters, parkSafeOnly: false, matchGender: false });
      if (strict) expect(loose, theme.name).toBe(true);
    }
  });
});
