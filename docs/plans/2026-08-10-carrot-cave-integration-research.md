# CARROT CAVE 통합 계획서

## A. 한 문장 제품 정의

CARROT CAVE는 탐험, 빌딩, 낙서, 소설, 인터뷰 등 Simon의 여러 편집 축을 동등하게 담는 개인 출판 아카이브로, 랴오헝 인터뷰에서 확립한 정밀한 다크 에디토리얼 디자인 시스템 안에서 각 축에 맞는 탐색과 읽기 형식을 제공한다.

---

## B. 최종 권고안 요약

1. **기반 저장소는 `rabbitcrypt`(Next.js)다.** 랴오헝 리더의 디자인과 상호작용을 `app/interviews/[slug]/` 공통 템플릿으로 옮기고, 기존 URL·해시 딥링크·Playwright 계약을 보존한다.
2. **탐험, 빌딩, 낙서, 소설, 인터뷰를 동등한 1차 편집 축으로 둔다.** `Post`와 `Interview`는 구현 형식의 차이일 뿐, 사용자에게 에세이가 상위이고 인터뷰가 하위인 구조로 보이지 않는다.
3. **기존 글 URL `/posts/<slug>`는 그대로 유지한다.** `rabbitcrypt.com/posts/<slug>` → `carrotcave.com/posts/<slug>`의 1:1 도메인 리다이렉트로 82편의 링크를 보존한다. 분류 인덱스는 별도 1차 메뉴 URL로 제공한다.
4. **인터뷰는 처음부터 다편 아카이브로 설계한다.** `/interviews/<slug>` 공통 구조 아래 랴오헝과 후속 인터뷰를 동일한 리더 포맷으로 제공하고, 랴오헝은 `ARCHIVE 01`인 첫 인스턴스다.
5. **랴오헝 인터뷰 디자인을 CARROT CAVE의 전역 디자인 시스템으로 승격한다.** graphite, Pretendard, IBM Plex Mono, cyan/yellow/green 기능색, 고정 헤더, 진행률, 얇은 구분선과 접근성 규칙을 모든 축에 공통 적용한다. 축마다 별도 스킨을 만들지 않고 레이아웃만 달리한다.
6. **컷오버는 마지막이다.** preview 도메인에서 리다이렉트/딥링크/테스트를 전부 검증한 뒤에만 `carrotcave.com`을 production으로 붙인다.

**기각안: 인터뷰 저장소를 기반으로 삼는 방향.** 정적 HTML/JS 구조는 82편의 기존 글, Telegram 자동 동기화 파이프라인(`scripts/auto-sync.mjs`), 여러 편집 축의 인덱스와 연관 탐색을 담기 어렵다. 반대로 Next.js는 인터뷰 리더 디자인과 데이터 계약을 공통 템플릿으로 흡수할 수 있으므로 통합 기반으로 더 적합하다.

**기각안 2: 두 Vercel 프로젝트를 유지하고 프록시/리라이트로 묶는 방향.** 배포 2개, 도메인 설정 2벌, 장애 지점 2배가 되고 canonical/OG 관리가 이원화된다. 단일 저장소 단일 배포가 운영 비용이 가장 낮다.

---

## C. 브랜드 아키텍처와 편집 원칙

### 브랜드 구조
- **상위 브랜드:** CARROT CAVE (워드마크는 기존 Cormorant Garamond 스타일 유지, `app/page.tsx:321-333`의 로고 스타일을 텍스트만 교체)
- **태그라인:** "토끼를 따라왔는데, 생각이 길을 잃었습니다." / "Followed the rabbit. Lost in thought."
- **동등한 1차 편집 축:**
  - **탐험:** 기술, 경제, 사회, 정책, 문화와 미래를 파고드는 글.
  - **빌딩:** 제품, 조직, 투자와 실제로 만드는 과정의 기록.
  - **낙서:** 짧은 관찰, 단상, 메모와 미완의 질문.
  - **소설:** 미래와 SF를 포함한 서사 작업.
  - **인터뷰:** 당사자 발언과 원본 근거를 보존하는 1차 자료 아카이브. `ARCHIVE 01`, `02` 순으로 확장.
- 이 축들은 메뉴와 홈에서 같은 위계로 노출한다. 특정 축을 `글` 또는 `에세이`라는 상위 컨테이너 아래 넣지 않는다.

