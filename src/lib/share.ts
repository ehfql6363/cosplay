import type { Assignment, Member, Theme } from '../types';
import { KIND_LABEL } from '../types';

/** 메신저에 그대로 붙여넣을 수 있는 결과 요약. */
export function formatResult(theme: Theme, members: Member[], assignments: Assignment[]): string {
  const byId = new Map(theme.characters.map((ch) => [ch.id, ch]));
  const picked = new Map(assignments.map((a) => [a.memberId, a.characterId]));

  const lines = members.flatMap((m) => {
    const ch = byId.get(picked.get(m.id) ?? '');
    if (!ch) return [];
    return [`· ${m.name} (${KIND_LABEL[m.kind]}) → ${ch.name}`, `   준비물: ${ch.items.join(', ')}`];
  });

  return [`🎭 오늘의 코스프레 캐스팅`, `주제: ${theme.name} ${theme.emoji}`, '', ...lines].join(
    '\n',
  );
}

/** navigator.clipboard 가 막힌 환경(비 HTTPS 등)을 위한 폴백 포함 복사. */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // 폴백: 화면 밖 textarea 를 만들어 execCommand 로 복사한다.
  }

  try {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.top = '-1000px';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  // 2배율 PNG 는 data: URL 로 만들면 문자열만 수 MB 가 된다. Blob 으로 바꿔
  // href 에 긴 문자열을 싣지 않는다. 변환에 실패하면 원래 URL 로 폴백한다.
  const objectUrl = toObjectUrl(dataUrl);
  const link = document.createElement('a');
  link.href = objectUrl ?? dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // 곧바로 해제하면 다운로드가 취소되는 브라우저가 있어 한 박자 뒤에 정리한다.
  if (objectUrl) window.setTimeout(() => URL.revokeObjectURL(objectUrl), 30_000);
}

function toObjectUrl(dataUrl: string): string | null {
  const match = /^data:([^;,]+);base64,(.*)$/s.exec(dataUrl);
  if (!match) return null;
  try {
    const bytes = Uint8Array.from(atob(match[2]), (ch) => ch.charCodeAt(0));
    return URL.createObjectURL(new Blob([bytes], { type: match[1] }));
  } catch {
    return null;
  }
}
