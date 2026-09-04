import { describe, expect, it } from 'vitest';
import { THEMES } from './themes';
import { assignCharacters } from '../lib/assign';
import type { Member } from '../types';

describe('주제 데이터', () => {
  it('주제와 캐릭터 id 가 겹치지 않는다', () => {
    expect(new Set(THEMES.map((t) => t.id)).size).toBe(THEMES.length);
    const ids = THEMES.flatMap((t) => t.characters.map((ch) => ch.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('모든 캐릭터에 담당 구분과 준비물이 있다', () => {
    for (const theme of THEMES) {
      for (const ch of theme.characters) {
        expect(ch.fits.length, `${theme.name} / ${ch.name}`).toBeGreaterThan(0);
        expect(ch.items.length, `${theme.name} / ${ch.name}`).toBeGreaterThan(0);
      }
    }
  });

  /**
   * 안전 필터를 켜면 후보가 크게 줄어든다. 어느 주제가 걸려도 어른 4·아이 4 규모는
   * 배정되어야 모임에서 룰렛을 믿고 돌릴 수 있다.
   */
  it('안전 필터를 켜도 어른 4명 · 아이 4명을 배정할 수 있다', () => {
    const members: Member[] = [
      ...Array.from({ length: 4 }, (_, i) => ({ id: `a${i}`, name: `어른${i}`, kind: 'adult' as const })),
      ...Array.from({ length: 4 }, (_, i) => ({ id: `c${i}`, name: `아이${i}`, kind: 'child' as const })),
    ];

    for (const theme of THEMES) {
      const res = assignCharacters({
        members,
        characters: theme.characters,
        parkSafeOnly: true,
      });
      expect(res.ok, `${theme.name}: ${res.ok ? '' : res.message}`).toBe(true);
    }
  });

  it('안전 필터를 켠 뒤에도 주제마다 여유 후보가 남는다', () => {
    for (const theme of THEMES) {
      const safe = theme.characters.filter((ch) => ch.parkRisk === null);
      // 8명을 배정하고도 한 명쯤 다시 뽑을 여지가 있어야 한다.
      expect(safe.length, theme.name).toBeGreaterThanOrEqual(9);
      expect(safe.filter((ch) => ch.fits.includes('adult')).length, theme.name).toBeGreaterThanOrEqual(5);
      expect(safe.filter((ch) => ch.fits.includes('child')).length, theme.name).toBeGreaterThanOrEqual(5);
    }
  });
});
