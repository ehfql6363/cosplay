import { describe, expect, it } from 'vitest';
import { buildImageIndex, findImage } from './characterImages';

describe('캐릭터 이미지 색인', () => {
  it('확장자를 떼고 파일 이름으로 찾는다', () => {
    const index = buildImageIndex({
      '../assets/characters/피카츄.png': '/assets/pikachu-abc.png',
      '../assets/characters/엘사.jpg': '/assets/elsa-def.jpg',
    });

    expect(findImage(index, 'pokemon', '피카츄')).toBe('/assets/pikachu-abc.png');
    expect(findImage(index, 'disney', '엘사')).toBe('/assets/elsa-def.jpg');
    expect(findImage(index, 'disney', '없는캐릭터')).toBeNull();
  });

  it('주제 폴더에 넣으면 이름이 겹쳐도 각자 찾아간다', () => {
    // 슈퍼히어로 로빈과 원피스 로빈은 전혀 다른 사람이다.
    const index = buildImageIndex({
      '../assets/characters/hero/로빈.png': '/assets/hero-robin.png',
      '../assets/characters/onepiece/로빈.png': '/assets/op-robin.png',
    });

    expect(findImage(index, 'hero', '로빈')).toBe('/assets/hero-robin.png');
    expect(findImage(index, 'onepiece', '로빈')).toBe('/assets/op-robin.png');
    expect(findImage(index, 'potter', '로빈')).toBeNull();
  });

  it('주제 폴더에 넣은 파일이 이름만 맞춘 파일보다 우선한다', () => {
    const index = buildImageIndex({
      '../assets/characters/키키.png': '/assets/generic.png',
      '../assets/characters/ghibli/키키.png': '/assets/ghibli-kiki.png',
    });

    expect(findImage(index, 'ghibli', '키키')).toBe('/assets/ghibli-kiki.png');
    // 폴더를 안 만든 주제는 이름만 맞춘 파일로 넘어간다.
    expect(findImage(index, 'sanrio', '키키')).toBe('/assets/generic.png');
  });

  it('macOS 에서 만든 자모 분리 파일명도 찾아낸다', () => {
    // macOS 는 한글 파일명을 NFD(자모 분리)로 저장하는 일이 많다.
    const nfd = '피카츄'.normalize('NFD');
    expect(nfd).not.toBe('피카츄');

    const index = buildImageIndex({ [`../assets/characters/${nfd}.png`]: '/assets/x.png' });

    expect(findImage(index, 'pokemon', '피카츄')).toBe('/assets/x.png');
  });

  it('이름에 공백이 있는 캐릭터도 찾는다', () => {
    const index = buildImageIndex({
      '../assets/characters/캡틴 아메리카.webp': '/assets/cap.webp',
    });

    expect(findImage(index, 'hero', '캡틴 아메리카')).toBe('/assets/cap.webp');
  });

  it('파일명 앞뒤 공백은 무시한다', () => {
    const index = buildImageIndex({ '../assets/characters/ 루피 .png': '/assets/luffy.png' });

    expect(findImage(index, 'onepiece', '루피')).toBe('/assets/luffy.png');
  });

  it('이미지를 하나도 넣지 않았으면 전부 null 이다', () => {
    const index = buildImageIndex({});

    expect(findImage(index, 'pokemon', '피카츄')).toBeNull();
  });
});
