#!/usr/bin/env node
/**
 * 캐릭터 참고 이미지 정리 도구.
 *
 *   node scripts/prepare-images.mjs --list        아직 이미지가 없는 캐릭터 보기
 *   node scripts/prepare-images.mjs ~/Downloads   폴더의 이미지를 알맞은 이름으로 정리
 *   node scripts/prepare-images.mjs ~/Downloads --dry   옮기지 않고 결과만 보기
 *
 * 받은 파일명이 "피카츄.png" 든 "피카츄 코스프레 (3).jpg" 든 캐릭터를 찾아
 * src/assets/characters/ 아래에 규칙에 맞는 이름으로 넣는다.
 * sharp 가 설치돼 있으면 가로 720px 로 줄이고 압축한다. (npm i -D sharp)
 */
import { readdirSync, readFileSync, mkdirSync, copyFileSync, statSync, existsSync } from 'node:fs';
import { join, extname, basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DEST = join(ROOT, 'src/assets/characters');
const THEMES_FILE = join(ROOT, 'src/data/themes.ts');
const EXTS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.avif', '.gif']);
const MAX_WIDTH = 720;

const norm = (s) => s.normalize('NFC').trim();
const squash = (s) => norm(s).replace(/\s+/g, '').toLowerCase();

/** themes.ts 에서 주제별 캐릭터 이름을 읽는다. 데이터 파일이 원본이라 따로 관리하지 않는다. */
function readCharacters() {
  const src = readFileSync(THEMES_FILE, 'utf8');
  const themeRe = /id: '([^']+)',\s*\n\s*name: '([^']+)',\s*\n\s*emoji: '([^']+)',\s*\n\s*characters: \[([\s\S]*?)\n {4}\],/g;
  const out = [];
  for (const m of src.matchAll(themeRe)) {
    for (const c of m[4].matchAll(/c\(\s*'([^']+)'/g)) {
      out.push({ themeId: m[1], themeName: m[2], emoji: m[3], name: c[1] });
    }
  }
  if (out.length < 100) {
    throw new Error(`themes.ts 파싱 실패 (${out.length}개만 찾음). 데이터 파일 형식이 바뀐 것 같습니다.`);
  }
  return out;
}

/** 이름이 겹치는 캐릭터는 주제 폴더에 넣어야 서로 구분된다. */
function collidingNames(characters) {
  const count = new Map();
  for (const c of characters) count.set(c.name, (count.get(c.name) ?? 0) + 1);
  return new Set([...count].filter(([, n]) => n > 1).map(([name]) => name));
}

function existingImages() {
  const found = new Map(); // key -> 경로
  if (!existsSync(DEST)) return found;
  const walk = (dir, prefix) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full, `${norm(entry.name)}/`);
      else if (EXTS.has(extname(entry.name).toLowerCase())) {
        found.set(prefix + norm(basename(entry.name, extname(entry.name))), full);
      }
    }
  };
  walk(DEST, '');
  return found;
}

function hasImage(images, { themeId, name }) {
  return images.has(`${themeId}/${norm(name)}`) || images.has(norm(name));
}

function printList(characters, images) {
  const byTheme = new Map();
  for (const c of characters) {
    if (!byTheme.has(c.themeId)) byTheme.set(c.themeId, { ...c, items: [] });
    byTheme.get(c.themeId).items.push(c);
  }
  let done = 0;
  for (const theme of byTheme.values()) {
    const missing = theme.items.filter((c) => !hasImage(images, c));
    done += theme.items.length - missing.length;
    const mark = missing.length === 0 ? '✅' : `${theme.items.length - missing.length}/${theme.items.length}`;
    console.log(`\n${theme.emoji} ${theme.themeName}  ${mark}`);
    if (missing.length) console.log('  없음: ' + missing.map((c) => c.name).join(', '));
  }
  console.log(`\n총 ${done}/${characters.length}개 채워짐`);
}

/** 파일 하나가 어느 캐릭터인지 찾는다. 정확히 같은 이름 > 이름을 포함 순으로 본다. */
function matchCharacter(fileBase, characters, themeHint) {
  const squashed = squash(fileBase);
  const pool = themeHint ? characters.filter((c) => c.themeId === themeHint) : characters;

  const exact = pool.filter((c) => squash(c.name) === squashed);
  if (exact.length) return exact;

  // 긴 이름부터 봐야 "로빈" 이 "로빈훗" 같은 이름을 가로채지 않는다
  const contains = pool
    .filter((c) => squashed.includes(squash(c.name)))
    .sort((a, b) => b.name.length - a.name.length);
  if (contains.length) {
    const best = squash(contains[0].name);
    return contains.filter((c) => squash(c.name) === best);
  }
  return [];
}

