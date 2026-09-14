/**
 * 의상 미리보기 데이터.
 *
 * 캐릭터 그림을 베끼는 것이 아니라, 그 배역의 옷이 어떤 색이고 어떤 실루엣인지만
 * 도형으로 재현하기 위한 값이다. 실제 참고 사진을 넣으면 그쪽이 우선한다.
 */

export type Headgear = 'hair' | 'hat' | 'ears' | 'hood' | 'crown' | 'mask';
export type Silhouette = 'pants' | 'dress';

export interface Outfit {
  /** 머리 쪽 색 — 가발이거나 모자·귀 */
  head: string;
  top: string;
  /** 바지 또는 치마 */
  bottom: string;
  headgear: Headgear;
  silhouette: Silhouette;
  /** 망토·목도리·날개처럼 눈에 띄는 포인트 색 */
  accent?: string;
}

/** 색을 직접 적지 않고 이름으로 쓰면 주제 사이에서 톤이 흔들리지 않는다. */
const C = {
  black: '#23242C',
  white: '#F2F3F8',
  gray: '#9AA1AE',
  silver: '#D7DBE3',
  cream: '#EFE3C8',
  skin: '#E8B98F',
  red: '#DC4436',
  crimson: '#A62B2B',
  orange: '#F08A35',
  yellow: '#F2C12E',
  gold: '#E0B93C',
  lime: '#9DD16A',
  green: '#3E9E58',
  darkGreen: '#1F5F3A',
  mint: '#5FD3B8',
  sky: '#6FC8F0',
  blue: '#3B7DD8',
  navy: '#2B3A6B',
  purple: '#8B5CF6',
  lavender: '#B9A0E8',
  pink: '#F08CB4',
  magenta: '#D94F9B',
  brown: '#8A5A2B',
  tan: '#C89A63',
} as const;

/** [머리, 상의, 하의, 머리 장식, 실루엣, 포인트색?] */
type Spec = [string, string, string, Headgear, Silhouette, string?];

