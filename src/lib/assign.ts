import type { Assignment, Character, Gender, Member, MemberKind } from '../types';
import { GENDER_LABEL, KIND_LABEL } from '../types';

export interface AssignInput {
  members: Member[];
  characters: Character[];
  /** 이번 추첨에서 그대로 유지할 배정 (잠금 카드, 또는 개별 재추첨 시 나머지 전원) */
  keep?: Assignment[];
  /** 후보에서 빼둘 캐릭터 id — 지난 모임 이력이나 방금 뽑힌 캐릭터를 거를 때 쓴다 */
  exclude?: Iterable<string>;
  /** 얼굴을 덮는 탈·가면이나 무기류 소품이 필요한 캐릭터를 후보에서 제외 */
  parkSafeOnly?: boolean;
  /** 배역의 성별을 구성원의 성별에 맞춘다. 성별이 없는(null) 배역은 누구나 맡는다. */
  matchGender?: boolean;
  rng?: () => number;
}

export interface Shortage {
  kind: MemberKind | 'total';
  /** 성별 맞춤이 켜져 있을 때만 채워진다. */
  gender: Gender | null;
  need: number;
  have: number;
}

/**
 * 이 명단을 이 캐릭터 목록으로 배정할 수 있는가.
 *
 * 룰렛에 올릴 주제를 거르는 데 쓴다. 돌리고 나서야 "인원이 부족해요" 를 보여 주는 것보다
 * 애초에 안 되는 주제를 빼는 편이 낫다. 배정 가능하면 실제 추첨도 반드시 성공한다 —
 * solve 가 완전 탐색이라 해가 있으면 섞인 순서와 무관하게 찾아내기 때문이다.
 */
export function canCast(input: Omit<AssignInput, 'keep' | 'exclude'>): boolean {
  return assignCharacters(input).ok;
}

/** 배정이 안 되는 이유. 주제를 왜 뺐는지 알려 줄 때 쓴다. */
export function castBlocker(input: Omit<AssignInput, 'keep' | 'exclude'>): string | null {
  const res = assignCharacters(input);
  return res.ok ? null : res.message;
}

/** 이 구성원이 맡을 수 있는 배역인가. 후보 선정과 부족 진단이 같은 기준을 쓰도록 모아 둔다. */
function canPlay(character: Character, member: Member, matchGender: boolean): boolean {
  if (!character.fits.includes(member.kind)) return false;
  if (matchGender && character.gender !== null && character.gender !== member.gender) return false;
  return true;
}

export type AssignResult =
  | { ok: true; assignments: Assignment[] }
  | { ok: false; message: string; shortages: Shortage[] };

/** 백트래킹이 병적인 입력에서 오래 도는 것을 막는 상한. 20명 규모에서는 닿을 일이 없다. */
const STEP_BUDGET = 200_000;

/**
 * 구성원마다 서로 다른 캐릭터를 배정한다.
 *
 * 단순 랜덤 뽑기가 아니라 제약 만족 문제로 푼다. 아이에게 어른 전용 캐릭터가
 * 가는 사고를 막으면서도 결과는 매번 달라야 하기 때문에, 후보를 섞은 뒤
 * 남은 후보가 가장 적은 사람부터 채우고(MRV) 막히면 되돌아간다.
 */
