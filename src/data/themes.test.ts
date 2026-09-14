import { describe, expect, it } from 'vitest';
import { THEMES } from './themes';
import { assignCharacters } from '../lib/assign';
import type { Gender, Member, MemberKind } from '../types';

/** 어른 남2·여2 + 아이 남2·여2. 이 앱이 상정하는 가족 모임 규모. */
const MIXED_GROUP: Member[] = (['adult', 'child'] as MemberKind[]).flatMap((kind) =>
  (['male', 'female'] as Gender[]).flatMap((gender) =>
    [0, 1].map((i) => ({ id: `${kind}-${gender}-${i}`, name: `${kind}${gender}${i}`, kind, gender })),
  ),
);

describe('주제 데이터', () => {
  it('주제와 캐릭터 id 가 겹치지 않는다', () => {
    expect(new Set(THEMES.map((t) => t.id)).size).toBe(THEMES.length);
    const ids = THEMES.flatMap((t) => t.characters.map((ch) => ch.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('모든 캐릭터에 담당 구분·준비물·룩 설명이 있다', () => {
    for (const theme of THEMES) {
      for (const ch of theme.characters) {
        const where = `${theme.name} / ${ch.name}`;
        expect(ch.fits.length, where).toBeGreaterThan(0);
        expect(ch.items.length, where).toBeGreaterThan(0);
        // 한 줄 설명이 비어 있으면 "그래서 어떻게 보여야 하는데?" 가 안 풀린다.
        expect(ch.look.trim().length, where).toBeGreaterThan(8);
        expect([1, 2, 3], where).toContain(ch.difficulty);
      }
    }
  });

  /**
   * 안전 필터와 성별 맞춤을 모두 켜면 후보가 크게 줄어든다. 어느 주제가 걸려도
   * 이 규모는 배정되어야 모임에서 룰렛을 믿고 돌릴 수 있다.
   */
  it('안전 필터와 성별 맞춤을 켜도 어른 남2·여2, 아이 남2·여2 를 배정할 수 있다', () => {
    for (const theme of THEMES) {
      const res = assignCharacters({
        members: MIXED_GROUP,
        characters: theme.characters,
        parkSafeOnly: true,
        matchGender: true,
      });
      expect(res.ok, `${theme.name}: ${res.ok ? '' : res.message}`).toBe(true);
    }
  });

  it('성별 맞춤 배정은 배역 성별을 어기지 않는다', () => {
    for (const theme of THEMES) {
      const res = assignCharacters({
        members: MIXED_GROUP,
        characters: theme.characters,
        parkSafeOnly: true,
        matchGender: true,
      });
      expect(res.ok).toBe(true);
      if (!res.ok) return;

      const byId = new Map(theme.characters.map((ch) => [ch.id, ch]));
      const byMember = new Map(MIXED_GROUP.map((m) => [m.id, m]));
      for (const a of res.assignments) {
        const ch = byId.get(a.characterId)!;
        const m = byMember.get(a.memberId)!;
        const where = `${theme.name}: ${m.name} → ${ch.name}`;
        expect(ch.fits.includes(m.kind), where).toBe(true);
        if (ch.gender !== null) expect(ch.gender, where).toBe(m.gender);
      }
    }
  });

  it('구분·성별 조합마다 다시 뽑을 여유가 남는다', () => {
    for (const theme of THEMES) {
      const safe = theme.characters.filter((ch) => ch.parkRisk === null);
      for (const kind of ['adult', 'child'] as MemberKind[]) {
        for (const gender of ['male', 'female'] as Gender[]) {
          const pool = safe.filter(
            (ch) => ch.fits.includes(kind) && (ch.gender === null || ch.gender === gender),
          );
          // 두 명을 배정하고도 한 명쯤 다시 뽑을 여지가 있어야 한다.
          expect(pool.length, `${theme.name} / ${kind} ${gender}`).toBeGreaterThanOrEqual(3);
        }
      }
    }
  });
});
