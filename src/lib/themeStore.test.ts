import { describe, expect, it } from 'vitest';
import { sanitizeThemes } from './themeStore';

const validCharacter = {
  id: 'x-0',
  name: '엘사',
  look: '온통 하늘색에 은발',
  difficulty: 2,
  fits: ['adult', 'child'],
  gender: 'female',
  items: ['하늘색 드레스'],
  parkRisk: null,
};

describe('주제 데이터 검증', () => {
  it('멀쩡한 값은 그대로 통과시킨다', () => {
    const out = sanitizeThemes([
      { id: 'disney', name: '디즈니', emoji: '🏰', characters: [validCharacter] },
    ]);

    expect(out).toHaveLength(1);
    expect(out[0].characters[0]).toEqual(validCharacter);
  });

  it('배열이 아니면 빈 목록이다', () => {
    expect(sanitizeThemes(null)).toEqual([]);
    expect(sanitizeThemes({ themes: [] })).toEqual([]);
    expect(sanitizeThemes('[]')).toEqual([]);
  });

  it('이름 없는 주제와 캐릭터는 버린다', () => {
    const out = sanitizeThemes([
      { id: 'a', name: '', characters: [validCharacter] },
      { id: 'b', name: '정상', characters: [validCharacter, { ...validCharacter, name: '  ' }] },
    ]);

    expect(out).toHaveLength(1);
    expect(out[0].characters).toHaveLength(1);
  });

  it('캐릭터가 하나도 없는 주제는 버린다', () => {
    // 캐릭터가 없으면 룰렛에서 뽑혀도 배정할 게 없다.
    expect(sanitizeThemes([{ id: 'a', name: '빈 주제', characters: [] }])).toEqual([]);
  });

  it('담당 구분이 비면 버린다', () => {
    const out = sanitizeThemes([
      { id: 'a', name: '주제', characters: [{ ...validCharacter, fits: [] }] },
    ]);
    expect(out).toEqual([]);
  });

  it('이상한 난이도와 성별은 안전한 값으로 되돌린다', () => {
    const out = sanitizeThemes([
      {
        id: 'a',
        name: '주제',
        characters: [{ ...validCharacter, difficulty: 9, gender: '남성', parkRisk: '폭탄' }],
      },
    ]);

    expect(out[0].characters[0].difficulty).toBe(2);
    expect(out[0].characters[0].gender).toBeNull();
    expect(out[0].characters[0].parkRisk).toBeNull();
  });

  it('준비물이 비면 자리표시를 넣는다', () => {
    const out = sanitizeThemes([
      { id: 'a', name: '주제', characters: [{ ...validCharacter, items: [] }] },
    ]);
    expect(out[0].characters[0].items).toEqual(['준비물 미정']);
  });

  it('주제 id 가 겹치면 갈라 준다', () => {
    const out = sanitizeThemes([
      { id: 'same', name: '하나', characters: [validCharacter] },
      { id: 'same', name: '둘', characters: [validCharacter] },
    ]);

    expect(out).toHaveLength(2);
    expect(out[0].id).not.toBe(out[1].id);
  });

  it('한 주제 안에서 캐릭터 id 가 겹치면 갈라 준다', () => {
    // 겹치면 배정 결과를 캐릭터로 되찾을 때 엉킨다.
    const out = sanitizeThemes([
      {
        id: 'a',
        name: '주제',
        characters: [validCharacter, { ...validCharacter, name: '안나' }],
      },
    ]);

    const ids = out[0].characters.map((c) => c.id);
    expect(new Set(ids).size).toBe(2);
  });

  it('id 나 이모지가 없으면 만들어 준다', () => {
    const out = sanitizeThemes([{ name: '주제', characters: [{ ...validCharacter, id: '' }] }]);

    expect(out[0].id).toBeTruthy();
    expect(out[0].emoji).toBe('🎭');
    expect(out[0].characters[0].id).toBeTruthy();
  });
});
