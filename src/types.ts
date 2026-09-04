/** 모임 구성원 구분. 캐릭터 배정의 유일한 하드 제약이다. */
export type MemberKind = 'adult' | 'child';

export interface Member {
  id: string;
  name: string;
  kind: MemberKind;
}

/**
 * 놀이공원 입장에 걸릴 수 있는 요소.
 * - mask: 얼굴 전체를 덮는 탈·가면·헬멧
 * - prop: 무기류거나 길이가 있는 소품
 * null 이면 특별히 걸릴 것이 없다는 뜻.
 */
export type ParkRisk = 'mask' | 'prop' | null;

export interface Character {
  id: string;
  name: string;
  /** 이 캐릭터를 맡을 수 있는 구성원 구분 (최소 하나) */
  fits: MemberKind[];
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

export const PARK_RISK_LABEL: Record<Exclude<ParkRisk, null>, string> = {
  mask: '얼굴 가리는 탈·가면',
  prop: '무기류 소품',
};