### 편집 원칙 (콘텐츠 경계)
랴오헝 리더가 이미 모범을 보여준다. `index.html:96`의 전사/번역 정확도 안내, `index.html:173-183`의 "읽을 때 주의할 점" 섹션은 화자 주장, ASR/자동번역, 편집자 요약을 명시적으로 분리하고 있다. 이 패턴을 사이트 전체 규약으로 승격한다.

| 블록 유형 | 정의 | 시각 규약 (제안) |
|---|---|---|
| AUTHORED PIECE | 탐험·빌딩·낙서·소설에 속한 Simon의 저작 | 콘텐츠 축 라벨 + 공통 CARROT CAVE 본문 규약 |
| INTERVIEW | 당사자 발언 전사 | sans 본문, 타임스탬프 mono, 화자 관점 주의문 필수 |
| TIMELINE | 시각/순서 정보 | mono, 원본 링크 동반 |
| SOURCE NOTE | 출처/번역/방법 고지 | 좌측 보더 note 블록(`styles.css:88`의 disclaimer 스타일 계승) |

- 인터뷰 페이지에서 Simon의 논평을 추가할 경우 반드시 "EDITOR'S NOTE" 블록으로 분리하고 전사 본문에 섞지 않는다.
- 다른 축의 글이 인터뷰를 인용할 때는 `#topic-N` 또는 `#segment-N` 딥링크로 원 발언을 가리킨다.
- 브랜드 표면(홈, 404, OG)은 해학적 카피를 허용하고, 개별 글과 인터뷰 리더는 진지한 편집물 톤을 유지한다.

---

## D. 최종 IA 및 URL 맵

### 최종 URL 구조

| URL | 내용 | 근거/비고 |
|---|---|---|
| `/` | 모든 편집 축을 동등하게 소개하는 통합 출판 인덱스 | 기존 `app/page.tsx` 재구성 |
| `/explorations` | 탐험 인덱스 | 기존 Post 중 `탐험` 분류 |
| `/building` | 빌딩 인덱스 | 기존 Post 중 `빌딩` 분류 |
| `/notes` | 낙서 인덱스 | 기존 Post 중 `낙서` 분류 |
| `/fiction` | 소설 인덱스 | 기존 Post 중 `소설` 분류 |
| `/posts/<slug>` | 기존 저작 상세 82편, **경로 변경 없음** | `app/posts/[slug]/page.tsx` 유지 |
| `/interviews` | 여러 인터뷰를 수용하는 동등한 1차 축 인덱스 | 신규 `app/interviews/page.tsx` |
| `/interviews/<slug>` | 공통 인터뷰 리더 템플릿 | 인터뷰 메타·장·topic·전사 데이터로 렌더링 |
| `/interviews/liao-heng` | `ARCHIVE 01` 랴오헝 리더 | 공통 템플릿의 첫 인스턴스 |
| `/interviews/liao-heng#chapter-N`, `#topic-1..35`, `#segment-1..8142` | 해시 딥링크 전부 보존 | `script.js:167-198`의 해시 해석 로직이 경로 무관하게 동작 |
| `/sitemap.xml`, `/rss.xml`, `/robots.txt` | 신규 | I절 참조 |

### 리다이렉트 맵

| 출발 | 도착 | 방식 |
|---|---|---|
| `rabbitcrypt.com/*` | `carrotcave.com/*` (경로 보존) | Vercel 도메인 리다이렉트 301 |
| `liao-heng-interview-wiki.vercel.app/*` | `carrotcave.com/interviews/liao-heng` | 구 프로젝트에 redirect 전용 `vercel.json` 배포, 301. 해시는 브라우저가 자동 보존 |
| `carrotcave.com/interviews/liao-heng` (trailing slash 유무) | 단일 canonical로 정규화 | `next.config` rewrite + redirect |

주의: 인터뷰의 `fetch('transcript-ko.json')`(`script.js:484`)은 상대 경로다. `/interviews/liao-heng`(슬래시 없음)에서 fetch하면 `/interviews/transcript-ko.json`으로 해석되어 깨진다. rewrite 설계 시 base 경로를 `/interviews/liao-heng/`로 통일하거나 fetch 경로를 절대 경로로 1줄 수정해야 한다. 이것이 이관에서 가장 흔한 함정이다.