const SPECS: Record<string, Spec> = {
  // 디즈니·픽사
  엘사: [C.silver, C.sky, C.sky, 'hair', 'dress', C.white],
  안나: [C.orange, C.navy, C.navy, 'hair', 'dress', C.black],
  라푼젤: [C.gold, C.lavender, C.lavender, 'hair', 'dress'],
  벨: [C.brown, C.yellow, C.yellow, 'hair', 'dress'],
  자스민: [C.black, C.mint, C.mint, 'hair', 'pants'],
  미니마우스: [C.black, C.red, C.red, 'ears', 'dress'],
  일라스티걸: [C.red, C.red, C.red, 'hair', 'pants', C.orange],
  우디: [C.tan, C.yellow, C.blue, 'hat', 'pants'],
  버즈: [C.white, C.white, C.green, 'hat', 'pants', C.purple],
  미키마우스: [C.black, C.black, C.red, 'ears', 'pants'],
  알라딘: [C.black, C.purple, C.white, 'hat', 'pants'],
  인크레더블: [C.black, C.red, C.red, 'mask', 'pants'],
  올라프: [C.white, C.white, C.white, 'hat', 'pants', C.orange],
  스티치: [C.blue, C.blue, C.blue, 'ears', 'pants'],
  도리: [C.blue, C.blue, C.blue, 'ears', 'pants', C.yellow],
  니모: [C.orange, C.orange, C.orange, 'ears', 'pants', C.white],

  // 지브리
  치히로: [C.brown, C.white, C.green, 'hair', 'pants', C.pink],
  산: [C.brown, C.white, C.brown, 'hair', 'dress', C.white],
  시타: [C.brown, C.pink, C.pink, 'hair', 'dress'],
  소피: [C.silver, C.gray, C.gray, 'hat', 'dress', C.white],
  유바바: [C.gold, C.magenta, C.magenta, 'hair', 'dress'],
  메이: [C.brown, C.yellow, C.yellow, 'hat', 'dress'],
  사츠키: [C.brown, C.pink, C.blue, 'hair', 'pants'],
  포뇨: [C.pink, C.red, C.red, 'hair', 'dress', C.yellow],
  파즈: [C.brown, C.sky, C.brown, 'hat', 'pants'],
  하쿠: [C.darkGreen, C.white, C.navy, 'hair', 'pants'],
  하울: [C.gold, C.black, C.black, 'hair', 'pants', C.magenta],
  아시타카: [C.brown, C.navy, C.navy, 'hair', 'pants', C.red],
  소스케: [C.brown, C.yellow, C.blue, 'hair', 'pants'],
  마르클: [C.red, C.brown, C.brown, 'hat', 'pants', C.brown],
  지지: [C.black, C.black, C.black, 'ears', 'pants'],
  토토로: [C.gray, C.gray, C.cream, 'mask', 'pants'],
  가오나시: [C.white, C.black, C.black, 'mask', 'dress', C.black],

  // 포켓몬
  지우: [C.red, C.blue, C.navy, 'hat', 'pants'],
  로이: [C.purple, C.white, C.white, 'hair', 'pants', C.red],
  로사: [C.red, C.white, C.white, 'hair', 'dress', C.red],
  피카츄: [C.yellow, C.yellow, C.yellow, 'ears', 'pants', C.brown],
  이상해씨: [C.lime, C.lime, C.lime, 'hat', 'pants', C.green],
  파이리: [C.orange, C.orange, C.orange, 'hood', 'pants', C.red],
  꼬부기: [C.sky, C.sky, C.brown, 'hat', 'pants'],
  이브이: [C.brown, C.brown, C.cream, 'ears', 'pants', C.cream],
  푸린: [C.pink, C.pink, C.pink, 'ears', 'dress'],
  잠만보: [C.navy, C.navy, C.cream, 'ears', 'pants'],
  리자몽: [C.orange, C.orange, C.cream, 'ears', 'pants', C.red],
  뮤츠: [C.lavender, C.lavender, C.lavender, 'ears', 'pants'],

  // 마블
  '캡틴 아메리카': [C.blue, C.blue, C.blue, 'hair', 'pants', C.red],
  헐크: [C.green, C.green, C.purple, 'hair', 'pants'],
  팔콘: [C.black, C.white, C.white, 'mask', 'pants', C.gray],
  '미즈 마블': [C.black, C.blue, C.blue, 'hair', 'pants', C.red],
  '블랙 위도우': [C.red, C.black, C.black, 'hair', 'pants'],
  '스칼렛 위치': [C.red, C.crimson, C.crimson, 'hair', 'dress', C.crimson],
  로키: [C.black, C.darkGreen, C.darkGreen, 'hair', 'pants', C.gold],
  '윈터 솔저': [C.brown, C.black, C.black, 'hair', 'pants', C.silver],
  '닥터 스트레인지': [C.black, C.blue, C.blue, 'hair', 'dress', C.red],
  '캡틴 마블': [C.gold, C.blue, C.red, 'hair', 'pants', C.gold],
  가모라: [C.crimson, C.black, C.black, 'hair', 'pants', C.green],
  로켓: [C.brown, C.orange, C.orange, 'ears', 'pants', C.brown],
  '블랙 팬서': [C.black, C.black, C.black, 'mask', 'pants', C.silver],
  그루트: [C.green, C.brown, C.brown, 'hair', 'pants'],
  스파이더맨: [C.red, C.red, C.blue, 'mask', 'pants'],
  아이언맨: [C.red, C.red, C.gold, 'mask', 'pants', C.sky],
  앤트맨: [C.red, C.red, C.black, 'mask', 'pants'],
  토르: [C.gold, C.black, C.black, 'hair', 'pants', C.red],

  // 해리포터
  해리: [C.black, C.black, C.black, 'hair', 'dress', C.red],
  론: [C.red, C.black, C.black, 'hair', 'dress', C.red],
  드레이코: [C.gold, C.black, C.black, 'hair', 'dress', C.green],
  덤블도어: [C.silver, C.purple, C.purple, 'hat', 'dress'],
  스네이프: [C.black, C.black, C.black, 'hair', 'dress', C.white],
  해그리드: [C.black, C.brown, C.brown, 'hair', 'dress'],
  시리우스: [C.black, C.black, C.black, 'hair', 'dress', C.gray],
  헤르미온느: [C.brown, C.black, C.black, 'hair', 'dress', C.red],
  루나: [C.gold, C.black, C.black, 'hair', 'dress', C.blue],
  지니: [C.red, C.black, C.black, 'hair', 'dress', C.red],
  맥고나걸: [C.gray, C.darkGreen, C.darkGreen, 'hat', 'dress'],
  벨라트릭스: [C.black, C.black, C.black, 'hair', 'dress', C.crimson],
  도비: [C.skin, C.brown, C.brown, 'ears', 'dress'],

  // 슈퍼마리오
  마리오: [C.red, C.red, C.blue, 'hat', 'pants'],
  루이지: [C.green, C.green, C.blue, 'hat', 'pants'],
  쿠파: [C.green, C.orange, C.orange, 'ears', 'pants'],
  와리오: [C.yellow, C.yellow, C.purple, 'hat', 'pants'],
  와루이지: [C.purple, C.purple, C.black, 'hat', 'pants'],
  동키콩: [C.brown, C.brown, C.brown, 'hat', 'pants', C.red],
  쿠파주니어: [C.green, C.yellow, C.green, 'ears', 'pants'],
  피치공주: [C.gold, C.pink, C.pink, 'crown', 'dress'],
  데이지공주: [C.brown, C.yellow, C.yellow, 'crown', 'dress'],
  로젤리나: [C.gold, C.sky, C.sky, 'crown', 'dress'],
  요시: [C.green, C.green, C.white, 'ears', 'pants'],
  키노피오: [C.red, C.white, C.blue, 'hat', 'pants'],
  굼바: [C.brown, C.brown, C.brown, 'hat', 'pants'],

  // 원피스
  루피: [C.tan, C.red, C.blue, 'hat', 'pants'],
  우솝: [C.green, C.yellow, C.yellow, 'hat', 'pants'],
  코비: [C.pink, C.white, C.navy, 'hair', 'pants'],
  상디: [C.gold, C.black, C.black, 'hair', 'pants'],
  프랑키: [C.sky, C.cream, C.blue, 'hair', 'pants'],
  에이스: [C.orange, C.skin, C.black, 'hat', 'pants'],
  '트라팔가 로': [C.black, C.yellow, C.blue, 'hat', 'pants'],
  모모노스케: [C.black, C.sky, C.sky, 'hair', 'dress'],
  나미: [C.orange, C.orange, C.blue, 'hair', 'dress'],
  비비: [C.blue, C.orange, C.orange, 'hair', 'dress'],
  로빈: [C.black, C.purple, C.black, 'hair', 'dress'],
  한코크: [C.black, C.red, C.red, 'hair', 'dress'],
  쵸파: [C.pink, C.pink, C.pink, 'hat', 'pants', C.brown],
  조로: [C.green, C.green, C.black, 'hair', 'pants'],
  브룩: [C.black, C.black, C.black, 'mask', 'pants', C.white],

  // 산리오
  헬로키티: [C.white, C.white, C.white, 'ears', 'dress', C.red],
  마이멜로디: [C.pink, C.pink, C.pink, 'hood', 'dress'],
  쿠로미: [C.black, C.black, C.black, 'ears', 'dress', C.purple],
  시나모롤: [C.white, C.white, C.white, 'ears', 'pants', C.sky],
  폼폼푸린: [C.yellow, C.yellow, C.yellow, 'hat', 'pants', C.brown],
  케로피: [C.green, C.green, C.white, 'ears', 'pants', C.red],
  배드바츠마루: [C.black, C.black, C.black, 'hat', 'pants', C.yellow],
  한교동: [C.sky, C.sky, C.sky, 'ears', 'pants', C.yellow],
  구데타마: [C.yellow, C.yellow, C.white, 'hat', 'pants'],
  라라: [C.pink, C.pink, C.pink, 'hat', 'pants'],
  '아기 판다': [C.black, C.white, C.black, 'ears', 'pants'],
};

/**
 * 이름이 겹치는 캐릭터. 지브리 키키(마녀 배달부)와 산리오 키키(별 쌍둥이)는
 * 전혀 다른 캐릭터다. 이런 이름만 주제까지 넣어 구분한다.
 */
const BY_THEME: Record<string, Spec> = {
  'ghibli/키키': [C.black, C.black, C.black, 'hair', 'dress', C.red],
  'sanrio/키키': [C.sky, C.sky, C.sky, 'hat', 'pants'],
};

export function outfitFor(themeId: string, characterName: string): Outfit | null {
  const spec = BY_THEME[`${themeId}/${characterName}`] ?? SPECS[characterName];
  if (!spec) return null;
  const [head, top, bottom, headgear, silhouette, accent] = spec;
  return { head, top, bottom, headgear, silhouette, accent };
}

/** 테스트에서 빠지거나 남는 항목을 잡기 위해 공개한다. */
export const OUTFIT_KEYS = [...Object.keys(SPECS), ...Object.keys(BY_THEME)];
