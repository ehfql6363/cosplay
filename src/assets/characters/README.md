# 캐릭터 참고 이미지

이 폴더에 **캐릭터 이름 그대로** 파일을 넣으면 결과 카드에 자동으로 붙습니다.
코드는 고칠 필요가 없습니다.

```
src/assets/characters/피카츄.png
src/assets/characters/캡틴 아메리카.jpg
```

## 제일 쉬운 방법

다운로드 폴더에 사진을 모아 두고 스크립트를 돌리면 이름을 알아서 맞춰 줍니다.
"엘사 코스프레 (3).jpg" 같은 이름도 알아봅니다.

```bash
node scripts/prepare-images.mjs --list        # 아직 없는 캐릭터 보기
node scripts/prepare-images.mjs ~/Downloads --dry   # 옮기지 않고 확인만
node scripts/prepare-images.mjs ~/Downloads   # 실제로 정리
```

`npm i -D sharp` 를 해 두면 가로 720px 로 줄이고 압축까지 합니다.

## 규칙

- 확장자는 `png` `jpg` `jpeg` `webp` `avif` `gif` 를 받습니다.
- 넣지 않은 캐릭터는 사진 대신 의상 미리보기 도형이 나옵니다. 전부 채울 필요 없어요.
- 카드에서 가로로 꽉 차게, 높이 160px 로 잘려 보입니다. 인물이 가운데 오는 이미지가 좋습니다.
- 한 장에 300KB 이하를 권합니다.

### 이름이 겹치는 캐릭터

주제가 다른데 이름이 같은 캐릭터는 **주제 폴더**에 넣어야 서로 구분됩니다.

```
src/assets/characters/ghibli/키키.png
src/assets/characters/sanrio/키키.png
```

## 저작권

이 저장소는 공개되어 있습니다. 캐릭터 이미지는 대부분 저작권이 있으니,
어떤 이미지를 넣을지는 직접 판단해 주세요. 저장소를 비공개로 돌리는 것도 방법입니다.

## 파일명 목록 (총 117개)

### 🏰 디즈니·픽사  `disney`

```
엘사.png
안나.png
라푼젤.png
벨.png
자스민.png
미니마우스.png
일라스티걸.png
우디.png
버즈.png
미키마우스.png
알라딘.png
인크레더블.png
올라프.png
스티치.png
도리.png
니모.png
```

### 🌿 지브리  `ghibli`

```
치히로.png
ghibli/키키.png   ← 이름이 겹쳐 주제 폴더 필요
산.png
시타.png
소피.png
유바바.png
메이.png
사츠키.png
포뇨.png
파즈.png
하쿠.png
하울.png
아시타카.png
소스케.png
마르클.png
지지.png
토토로.png
가오나시.png
```

### ⚡ 포켓몬  `pokemon`

```
지우.png
로이.png
로사.png
피카츄.png
이상해씨.png
파이리.png
꼬부기.png
이브이.png
푸린.png
잠만보.png
리자몽.png
뮤츠.png
```

### 🦸 마블  `marvel`

```
캡틴 아메리카.png
헐크.png
로키.png
팔콘.png
윈터 솔저.png
닥터 스트레인지.png
캡틴 마블.png
미즈 마블.png
가모라.png
블랙 위도우.png
스칼렛 위치.png
그루트.png
로켓.png
스파이더맨.png
아이언맨.png
블랙 팬서.png
앤트맨.png
토르.png
```

### 🪄 해리포터  `potter`

```
해리.png
론.png
드레이코.png
덤블도어.png
스네이프.png
해그리드.png
시리우스.png
헤르미온느.png
루나.png
지니.png
맥고나걸.png
벨라트릭스.png
도비.png
```

### 🍄 슈퍼마리오  `mario`

```
마리오.png
루이지.png
쿠파.png
와리오.png
와루이지.png
동키콩.png
쿠파주니어.png
피치공주.png
데이지공주.png
로젤리나.png
요시.png
키노피오.png
굼바.png
```

### 🏴‍☠️ 원피스  `onepiece`

```
루피.png
우솝.png
코비.png
상디.png
프랑키.png
에이스.png
트라팔가 로.png
모모노스케.png
나미.png
비비.png
로빈.png
한코크.png
쵸파.png
조로.png
브룩.png
```

### 🎀 산리오  `sanrio`

```
헬로키티.png
마이멜로디.png
쿠로미.png
시나모롤.png
폼폼푸린.png
케로피.png
배드바츠마루.png
한교동.png
구데타마.png
sanrio/키키.png   ← 이름이 겹쳐 주제 폴더 필요
라라.png
아기 판다.png
```