### 홈 내비게이션
`탐험 / 빌딩 / 낙서 / 소설 / 인터뷰`를 동등한 1차 메뉴로 둔다. `전체`는 홈의 통합 피드 기능이지 다른 축과 같은 콘텐츠 분류가 아니다. 데스크톱에서는 한 줄 메뉴, 모바일에서는 가로 스크롤 탭 또는 목차 drawer로 제공한다.

---

## E. 화면별 UX 명세

### 1. 홈 (`/`)
- 기존 FeaturedCard와 masonry를 그대로 유지하는 대신, 인터뷰 리더의 편집 인덱스 문법으로 재구성한다.
- 첫 화면에는 CARROT CAVE 워드마크, 태그라인, 5개 동등 메뉴를 둔다.
- 아래에는 각 축의 최신 대표 항목을 같은 시각 위계로 한 편씩 배치한다. 인터뷰만 별도 홍보 모듈로 취급하지 않는다.
- 통합 최신 피드에서는 각 항목에 `EXPLORATION`, `BUILDING`, `NOTE`, `FICTION`, `INTERVIEW` 라벨을 붙이고 제목, 요약, 날짜 또는 러닝타임을 표시한다.
- 랴오헝 항목은 `INTERVIEW / ARCHIVE 01`, 인물명, 직함, 4:37:51, 7 chapters, 35 topics로 표시한다.

### 2. 편집 축별 인덱스
- 탐험, 빌딩, 낙서, 소설, 인터뷰 각각에 전용 인덱스를 둔다.
- 모든 인덱스는 같은 CARROT CAVE 헤더, 번호 체계, 구분선과 필터 문법을 사용한다.
- 목록의 정보 밀도는 축에 맞게 달라진다. 낙서는 짧고 촘촘하게, 소설은 제목과 시놉시스를 강조하고, 인터뷰는 인물·직함·길이·장·출처를 표시한다.

### 3. 기존 저작 상세 (`/posts/<slug>`)
- **유지:** 본문 렌더러, 태그, 텔레그램 반응, 타임라인, AI 연관도, 지식 그래프(`app/posts/[slug]/page.tsx` 전체).
- **추가:** 하단에 SOURCE NOTE 블록("이 글은 Telegram 채널에서 발행되었습니다" + 채널 링크 + 발행일). 현재 반응 표시(`app/posts/[slug]/page.tsx:385-403`)를 이 블록으로 흡수.
- **수정:** 헤더 back 링크 `← Rabbit Crypt`(`app/posts/[slug]/page.tsx:224`) → `← CARROT CAVE`.

### 4. 인터뷰 인덱스 (`/interviews`)
- 다른 4개 축과 동등한 CARROT CAVE 1차 메뉴다.
- 여러 인터뷰를 전제로 카드 또는 행마다 `ARCHIVE NN`, 인물명, 직함, 분야, 러닝타임, 장·주제·세그먼트 수, 원본 출처, 발행일을 표시한다.
- 첫 버전부터 랴오헝 한 편에 하드코딩하지 않고 `data/interviews.ts` 목록을 순회해 렌더링한다.
- 상단에 1차 발언, 출처, 번역과 편집 경계를 설명하는 인터뷰 축의 편집 규약을 둔다.

### 5. 인터뷰 상세 (`/interviews/<slug>`)
- 랴오헝 리더의 고정 헤더, 챕터 진행률 바, desktop rail, 모바일 top-sheet 목차, 중요 문장, 문단, 타임스탬프를 공통 인터뷰 템플릿의 계약으로 삼는다.
- 인물명, 직함, 분야, 이미지, 원본 URL, 러닝타임, 장, topic, 전사, key sentence, 번역·출처 고지는 인터뷰별 데이터로 주입한다.
- 좌상단은 CARROT CAVE와 `INTERVIEW / ARCHIVE NN`을 표시하고 홈과 인터뷰 인덱스로 돌아갈 수 있어야 한다.
- 랴오헝의 canonical/OG URL은 `carrotcave.com/interviews/liao-heng`으로 교체하고 후속 인터뷰도 같은 metadata 생성 규칙을 쓴다.