async function loadSharp() {
  try {
    return (await import('sharp')).default;
  } catch {
    return null;
  }
}

async function organize(sourceDir, { dry }) {
  const characters = readCharacters();
  const colliding = collidingNames(characters);
  const sharp = await loadSharp();
  if (!sharp) {
    console.log('sharp 가 없어 리사이즈 없이 복사만 합니다. (npm i -D sharp 로 켤 수 있어요)\n');
  }

  const files = readdirSync(sourceDir, { withFileTypes: true })
    .filter((e) => e.isFile() && EXTS.has(extname(e.name).toLowerCase()))
    .map((e) => e.name);

  if (files.length === 0) {
    console.log(`${sourceDir} 에 이미지 파일이 없습니다.`);
    return;
  }

  const moved = [];
  const skipped = [];

  for (const file of files) {
    const ext = extname(file).toLowerCase();
    const base = basename(file, ext);
    // "hero_로빈.png" 나 "hero-로빈.png" 처럼 앞에 주제를 붙여 두면 그걸 먼저 본다
    const hintMatch = base.match(/^([a-z]+)[_-](.+)$/i);
    const themeHint = hintMatch && characters.some((c) => c.themeId === hintMatch[1].toLowerCase())
      ? hintMatch[1].toLowerCase()
      : null;

    const matches = matchCharacter(themeHint ? hintMatch[2] : base, characters, themeHint);

    if (matches.length === 0) {
      skipped.push([file, '어느 캐릭터인지 모르겠어요']);
      continue;
    }
    if (matches.length > 1) {
      const themes = matches.map((m) => m.themeId).join(', ');
      skipped.push([file, `이름이 겹칩니다. 파일명 앞에 주제를 붙여 주세요 (${themes})`]);
      continue;
    }

    const hit = matches[0];
    // 겹치는 이름은 항상 주제 폴더에 넣어 서로 덮어쓰지 않게 한다
    const target = colliding.has(hit.name)
      ? join(DEST, hit.themeId, `${hit.name}${ext}`)
      : join(DEST, `${hit.name}${ext}`);

    const from = join(sourceDir, file);
    const sizeKb = Math.round(statSync(from).size / 1024);

    if (!dry) {
      mkdirSync(dirname(target), { recursive: true });
      if (sharp) {
        await sharp(from).resize({ width: MAX_WIDTH, withoutEnlargement: true }).toFile(target);
      } else {
        copyFileSync(from, target);
      }
    }
    const after = !dry && existsSync(target) ? Math.round(statSync(target).size / 1024) : sizeKb;
    moved.push([file, target.replace(ROOT + '/', ''), sizeKb, after]);
  }

  for (const [file, target, before, after] of moved) {
    const size = before === after ? `${after}KB` : `${before}KB → ${after}KB`;
    console.log(`  ${file}  →  ${target}  (${size})`);
  }
  if (skipped.length) {
    console.log('\n못 옮긴 파일:');
    for (const [file, why] of skipped) console.log(`  ${file}  —  ${why}`);
  }

  const heavy = moved.filter(([, , , after]) => after > 300);
  if (heavy.length) {
    console.log(`\n300KB 가 넘는 파일이 ${heavy.length}개 있습니다. sharp 를 설치하면 자동으로 줄어듭니다.`);
  }

  console.log(`\n${dry ? '(미리보기) ' : ''}${moved.length}개 정리, ${skipped.length}개 보류`);
  if (!dry && moved.length) console.log('npm run dev 로 확인해 보세요.');
}

const args = process.argv.slice(2);
const dry = args.includes('--dry');
const rest = args.filter((a) => !a.startsWith('--'));

try {
  if (args.includes('--list') || rest.length === 0) {
    printList(readCharacters(), existingImages());
    if (rest.length === 0 && !args.includes('--list')) {
      console.log('\n정리하려면: node scripts/prepare-images.mjs <이미지가 있는 폴더>');
    }
  } else {
    const dir = resolve(rest[0]);
    if (!existsSync(dir)) throw new Error(`폴더를 찾을 수 없습니다: ${dir}`);
    await organize(dir, { dry });
  }
} catch (err) {
  console.error('오류:', err.message);
  process.exitCode = 1;
}
