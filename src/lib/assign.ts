import type { Assignment, Character, Member, MemberKind } from '../types';
import { KIND_LABEL } from '../types';

export interface AssignInput {
  members: Member[];
  characters: Character[];
  /** 이번 추첨에서 그대로 유지할 배정 (잠금 카드, 또는 개별 재추첨 시 나머지 전원) */
  keep?: Assignment[];
  /** 후보에서 빼둘 캐릭터 id — 지난 모임 이력이나 방금 뽑힌 캐릭터를 거를 때 쓴다 */
  exclude?: Iterable<string>;
  /** 얼굴을 덮는 탈·가면이나 무기류 소품이 필요한 캐릭터를 후보에서 제외 */
  parkSafeOnly?: boolean;
  rng?: () => number;
}

export interface Shortage {
  kind: MemberKind | 'total';
  need: number;
  have: number;
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
  const { members, characters, keep = [], parkSafeOnly = false, rng = Math.random } = input;
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

  const shortages = diagnose(open, pool);
  if (shortages.length > 0) {
    return { ok: false, message: describe(shortages), shortages };
  }

  const candidates = open.map((m) =>
    shuffle(
      pool.filter((c) => c.fits.includes(m.kind)).map((c) => c.id),
      rng,
    ),
  );
  const picked: (string | null)[] = new Array(open.length).fill(null);

  if (!solve(candidates, picked, new Set(), { left: STEP_BUDGET })) {
    return {
      ok: false,
      message:
        '조건에 맞게 나눌 수 있는 조합을 찾지 못했어요. 제외 설정을 풀거나 다른 주제를 뽑아보세요.',
      shortages: [{ kind: 'total', need: open.length, have: pool.length }],
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
 * 필요조건만 보므로 여기를 통과해도 조합이 없을 수 있고, 그 경우는 solve 가 걸러낸다.
 */
function diagnose(open: Member[], pool: Character[]): Shortage[] {
  const out: Shortage[] = [];
  for (const kind of ['child', 'adult'] as const) {
    const need = open.filter((m) => m.kind === kind).length;
    if (need === 0) continue;
    const have = pool.filter((c) => c.fits.includes(kind)).length;
    if (have < need) out.push({ kind, need, have });
  }
  if (open.length > pool.length) {
    out.push({ kind: 'total', need: open.length, have: pool.length });
  }
  return out;
}

function describe(shortages: Shortage[]): string {
  return shortages
    .map((s) => {
      const label = s.kind === 'total' ? '캐릭터' : `${KIND_LABEL[s.kind]} 캐릭터`;
      return `${label}가 ${s.need - s.have}명분 부족해요. (${s.need}명 필요, ${s.have}명 가능)`;
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
