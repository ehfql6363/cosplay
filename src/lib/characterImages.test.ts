import { describe, expect, it } from 'vitest';
import { buildImageIndex, findImage } from './characterImages';

describe('캐릭터 이미지 색인', () => {
  it('확장자를 떼고 파일 이름으로 찾는다', () => {
    const index = buildImageIndex({
      '../assets/characters/피카츄.png': '/assets/pikachu-abc.png',
      '../assets/characters/엘사.jpg': '/assets/elsa-def.jpg',
    });

    expect(findImage(index, '피카츄')).toBe('/assets/pikachu-abc.png');
    expect(findImage(index, '엘사')).toBe('/assets/elsa-def.jpg');
    expect(findImage(index, '없는캐릭터')).toBeNull();
  });

  it('macOS 에서 만든 자모 분리 파일명도 찾아낸다', () => {
    // macOS 는 한글 파일명을 NFD(자모 분리)로 저장하는 일이 많다.
    // 눈에는 같은 "피카츄" 지만 정규화하지 않으면 매칭에 실패한다.
    const nfd = '피카츄'.normalize('NFD');
    expect(nfd).not.toBe('피카츄');

    const index = buildImageIndex({ [`../assets/characters/${nfd}.png`]: '/assets/x.png' });

    expect(findImage(index, '피카츄')).toBe('/assets/x.png');
  });

  it('이름에 공백이 있는 캐릭터도 찾는다', () => {
    const index = buildImageIndex({
      '../assets/characters/캡틴 아메리카.webp': '/assets/cap.webp',
    });

    expect(findImage(index, '캡틴 아메리카')).toBe('/assets/cap.webp');
  });

  it('파일명 앞뒤 공백은 무시한다', () => {
    const index = buildImageIndex({ '../assets/characters/ 루피 .png': '/assets/luffy.png' });

    expect(findImage(index, '루피')).toBe('/assets/luffy.png');
  });

  it('이미지를 하나도 넣지 않았으면 전부 null 이다', () => {
    const index = buildImageIndex({});

    expect(findImage(index, '피카츄')).toBeNull();
  });
});