### 6. 여러 편집 축과 깊은 리더의 공존 원칙
1. **위계는 동등하고 읽기 형식은 다르다.** 탐험·빌딩·낙서·소설·인터뷰는 같은 메뉴 위계지만, 개별 콘텐츠는 축의 성격에 맞는 레이아웃을 사용한다.
2. **콘텐츠 화면 진입 후 브랜드 크롬은 최소화한다.** 인터뷰 리더의 고정 헤더는 브랜드가 아니라 현재 위치(챕터명, 진행률)를 표시한다. 이 원칙을 에세이 상세에도 역수입할 수 있다(2단계 이후).
3. **탐색 모드의 애니메이션 어휘(스와이프, hover glow)는 정독 모드에 반입 금지.** 정독 모드의 허용 모션은 진행률 바와 앵커 스크롤뿐이며 reduced-motion을 존중한다(`styles.css:149` 패턴을 전역 규약으로).

---

## F. 디자인 시스템 통합 명세

### 검증된 현재 상태 [관찰]
- Rabbit Crypt: navy `#080E1A` / cream `#F0E4CC` / amber `#D4922A`, Noto Serif KR 본문, 6종 폰트 로드(`app/layout.tsx:5-47`), 토큰은 `app/globals.css:3-12`에 일부만 정의되고 대부분 인라인 스타일로 하드코딩되어 있다(`app/page.tsx` 전반).
- 랴오헝: graphite `#292c33`, Pretendard 본문, IBM Plex Mono, cyan/yellow/green 포인트(`styles.css:4-14`), `word-break: keep-all`, skip-link와 focus-visible 등 접근성 기반이 탄탄하다.

### 토큰 전략 [제안]
랴오헝 인터뷰에서 검증된 토큰을 **CARROT CAVE 전역 토큰**으로 승격하고, 탐험·빌딩·낙서·소설·인터뷰는 색상 스킨이 아니라 레이아웃·정보 밀도·콘텐츠 컴포넌트만 달리한다.

| 구분 | 유지 | 버림 | 인터뷰에서 흡수 |
|---|---|---|---|
| 색 | graphite `#292c33`, panel `#2f3239/#36393e`, 밝은 neutral 본문 | Rabbit Crypt의 별도 navy/cream 스킨과 인라인 hex 산재 | cyan=링크·타임스탬프·현재 위치, yellow=핵심 문장, green=진행·상태 |
| 타이포 | Pretendard 본문·제목, IBM Plex Mono 메타·번호 | 축별 별도 폰트 스킨, Playfair Display와 불필요한 다중 폰트 | mono 라벨 위계(11px/12px/14px 체계, `styles.css:119-121`) |
| 레이아웃 | 홈 masonry, 에세이 720px 본문 폭 | 홈의 인라인 스타일 hover 핸들러(`app/page.tsx:67-76`, CSS 클래스로 이전) | `--measure: 680px` 개념, keep-all, 고정 헤더 + 진행률 바 패턴 |
| 내비게이션 | 카테고리 필터 헤더 | | skip-link, focus-visible outline, inert 기반 모달 규율, reduced-motion 전역 처리 |

### 전역 적용 순서
인터뷰의 graphite 토큰과 접근성 계약을 기준값으로 고정하고 홈과 5개 편집 축 인덱스, 기존 저작 상세에 순차 적용한다. 컷오버와 동시에 인터뷰 토큰 자체를 재설계하지 않는다. 먼저 검증된 디자인 시스템을 다른 화면으로 확장한 뒤, 전체 화면이 한 시스템에서 안정화됐을 때만 미세 조정한다.

---

## G. 콘텐츠 모델과 마이그레이션

### 스키마: 편집 축은 통합하고 렌더링 데이터는 분리한다
- **Section:** `exploration | building | note | fiction | interview`. 메뉴, 홈, 인덱스, sitemap에서 동등한 편집 축을 표현한다.
- **Post:** `data/posts.ts:4-19`의 현행 인터페이스와 기존 category 값을 유지한다. auto-sync가 이 파일을 정규식으로 직접 편집하므로(`scripts/auto-sync.mjs:558-591`) 저장 형식은 바꾸지 않고, 표시 계층에서 category를 Section으로 매핑한다.
- **Interview:** `data/interviews.ts`에 여러 인터뷰의 공통 메타데이터를 정의한다. `{ slug, archiveNumber, subject, subjectTitle, field, duration, chapterCount, topicCount, segmentCount, sourceUrl, sourceLabel, language, publishedDate, assetsPath }`.
- **Interview content bundle:** `data/interviews/<slug>/manifest.json`, `chapters.json`, `transcript-ko.json`, `key-sentences.json`, `assets/*`처럼 인터뷰별 자산을 같은 계약으로 둔다. 8,142개 세그먼트를 TS 번들로 끌어올리지 않는다.

