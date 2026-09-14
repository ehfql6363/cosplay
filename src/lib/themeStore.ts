import type { Character, Difficulty, Gender, MemberKind, ParkRisk, Theme } from '../types';
import { THEMES as BUILT_IN } from '../data/themes';

const KEY = 'cosplay.themes.v1';

/**
 * 관리 페이지에서 고친 주제는 이 기기의 브라우저에만 남는다.
 * 저장된 게 없거나 형식이 깨졌으면 기본 주제로 돌아간다.
 */
export function loadThemes(): Theme[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === null) return BUILT_IN;
    const parsed = sanitizeThemes(JSON.parse(raw));
    return parsed.length > 0 ? parsed : BUILT_IN;
  } catch {
    return BUILT_IN;
  }
}

export function saveThemes(themes: Theme[]): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(themes));
    return true;
  } catch {
    // 저장소가 막혔거나 용량이 찼다. 화면에서 알려 준다.
    return false;
  }
}

export function resetThemes(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // 지우지 못해도 기본값으로 되돌릴 방법은 남아 있다.
  }
}

export function hasCustomThemes(): boolean {
  try {
    return localStorage.getItem(KEY) !== null;
  } catch {
    return false;
  }
}

export const DEFAULT_THEMES = BUILT_IN;

/* ---------- 검증 ---------- */

const KINDS: MemberKind[] = ['adult', 'child'];
const GENDERS: Gender[] = ['male', 'female'];
const RISKS: ParkRisk[] = ['mask', 'prop'];

function str(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function sanitizeCharacter(raw: unknown, fallbackId: string): Character | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const c = raw as Record<string, unknown>;

  const name = str(c.name).trim();
  if (!name) return null;

  const fits = Array.isArray(c.fits)
    ? (c.fits.filter((k) => KINDS.includes(k as MemberKind)) as MemberKind[])
    : [];
  if (fits.length === 0) return null;

  const items = Array.isArray(c.items)
    ? c.items.map((i) => str(i).trim()).filter(Boolean)
    : [];

  const difficulty = [1, 2, 3].includes(c.difficulty as number)
    ? (c.difficulty as Difficulty)
    : 2;

  return {
    id: str(c.id).trim() || fallbackId,
    name,
    look: str(c.look).trim(),
    difficulty,
    fits,
    gender: GENDERS.includes(c.gender as Gender) ? (c.gender as Gender) : null,
    items: items.length > 0 ? items : ['준비물 미정'],
    parkRisk: RISKS.includes(c.parkRisk as ParkRisk) ? (c.parkRisk as ParkRisk) : null,
  };
}

/**
 * 불러온 값이 주제 목록의 모양을 갖췄는지 확인한다.
 * 백업 파일을 직접 고쳤거나 예전 형식일 수 있어 통째로 믿지 않는다.
 */
export function sanitizeThemes(raw: unknown): Theme[] {
  if (!Array.isArray(raw)) return [];
  const out: Theme[] = [];
  const seenIds = new Set<string>();

  raw.forEach((item, ti) => {
    if (typeof item !== 'object' || item === null) return;
    const t = item as Record<string, unknown>;

    const name = str(t.name).trim();
    if (!name) return;

    let id = str(t.id).trim() || `theme-${ti}`;
    while (seenIds.has(id)) id = `${id}-${ti}`;
    seenIds.add(id);

    const characters = Array.isArray(t.characters)
      ? t.characters
          .map((c, ci) => sanitizeCharacter(c, `${id}-${ci}`))
          .filter((c): c is Character => c !== null)
      : [];
    if (characters.length === 0) return;

    // 캐릭터 id 가 겹치면 배정 결과가 엉킨다.
    const usedCharIds = new Set<string>();
    for (const c of characters) {
      while (usedCharIds.has(c.id)) c.id = `${c.id}-x`;
      usedCharIds.add(c.id);
    }

    out.push({ id, name, emoji: str(t.emoji).trim() || '🎭', characters });
  });

  return out;
}
