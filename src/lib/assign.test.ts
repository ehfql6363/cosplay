import { describe, expect, it } from 'vitest';
import { assignCharacters } from './assign';
import type { Character, Gender, Member, MemberKind } from '../types';

/** 성별을 안 쓰는 테스트가 대부분이라 기본값을 둔다. */
const member = (id: string, kind: MemberKind, gender: Gender = 'male'): Member => ({
  id,
  name: id,
  kind,
  gender,
});

const char = (
  id: string,
  fits: MemberKind[],
  parkRisk: Character['parkRisk'] = null,
  gender: Gender | null = null,
): Character => ({ id, name: id, fits, gender, look: '', difficulty: 1, items: [], parkRisk });

const ANY: MemberKind[] = ['adult', 'child'];

/** 결정적인 테스트를 위한 선형 합동 생성기. */
function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

describe('assignCharacters', () => {
  it('모두에게 서로 다른 캐릭터를 배정한다', () => {
    const members = [member('a', 'adult'), member('b', 'adult'), member('c', 'child')];
    const characters = [char('1', ANY), char('2', ANY), char('3', ANY), char('4', ANY)];

    const res = assignCharacters({ members, characters, rng: seeded(1) });

    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.assignments).toHaveLength(3);
    expect(new Set(res.assignments.map((a) => a.characterId)).size).toBe(3);
  });

  it('구분이 맞지 않는 캐릭터는 절대 배정하지 않는다', () => {
    const members = [member('kid', 'child'), member('grown', 'adult')];
    const characters = [char('kidOnly', ['child']), char('adultOnly', ['adult'])];

    // 무작위 시드를 여러 번 돌려 우연히 통과하는 경우를 배제한다.
    for (let seed = 0; seed < 50; seed++) {
      const res = assignCharacters({ members, characters, rng: seeded(seed) });
      expect(res.ok).toBe(true);
      if (!res.ok) return;
      const map = new Map(res.assignments.map((a) => [a.memberId, a.characterId]));
      expect(map.get('kid')).toBe('kidOnly');
      expect(map.get('grown')).toBe('adultOnly');
    }
  });

  it('keep 으로 넘긴 배정은 그대로 유지한다', () => {
    const members = [member('a', 'adult'), member('b', 'adult'), member('c', 'adult')];
    const characters = [char('1', ANY), char('2', ANY), char('3', ANY), char('4', ANY)];

    const res = assignCharacters({
      members,
      characters,
      keep: [{ memberId: 'a', characterId: '3' }],
      rng: seeded(7),
    });

    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.assignments.find((x) => x.memberId === 'a')?.characterId).toBe('3');
    // 잠긴 캐릭터가 다른 사람에게 중복 배정되면 안 된다.
    expect(res.assignments.filter((x) => x.characterId === '3')).toHaveLength(1);
  });

  it('exclude 한 캐릭터는 뽑히지 않는다', () => {
    const members = [member('a', 'adult')];
    const characters = [char('1', ANY), char('2', ANY)];

    for (let seed = 0; seed < 20; seed++) {
      const res = assignCharacters({ members, characters, exclude: ['1'], rng: seeded(seed) });
      expect(res.ok).toBe(true);
      if (!res.ok) return;
      expect(res.assignments[0].characterId).toBe('2');
    }
  });

  it('parkSafeOnly 는 탈·소품이 필요한 캐릭터를 제외한다', () => {
    const members = [member('a', 'adult')];
    const characters = [char('mask', ANY, 'mask'), char('prop', ANY, 'prop'), char('safe', ANY)];

    const res = assignCharacters({ members, characters, parkSafeOnly: true, rng: seeded(3) });

    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.assignments[0].characterId).toBe('safe');
  });

  it('구분별로 캐릭터가 모자라면 이유를 알려준다', () => {
    const members = [member('k1', 'child'), member('k2', 'child')];
    const characters = [char('1', ['child']), char('2', ['adult'])];

    const res = assignCharacters({ members, characters, rng: seeded(1) });

    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.shortages).toContainEqual({ kind: 'child', gender: null, need: 2, have: 1 });
    expect(res.message).toContain('아이');
  });

  it('총원보다 캐릭터가 적으면 실패한다', () => {
    const members = [member('a', 'adult'), member('b', 'adult')];
    const characters = [char('1', ANY)];

    const res = assignCharacters({ members, characters, rng: seeded(1) });

    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.shortages.some((s) => s.kind === 'total')).toBe(true);
  });

  it('구분별 인원은 충분하지만 조합이 빠듯한 경우도 풀어낸다', () => {
    // 겸용 캐릭터가 하나뿐이라, 그것을 아이에게 주면 어른이 막힌다.
    // 자리마다 후보가 적은 쪽부터 채워야 풀리는 배치.
    const members = [member('k1', 'child'), member('k2', 'child'), member('a1', 'adult')];
    const characters = [char('kid1', ['child']), char('both', ANY), char('kid2', ['child'])];

    for (let seed = 0; seed < 50; seed++) {
      const res = assignCharacters({ members, characters, rng: seeded(seed) });
      expect(res.ok).toBe(true);
      if (!res.ok) return;
      const map = new Map(res.assignments.map((a) => [a.memberId, a.characterId]));
      expect(map.get('a1')).toBe('both');
      expect(new Set([map.get('k1'), map.get('k2')])).toEqual(new Set(['kid1', 'kid2']));
    }
  });

  it('같은 명단이라도 시드가 다르면 결과가 달라진다', () => {
    const members = Array.from({ length: 6 }, (_, i) => member(`m${i}`, 'adult'));
    const characters = Array.from({ length: 12 }, (_, i) => char(`c${i}`, ANY));

    const seen = new Set<string>();
    for (let seed = 0; seed < 20; seed++) {
      const res = assignCharacters({ members, characters, rng: seeded(seed) });
      if (res.ok) seen.add(res.assignments.map((a) => a.characterId).join(','));
    }
    expect(seen.size).toBeGreaterThan(1);
  });

  it('matchGender 를 켜면 배역 성별을 어기지 않는다', () => {
    const members = [member('남', 'adult', 'male'), member('여', 'adult', 'female')];
    const characters = [
      char('남자역', ANY, null, 'male'),
      char('여자역', ANY, null, 'female'),
      char('아무나', ANY, null, null),
    ];

    for (let seed = 0; seed < 50; seed++) {
      const res = assignCharacters({ members, characters, matchGender: true, rng: seeded(seed) });
      expect(res.ok).toBe(true);
      if (!res.ok) return;
      const map = new Map(res.assignments.map((a) => [a.memberId, a.characterId]));
      expect(map.get('남')).not.toBe('여자역');
      expect(map.get('여')).not.toBe('남자역');
    }
  });

  it('성별 없는 배역은 누구나 맡을 수 있다', () => {
    const members = [member('남', 'adult', 'male'), member('여', 'adult', 'female')];
    // 겸용 배역 두 개뿐이라, 성별을 가렸다면 배정이 불가능했을 것이다.
    const characters = [char('아무나1', ANY, null, null), char('아무나2', ANY, null, null)];

    const res = assignCharacters({ members, characters, matchGender: true, rng: seeded(4) });

    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(new Set(res.assignments.map((a) => a.characterId)).size).toBe(2);
  });

  it('matchGender 가 꺼져 있으면 배역 성별을 무시한다', () => {
    const members = [member('남', 'adult', 'male')];
    const characters = [char('여자역', ANY, null, 'female')];

    const res = assignCharacters({ members, characters, rng: seeded(1) });

    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.assignments[0].characterId).toBe('여자역');
  });

  it('성별 배역이 모자라면 어느 쪽이 부족한지 알려준다', () => {
    const members = [member('여1', 'adult', 'female'), member('여2', 'adult', 'female')];
    const characters = [char('여자역', ANY, null, 'female'), char('남자역', ANY, null, 'male')];

    const res = assignCharacters({ members, characters, matchGender: true, rng: seeded(1) });

    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.shortages).toContainEqual({ kind: 'adult', gender: 'female', need: 2, have: 1 });
    expect(res.message).toContain('어른 여자');
  });

  it('구분과 성별 제약이 동시에 걸려도 풀어낸다', () => {
    // 겸용 배역이 하나뿐이라, 그것을 남자 어른에게 주면 남자 아이가 막힌다.
    const members = [
      member('남어른', 'adult', 'male'),
      member('남아이', 'child', 'male'),
      member('여아이', 'child', 'female'),
    ];
    const characters = [
      char('어른남자역', ['adult'], null, 'male'),
      char('아이겸용', ['child'], null, null),
      char('아이남자역', ['child'], null, 'male'),
    ];

    for (let seed = 0; seed < 50; seed++) {
      const res = assignCharacters({ members, characters, matchGender: true, rng: seeded(seed) });
      expect(res.ok).toBe(true);
      if (!res.ok) return;
      const map = new Map(res.assignments.map((a) => [a.memberId, a.characterId]));
      expect(map.get('남어른')).toBe('어른남자역');
      expect(map.get('여아이')).toBe('아이겸용');
      expect(map.get('남아이')).toBe('아이남자역');
    }
  });

  it('명단이 비어 있으면 빈 결과를 돌려준다', () => {
    const res = assignCharacters({ members: [], characters: [char('1', ANY)] });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.assignments).toEqual([]);
  });
});