### 이관 작업 목록
1. 랴오헝 리더에서 인물별 값과 공통 레이아웃을 분리해 `app/interviews/[slug]/` 공통 템플릿과 인터뷰별 data bundle 계약을 만든다.
2. 랴오헝의 `transcript-ko.json`, `key-sentences.json`, `assets/*`, 장·topic 메타를 첫 bundle인 `liao-heng`으로 이관한다.
3. Playwright 테스트(`tests/site.spec.js` 32건)를 공통 템플릿 계약 테스트와 랴오헝 데이터 보존 테스트로 나눠 rabbitcrypt에 이관한다. 후속 인터뷰 fixture 1개로 slug가 바뀌어도 동일 포맷이 렌더링되는 계약을 추가한다.
4. Python 검증 스크립트(`scripts/validate.py`, `build_social_card.py`)는 인터뷰 slug와 manifest를 입력받도록 일반화한다.
5. auto-sync의 메타데이터 생성 모델과 처리 로직은 무변경 원칙으로 둔다. Fable5는 이번 리서치와 계획 수립에만 사용한다.
6. `scripts/auto-sync.mjs`의 채널 상수와 사이트의 Telegram 링크는 현재 공개 채널 `@carrotcave`로 정렬한다.
7. [관찰] `data/posts.ts`를 객체 필드 기준으로 재검증한 결과 id, slug, title, summary, date가 각각 82개로 일치한다. 이관 시 82개 객체의 필수 필드와 고유 slug만 회귀 검증한다.
8. 미디어(`public/media/msg-*.{jpg,mp4}`)와 반응 수치는 경로 변경 없이 그대로 간다.

---

## H. 기술 아키텍처 결정

| 결정 | 선택 | 이유 |
|---|---|---|
| 프레임워크 | Next.js 16 App Router 유지 | 검증된 빌드(`npm run build` 통과), generateStaticParams로 82편 SSG 중 |
| 인터뷰 서빙 | `app/interviews/[slug]/page.tsx` 공통 템플릿 + 인터뷰별 정적 data bundle | 여러 인터뷰에서 같은 레이아웃·탐색·접근성 계약을 재사용하면서 SSG 가능 |
| 저장소 | `rabbitcrypt` 단일 repo, 구 인터뷰 repo는 archive | 배포/도메인/CI 단일화 |
| 배포 | 기존 Vercel `rabbit-crypt` 프로젝트 유지, 도메인만 추가 | production Ready 상태 재활용 |
| 성능 | [관찰] 홈이 `'use client'`이며 `posts.ts`(약 475KB, 본문 전문 포함)를 통째로 임포트한다(`app/page.tsx:1-5`). [제안] 빌드 타임에 메타+발췌만 담은 index를 분리 생성해 클라이언트 번들에서 본문을 제거한다. 컷오버 전 필수는 아니고 2단계 과제 |
| 보안 | high 4건(Next/PostCSS/sharp/nanoid 계열) 패치를 0단계에서 처리 | 이관 중 의존성 변경과 섞이면 원인 분리 곤란 |
| 인터뷰 폰트 | [관찰] Pretendard/IBM Plex Mono를 CDN @import로 로드(`styles.css:1-2`). [제안] 당장 유지, 2단계에서 self-host 검토 |

---

## I. SEO, 리다이렉트, 도메인 이전

### 현재 상태 [관찰]
- rabbitcrypt: `app/layout.tsx:49-64`에 전역 metadata만 있고 metadataBase, canonical, 포스트별 generateMetadata, sitemap, RSS, robots가 없다(제공된 소스 범위 기준).
- 랴오헝: canonical/OG/Twitter 카드가 완비되어 있으나 전부 구 vercel.app URL을 가리킨다(`index.html:9-26`).

