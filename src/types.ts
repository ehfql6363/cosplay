/** 모임 구성원 구분. 어른이 아이 배역을 맡는 일을 막는다. */
export type MemberKind = 'adult' | 'child';

export type Gender = 'male' | 'female';

export interface Member {
  id: string;
  name: string;
  kind: MemberKind;
  gender: Gender;
}

/**
 * 놀이공원 입장에 걸릴 수 있는 요소.
 * - mask: 얼굴 전체를 덮는 탈·가면·헬멧
 * - prop: 무기류거나 길이가 있는 소품
 * null 이면 특별히 걸릴 것이 없다는 뜻.
 */
export type ParkRisk = 'mask' | 'prop' | null;

/** 1 집에 있는 옷으로 / 2 소품 한둘 필요 / 3 공들여야 함 */
export type Difficulty = 1 | 2 | 3;

export interface Character {
  id: string;
  name: string;
  /**
   * 이 배역으로 보이려면 무엇이 핵심인지 한 줄로.
   * 준비물 목록만으로는 "그래서 어떻게 보여야 하는데?" 가 안 풀린다.
   */
  look: string;
  difficulty: Difficulty;
  /** 이 캐릭터를 맡을 수 있는 구성원 구분 (최소 하나) */
  fits: MemberKind[];
  /**
   * 배역의 성별. null 은 성별을 가리지 않는다는 뜻으로, 동물·마스코트·요정처럼
   * 의상만 보면 성별이 드러나지 않는 배역에 쓴다. 이런 배역이 넉넉해야
   * 성별 맞춤을 켜도 후보가 마르지 않는다.
   */
  gender: Gender | null;
  /** 챙겨야 할 의상·소품 */
  items: string[];
  parkRisk: ParkRisk;
}

export interface Theme {
  id: string;
  name: string;
  emoji: string;
  characters: Character[];
}

/** 누가 어떤 캐릭터를 맡는지. 잠금 여부는 App 이 별도로 들고 있다. */
export interface Assignment {
  memberId: string;
  characterId: string;
}

export const KIND_LABEL: Record<MemberKind, string> = {
  adult: '어른',
  child: '아이',
};

export const GENDER_LABEL: Record<Gender, string> = {
  male: '남',
  female: '여',
};

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  1: '집에 있는 옷으로',
  2: '소품 한둘 필요',
  3: '공들여야 함',
};

export const PARK_RISK_LABEL: Record<Exclude<ParkRisk, null>, string> = {
  mask: '얼굴 가리는 탈·가면',
  prop: '무기류 소품',
};
