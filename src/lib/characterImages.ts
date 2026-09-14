/**
 * 캐릭터 참고 이미지.
 *
 * src/assets/characters/ 에 캐릭터 이름으로 파일을 넣으면 코드 수정 없이 붙는다.
 * (예: 피카츄.png) 빌드 시점에 Vite 가 폴더를 훑어 번들에 넣으므로, 경로를
 * 직접 적을 필요도 없고 파일이 없으면 그냥 이미지 없이 렌더된다.
 */
const files = import.meta.glob('../assets/characters/*.{png,jpg,jpeg,webp,avif,gif}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

/**
 * 파일명에서 확장자를 떼고 이름으로 색인한다.
 *
 * 한글 파일명은 유니코드 정규화 형태가 환경마다 다르다. macOS 에서 만든 파일은
 * 자모가 분리된 NFD 로 저장되는 일이 많아, 소스의 NFC 문자열과 그냥 비교하면
 * 눈에는 같은 글자인데 매칭에 실패한다. 양쪽 모두 NFC 로 맞춘 뒤 비교한다.
 */
export function buildImageIndex(entries: Record<string, string>): Map<string, string> {
  const index = new Map<string, string>();
  for (const [path, url] of Object.entries(entries)) {
    const fileName = path.split('/').pop();
    if (!fileName) continue;
    const base = fileName.replace(/\.[^.]+$/, '').normalize('NFC').trim();
    if (base) index.set(base, url);
  }
  return index;
}

export function findImage(index: Map<string, string>, characterName: string): string | null {
  return index.get(characterName.normalize('NFC').trim()) ?? null;
}

const INDEX = buildImageIndex(files);

/** 이 캐릭터의 참고 이미지 URL. 넣어 둔 파일이 없으면 null. */
export function characterImage(characterName: string): string | null {
  return findImage(INDEX, characterName);
}