### 작업 [제안]
1. `metadataBase: new URL('https://carrotcave.com')` 설정, 사이트 제목/설명을 CARROT CAVE로 교체.
2. `app/posts/[slug]/page.tsx`에 `generateMetadata` 추가: 제목, summary, canonical `/posts/<slug>`, OG(첫 mediaUrl 또는 브랜드 기본 카드).
3. `app/sitemap.ts`: `/`, 5개 편집 축 인덱스, 모든 `/interviews/<slug>`, 82개 기존 포스트. `app/robots.ts` 추가.
4. `app/rss.xml/route.ts`: 기존 Post와 Interview 메타를 발행일 순으로 합쳐 모든 편집 축의 새 발행물을 포함.
5. `app/interviews/[slug]/page.tsx`에서 인터뷰별 canonical/OG를 생성. 랴오헝 OG 이미지는 검증 완료된 자산을 유지하고 후속 인터뷰도 같은 social-card 규격을 쓴다.
6. 리다이렉트는 D절 맵대로. 구 인터뷰 프로젝트는 콘텐츠를 지우지 말고 redirect 전용 `vercel.json`만 남긴 배포로 교체한다(검색엔진이 301을 소화할 시간 확보, 최소 12개월 유지).
7. 접근성: 인터뷰의 skip-link/focus/inert 규율을 CARROT CAVE 전역 계약으로 승격하고 모든 편집 축 인덱스와 기존 저작 상세에 문맥 alt, 키보드 포커스, reduced-motion을 적용.
8. 분석: 현재 소스에서 analytics 미확인. Vercel Analytics를 기본값으로 제안(M절).

---

## J. 단계별 구현 계획과 검증 기준

### 0단계: 기반 정비 (컷오버 리스크 제거)
- 의존성 high 4건 패치, `npm run build` 재통과.
- posts.ts의 82개 객체 필수 필드와 고유 slug 검증, 텔레그램 채널을 `@carrotcave`로 정렬.
- **AC:** `npm audit`에서 high 0건, build 통과, auto-sync 소스 파서와 82개 Post 필수 필드 검증 통과. 현재 스크립트에는 dry-run 옵션이 없으므로 계획 단계에서 존재하지 않는 `--dry-run`을 가정하거나 실전 동기화를 실행하지 않는다.

### 1단계: 공통 인터뷰 포맷과 랴오헝 이관 (preview)
- `app/interviews/[slug]/` 공통 리더, Interview manifest·bundle 스키마, 인터뷰 인덱스를 만들고 랴오헝을 첫 데이터 인스턴스로 이관한다.
- 실제 후속 인터뷰를 요구하지 않는 최소 fixture로 두 번째 slug에서도 인물·장·topic·전사·OG가 데이터 기반으로 바뀌는지 검증한다.
- **AC:** preview의 `/interviews/liao-heng#topic-35`가 해당 marker로 이동하고 기존 Playwright 32건이 통과한다. 고정 헤더 테스트는 3회 반복한다. 랴오헝 8,142 segment·35 topic·634문단·24 key sentence를 보존하고, fixture slug에는 랴오헝 고유 문자열이 노출되지 않으며 390/1280px overflow가 없다.

### 2단계: 전역 디자인 시스템과 5개 편집 축
- 랴오헝의 graphite·Pretendard·mono·기능색·구분선·focus 규칙을 전역 토큰과 공통 컴포넌트로 추출한다.
- 홈과 탐험·빌딩·낙서·소설·인터뷰 인덱스를 동등한 위계로 만들고 기존 저작 상세도 같은 디자인 시스템으로 덮는다.
- **AC:** 홈과 전역 메뉴에서 5개 축의 시각 위계가 동일하고, 각 축 인덱스에 직접 접근할 수 있다. 기존 82편과 모든 인터뷰 slug가 200을 반환하고 390/1280px에서 overflow가 없으며 build가 통과한다.

### 3단계: SEO 인프라
- I절 1-5번 작업.
- **AC:** sitemap에 홈, 5개 축, 기존 82편, 모든 인터뷰가 중복 없이 포함된다. 임의 기존 글 3편과 인터뷰 2편 또는 fixture의 canonical/OG를 확인하고 통합 RSS 유효성 검사를 통과한다.

### 4단계: 도메인 컷오버
- `carrotcave.com`을 Vercel 프로젝트에 primary로 연결, `rabbitcrypt.com` 리다이렉트 전환, 구 인터뷰 프로젝트를 redirect 전용으로 교체.
- **AC:** `curl -I`로 3종 리다이렉트(rabbitcrypt.com 루트, rabbitcrypt.com/posts/<실제 slug>, 구 vercel.app) 모두 301 + 올바른 Location, 브라우저에서 `구URL#topic-20` 진입 시 새 도메인에서 topic-20 위치 도달, auto-sync 1회 실전 실행이 새 도메인 배포로 정상 반영.

