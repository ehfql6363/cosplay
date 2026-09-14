import { describe, expect, it } from 'vitest';
import { THEMES } from './themes';
import { OUTFIT_KEYS, outfitFor } from './outfits';

const ALL = THEMES.flatMap((t) => t.characters.map((ch) => ({ themeId: t.id, ch })));

describe('의상 미리보기 데이터', () => {
  it('모든 캐릭터에 의상 데이터가 있다', () => {
    const missing = ALL.filter(({ themeId, ch }) => outfitFor(themeId, ch.name) === null).map(
      ({ themeId, ch }) => `${themeId}/${ch.name}`,
    );
    expect(missing, `의상 데이터 없음: ${missing.join(', ')}`).toEqual([]);
  });

  it('쓰이지 않는 의상 데이터가 남아 있지 않다', () => {
    const used = new Set(ALL.flatMap(({ themeId, ch }) => [ch.name, `${themeId}/${ch.name}`]));
    const orphans = OUTFIT_KEYS.filter((key) => !used.has(key));
    expect(orphans, `캐릭터가 없는 항목: ${orphans.join(', ')}`).toEqual([]);
  });

  /**
   * 이름이 겹치는 캐릭터는 주제까지 봐야 구분된다. 한쪽 의상이 다른 쪽에
   * 잘못 붙지 않는지 확인한다.
   */
  it('이름이 겹치는 캐릭터는 주제마다 다른 의상을 쓴다', () => {
    const byName = new Map<string, { themeId: string }[]>();
    for (const { themeId, ch } of ALL) {
      byName.set(ch.name, [...(byName.get(ch.name) ?? []), { themeId }]);
    }

    const collisions = [...byName.entries()].filter(([, list]) => list.length > 1);
    expect(collisions.length, '이름이 겹치는 캐릭터가 하나는 있어야 이 테스트가 의미 있다')
      .toBeGreaterThan(0);

    for (const [name, list] of collisions) {
      const seen = list.map(({ themeId }) => JSON.stringify(outfitFor(themeId, name)));
      expect(new Set(seen).size, `${name}: 주제가 다른데 의상이 같다`).toBe(list.length);
    }
  });

  it('색은 모두 유효한 hex 값이다', () => {
    for (const { themeId, ch } of ALL) {
      const outfit = outfitFor(themeId, ch.name);
      if (!outfit) continue;
      for (const [part, color] of Object.entries(outfit)) {
        if (part === 'headgear' || part === 'silhouette' || color === undefined) continue;
        expect(color, `${ch.name} / ${part}`).toMatch(/^#[0-9A-Fa-f]{6}$/);
      }
    }
  });

  it('단색이면 포인트색이나 머리 장식으로라도 형태가 읽혀야 한다', () => {
    for (const { themeId, ch } of ALL) {
      const o = outfitFor(themeId, ch.name);
      if (!o) continue;
      if (o.head === o.top && o.top === o.bottom) {
        expect(
          o.accent !== undefined || o.headgear !== 'hair',
          `${ch.name}: 단색인데 포인트도 머리 장식도 없다`,
        ).toBe(true);
      }
    }
  });
});