export function assignCharacters(input: AssignInput): AssignResult {
  const {
    members,
    characters,
    keep = [],
    parkSafeOnly = false,
    matchGender = false,
    rng = Math.random,
  } = input;
  const excluded = new Set(input.exclude ?? []);

  const byId = new Map(characters.map((c) => [c.id, c]));
  const memberIds = new Set(members.map((m) => m.id));

  // 유지할 배정을 먼저 확정한다. 지금 명단·주제에 없는 항목은 조용히 버린다.
  const fixed = new Map<string, string>();
  const taken = new Set<string>();
  for (const a of keep) {
    if (!memberIds.has(a.memberId) || fixed.has(a.memberId)) continue;
    if (!byId.has(a.characterId) || taken.has(a.characterId)) continue;
    fixed.set(a.memberId, a.characterId);
    taken.add(a.characterId);
  }

  const pool = characters.filter(
    (c) => !taken.has(c.id) && !excluded.has(c.id) && (!parkSafeOnly || c.parkRisk === null),
  );
  const open = members.filter((m) => !fixed.has(m.id));

  const shortages = diagnose(open, pool, matchGender);
  if (shortages.length > 0) {
    return { ok: false, message: describe(shortages), shortages };
  }

  const candidates = open.map((m) =>
    shuffle(
      pool.filter((c) => canPlay(c, m, matchGender)).map((c) => c.id),
      rng,
    ),
  );
  const picked: (string | null)[] = new Array(open.length).fill(null);

  if (!solve(candidates, picked, new Set(), { left: STEP_BUDGET })) {
    return {
      ok: false,
      message:
        '조건에 맞게 나눌 수 있는 조합을 찾지 못했어요. 제외 설정을 풀거나 다른 주제를 뽑아보세요.',
      shortages: [{ kind: 'total', gender: null, need: open.length, have: pool.length }],
    };
  }

  const slot = new Map(open.map((m, i) => [m.id, picked[i] as string]));
  return {
    ok: true,
    assignments: members.map((m) => ({
      memberId: m.id,
      characterId: fixed.get(m.id) ?? (slot.get(m.id) as string),
    })),
  };
}

/** 남은 후보가 가장 적은 자리부터 채우고, 막히면 되돌아간다. */
function solve(
  candidates: string[][],
  picked: (string | null)[],
  used: Set<string>,
  budget: { left: number },
): boolean {
  let target = -1;
  let best: string[] = [];

  for (let i = 0; i < candidates.length; i++) {
    if (picked[i] !== null) continue;
    const remaining = candidates[i].filter((id) => !used.has(id));
    if (remaining.length === 0) return false;
    if (target === -1 || remaining.length < best.length) {
      target = i;
      best = remaining;
    }
  }
  if (target === -1) return true; // 빈 자리가 없으면 완성

  for (const id of best) {
    if (budget.left-- <= 0) return false;
    picked[target] = id;
    used.add(id);
    if (solve(candidates, picked, used, budget)) return true;
    used.delete(id);
    picked[target] = null;
  }
  return false;
}

/**
 * 시작 전에 명백한 인원 부족을 잡아낸다.
 *
 * 같은 조건을 가진 사람끼리 묶어(어른 남자, 아이 여자 …) 그 묶음이 맡을 수 있는
 * 배역 수와 비교한다. 성별 맞춤이 꺼져 있으면 구분만으로 묶는다.
 * 필요조건만 보므로 여기를 통과해도 조합이 없을 수 있고, 그 경우는 solve 가 걸러낸다.
 */
function diagnose(open: Member[], pool: Character[], matchGender: boolean): Shortage[] {
  const out: Shortage[] = [];
  const done = new Set<string>();

  for (const member of open) {
    const key = matchGender ? `${member.kind}:${member.gender}` : member.kind;
    if (done.has(key)) continue;
    done.add(key);

    const need = open.filter(
      (m) => m.kind === member.kind && (!matchGender || m.gender === member.gender),
    ).length;
    const have = pool.filter((c) => canPlay(c, member, matchGender)).length;
    if (have < need) {
      out.push({
        kind: member.kind,
        gender: matchGender ? member.gender : null,
        need,
        have,
      });
    }
  }

  if (open.length > pool.length) {
    out.push({ kind: 'total', gender: null, need: open.length, have: pool.length });
  }
  return out;
}

function describe(shortages: Shortage[]): string {
  return shortages
    .map((s) => {
      const who =
        s.kind === 'total'
          ? ''
          : KIND_LABEL[s.kind] + (s.gender ? ` ${GENDER_LABEL[s.gender]}자` : '') + ' ';
      return `${who}캐릭터가 ${s.need - s.have}명분 부족해요. (${s.need}명 필요, ${s.have}명 가능)`;
    })
    .join(' ');
}

function shuffle<T>(items: T[], rng: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