### 5단계: 사후 (컷오버 후 별도 트랙)
- 홈 번들 다이어트(H절), Search Console 이전 신고 및 색인 모니터링 2주, 실제 두 번째 인터뷰 입력 과정에서 manifest 작성 경험을 점검한다.
- **AC:** Lighthouse 성능 개선 확인, 색인 유실 경보 없음.

---

## K. 비목표와 확장 트리거

| 지금 만들지 않는 것 | 확장 트리거 |
|---|---|
| 인터뷰별 CMS/웹 편집기 | manifest와 정적 bundle로 3편 이상 발행해 반복 수작업 병목이 확인될 때 |
| Topics(주제) 통합 축과 축간 교차 검색 | 여러 편집 축 사이에 동일 주제 탐색 수요와 실제 딥링크 인용이 누적될 때 |
| 댓글, 뉴스레터, 멤버십 | 브랜드 통합과 무관, 별도 제품 결정 사안 |
| 영문판 i18n | 영문 태그라인은 있으나 콘텐츠 수요 확인 전까지 보류 |
| 축별 별도 색상 테마 | 만들지 않음. 모든 축은 인터뷰 기반 CARROT CAVE 전역 디자인 시스템을 사용 |

---

## L. 리스크 레지스터

| # | 리스크 | 예방책 |
|---|---|---|
| 1 | **해시 딥링크 유실.** 상대 경로 fetch와 trailing slash 문제로 리더가 조용히 깨지거나, 리다이렉트에서 프래그먼트가 떨어져 나감 | 1단계 AC에 `#topic-35` 실제 스크롤 검증 포함, 컷오버 AC에 구URL+해시 브라우저 실검증 포함, fetch 경로를 절대 경로로 수정 |
| 2 | **공통 템플릿 추출 중 랴오헝 회귀.** 인물별 하드코딩 제거가 32건 테스트 계약과 기존 딥링크를 흔듦 | 공통 계약 테스트와 랴오헝 보존 테스트를 분리하고, fixture로 다른 slug의 데이터 독립성을 검증하며 고정 헤더 테스트는 3회 반복 |
| 3 | **auto-sync 파손.** posts.ts를 정규식으로 편집하는 파이프라인이 스키마/브랜딩 변경과 충돌하거나, 채널 핸들 불일치로 잘못된 소스를 긁음 | 스키마 동결(G절), 채널을 `@carrotcave`로 정렬, 별도 fixture 기반 파서 회귀 검사를 추가한 뒤 4단계 AC에서만 실전 sync 1회 수행 |
| 4 | **전역 적용 중 검증된 가독성 훼손.** 인터뷰 토큰을 새로 꾸미면서 동시에 다른 축에 적용하면 기준점이 사라짐 | 인터뷰 토큰 값은 기준으로 동결하고 홈·인덱스·상세에 순차 확장하며 기존 대비 수치를 전역 테스트 계약으로 이전 |
| 5 | **SEO 색인 하락.** canonical 부재 상태에서 도메인을 옮겨 신구 URL이 중복 색인되거나 랴오헝 페이지의 기존 색인이 증발 | 3단계(SEO 인프라)를 4단계(컷오버)보다 반드시 선행, 301 최소 12개월 유지, Search Console 주소 변경 신고, 2주 모니터링 |

---

## M. 결정이 필요한 항목

기본값으로 진행 가능한 것(별도 결정 불필요):
- 탐험·빌딩·낙서·소설·인터뷰를 동등한 1차 축으로 구성, 기존 저작 URL `/posts/` 유지, 인터뷰는 `/interviews/<slug>` 공통 포맷 사용, 랴오헝 graphite 디자인을 전역 기준으로 적용, 기존 auto-sync 모델과 처리 로직 유지, 리다이렉트 최소 12개월 유지.

실제 결정이 필요한 것 1가지:

1. **기존 저작의 Telegram 반응·AI 연관도 표기 존치.** 편집물 톤과 `❤ 57`, `AI가 분석한 연관도` 표기의 긴장이 있다. 기본값은 유지하되 SOURCE NOTE 안으로 격하해 본문과 분리한다.