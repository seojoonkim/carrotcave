# 사유의 성좌 온톨로지 그래프 Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** 모든 일반 글 상세 하단의 `생각의 진화 타임라인`, `연관 글`, 기존 점수형 `지식 그래프`를 제거하고, 의미 관계와 원문 근거를 직접 탐색하는 하나의 가시적 온톨로지 그래프인 **사유의 성좌 / CAVE CONSTELLATION**로 교체한다.

**Architecture:** 109개 글을 정적 온톨로지 주석과 승인된 방향성 edge로 모델링한다. 각 글 페이지에는 현재 글을 중심으로 한 bounded 1-hop/2-hop subgraph만 전달하고, SVG 기반의 결정론적 극좌표 레이아웃으로 렌더링한다. 노드와 광맥을 선택하면 관계 유형, 양쪽 원문 근거, 다음 글이 함께 드러난다. 그래프 DB, 런타임 AI, 무작위 force simulation은 사용하지 않는다.

**Tech Stack:** Next.js App Router, React client island, TypeScript, SVG, existing global CSS, static JSON, Node.js audit scripts.

---

## 1. 제품 결정

### 1.1 없애는 범위

다음 네 표현을 하나의 그래프로 통합한다.

1. 첫 태그가 같은 글을 날짜순으로 놓는 `생각의 진화 타임라인`
2. 제목·요약·AI 유사도 퍼센트를 나열하는 `연관 글`
3. 동일한 유사도 데이터를 다시 그리는 기존 D3 `지식 그래프`
4. 현재 미사용 상태지만 `연관 글` 문구를 가진 `RelatedPopover`

새 화면에는 별도 추천 카드, 다음 글 리스트, 날짜 타임라인을 두지 않는다. **그래프 자체가 유일한 다음 읽기 인터페이스**다.

### 1.2 현재 문제

- 일반 글 109개 중 기존 `relations.json`의 출발 글은 17개뿐이다.
- 기존 edge 85개는 `slug + score`만 있어 방향, 의미, 근거가 없다.
- 태그 보유 글은 74개, `relatedSlugs` 보유 글은 35개뿐이다.
- 날짜가 가깝거나 키워드가 비슷한 것을 생각의 진화처럼 보여준다.
- 기존 force graph는 위치가 매번 바뀌고, 제목이 잘리며, 관계 이유가 보이지 않는다.
- 연관 카드와 그래프가 같은 추천을 두 번 표현한다.

### 1.3 새로운 질문

`이 글과 비슷한 글은 무엇인가?`가 아니라 다음을 묻는다.

> 이 생각은 어디에서 더 깊어지고, 깨지고, 현실이 되고, 다른 세계로 번지는가?

---

## 2. 중심 경험: 사유의 성좌 / CAVE CONSTELLATION

### 2.1 기억에 남아야 할 장면

본문이 끝나면 graphite 바탕이 조금 더 깊어진다. 현재 글은 동굴 중앙의 **발광 핵**으로 놓이고, 직접 연결된 글은 첫 번째 석회환, 그 너머 글은 두 번째 석회환에 결정체처럼 나타난다.

연결선은 일반적인 네트워크 선이 아니라 암벽 안에서 발견되는 **광맥**이다. 광맥마다 의미가 있다.

- **더 깊어짐** `DEEPENS`
- **균열을 냄** `CHALLENGES`
- **현실이 됨** `APPLIES`
- **다른 세계로 옮김** `REFRAMES`
- **멀리 공명함** `RESONATES`

노드를 선택하면 관련 선만 살아나고 나머지는 어둡게 물러난다. 광맥을 선택하면 양쪽 글에서 실제로 가져온 문장과 관계 설명이 암벽의 균열처럼 열린다.

예:

> **현실이 됨**
>
> “사람마다 다르게 자란 에이전트 계보”라는 생각이
> 기억 시스템의 구현과 검증으로 이어진다.

추천 퍼센트, 공유 태그 목록, 자동 생성 요약은 독자 화면에 표시하지 않는다.

### 2.2 화면 구성

1. Eyebrow: `CAVE CONSTELLATION`
2. 제목: `이 글이 닿아 있는 동굴`
3. 설명: `광맥을 눌러 생각 사이의 근거를 읽어보세요.`
4. 항상 펼쳐진 온톨로지 그래프
5. 선택한 edge의 관계 증명 패널
6. 접근성용 `관계를 목록으로 보기` 전환

그래프는 접힌 버튼이나 장식 배경 뒤에 숨기지 않는다.

---

## 3. 가시적 그래프의 공간 문법

### 3.1 force graph를 사용하지 않는다

위치는 물리 시뮬레이션이 아니라 데이터로 결정한다.

- 원점: 현재 글
- 반지름: hop 거리
- 각도: 네 편집 축
- 같은 축 안의 슬롯: edge 중요도와 제목 충돌 규칙
- 미세 보정: 사전에 정의된 `±8°`, `±14px` 슬롯만 허용

새로고침해도 같은 글의 같은 관계는 같은 위치에 있어야 한다.

### 3.2 네 편집 축의 방향

일반 글의 실제 네 축만 사용한다.

- `🐇 탐험`: 북동
- `🛠️ 빌딩`: 남동
- `✍️ 낙서`: 남서
- `📖 소설`: 북서

`목소리`는 `data/interviews.ts`와 `/voices/[slug]`의 별도 콘텐츠 타입이므로 v1 그래프 대상에서 제외한다. 추후 typed target과 전사 단위 온톨로지를 정의한 뒤 파동형 노드로 편입할 수 있다.

각 축은 색만으로 구별하지 않고 고유 방향, 작은 문양, 광맥 dash pattern을 함께 사용한다.

### 3.3 노드와 hop

- 중앙 현재 글: 1개
- 1-hop: 현재 글과 승인된 직접 edge
- 2-hop: 선택된 1-hop을 통해 도달하는 승인 edge
- 2-hop끼리의 횡단선은 기본 상태에서 숨김
- 한 쌍에 관계 근거가 여러 개면 선을 겹치지 않고 하나의 edge에 합성

표시 상한:

- 모바일: 중앙 1 + 1-hop 최대 6 + 2-hop 최대 6, 총 13개
- 데스크톱: 중앙 1 + 1-hop 최대 8 + 2-hop 최대 12, 총 21개
- 모바일 동시 가시 edge 최대 16
- 데스크톱 동시 가시 edge 최대 28

숫자를 채우기 위해 약한 관계를 노출하지 않는다.

### 3.4 모바일 지오메트리

390px 기준:

- 그래프는 본문 좌우 여백을 넘어 viewport 폭까지 bleed
- 높이: `clamp(580px, 74svh, 680px)`
- 원점: `50% 44%`
- 중앙 핵: 68px, hit area 72px
- 1-hop 반지름: 108px
- 2-hop 반지름: 164px
- 1-hop 핵: 18px, hit area 최소 46px
- 2-hop 핵: 10px, hit area 최소 44px
- 1-hop 제목은 최대 2줄, `word-break: keep-all`
- 2-hop 제목은 기본적으로 축 문양과 짧은 식별자만 표시하고 선택 시 전체 제목 노출

모바일은 첫 탭에서 선택·관계 강조, 두 번째 탭 또는 `이 글로 들어가기` 버튼에서 이동한다. 무심코 노드를 눌렀다가 페이지가 바뀌지 않게 한다.

그래프 상단 내부에는 52px 정보 스트립을 둔다.

- 기본: `별을 눌러 관계를 읽어보세요.`
- 선택: 전체 제목, 관계 동사, hop 표시

### 3.5 데스크톱 지오메트리

1024px 이상:

- 최대 폭: 1180px
- 높이: 720px
- 중앙 핵: 84px
- 1-hop 반지름: 190px
- 2-hop 반지름: 300px
- 카테고리 표식 반지름: 344px
- 오른쪽 약 210px는 선택 관계의 증명 패널이 열리는 어두운 암벽 영역

그래프 canvas와 증명 패널은 하나의 시각적 표면 안에 있으며 카드 두 칸처럼 보이면 안 된다.

### 3.6 라벨 충돌 규칙

1. 슬롯별 label 방향 사용
2. label 방향 전환
3. label 폭 축소
4. 2줄 말줄임
5. 2-hop 기본 label 숨김
6. 마지막에만 정해진 각도·반지름 보정

무작위 collision force는 금지한다.

---

## 4. 시각 언어와 애니메이션

### 4.1 동굴이지 우주 화면이 아니다

검은 배경, 별, 네온 선만 사용하면 흔한 constellation UI가 된다. CARROT CAVE의 고유성은 다음으로 만든다.

- 완전한 원이 아닌 불연속 석회환
- 지층처럼 갈라진 네 축
- 노드 안의 광물 문양
- 선 중간에 박힌 관계 증거 마디
- 암벽 안에서 광맥이 발견되는 stroke animation
- 낮은 대비의 흑연 결, 화면 가장자리의 희미한 동굴 윤곽

입자 폭풍, 계속 떠다니는 먼지, 네온 보라 gradient, 무한 pulse는 사용하지 않는다.

### 4.2 색

- 85% 이상: graphite, paper, 은회색
- 현재 핵과 선택 edge: CARROT CAVE amber
- 네 축의 포인트색: 저채도 광물색
- 텍스트에는 glow 금지
- edge type은 색뿐 아니라 dash pattern과 관계 동사로 구별

### 4.3 최초 진입 안무

그래프가 viewport 35% 이상 들어왔을 때 한 번만 실행한다. 전체 약 1.4초.

1. `0~180ms`: 중앙 핵이 어둠 속에서 밝아짐
2. `140~520ms`: 네 지층 축이 중앙에서 바깥으로 새겨짐
3. `300~820ms`: 1-hop 광맥이 중요도 순으로 퍼지고 끝에서 결정체가 켜짐
4. `660~1180ms`: 대표 1-hop에서 2-hop 광맥이 이어짐
5. `1050~1400ms`: 불완전 석회환과 축 표식이 낮은 명도로 나타남

뒤로 가기나 같은 세션 재방문은 300ms 이하의 짧은 fade만 사용한다.

### 4.4 상호작용 안무

Hover/focus, 160ms:

- 노드 핵 1 → 1.15
- 중앙부터 선택 노드까지 광맥이 한 번 밝아짐
- 나머지 노드는 위치를 바꾸지 않고 opacity만 낮춤

Selection, 240ms:

- 선택 노드 주위에 210°의 불완전 원호
- 관계 증거 마디가 선 위에서 켜짐
- 증명 패널이 clip-path로 암벽 균열처럼 열림
- 선택한 1-hop의 2-hop만 명확해지고 다른 2-hop은 어두워짐

Navigation, 320ms:

- 선택 노드 후광이 넓어진 뒤 route 전환
- 다음 글에서는 선택한 글이 중앙 핵이 되고 성좌가 재구성됨
- 화면 전체 zoom이나 멀미를 유발하는 pan은 사용하지 않음

반복 애니메이션은 현재 핵 후광의 8초 opacity 호흡 하나만 허용하며, tab 비활성 또는 reduced-motion에서는 중지한다.

---

## 5. 온톨로지 모델

### 5.1 포스트 주석

**Create:** `data/ontology/posts.json`

각 글은 다음을 가진다.

- primary topics 1~2
- secondary topics 최대 4
- questions 최대 2
- 중심 claims 1~3
- entities
- methods
- motifs 최대 3
- reader prerequisites/outcomes
- review status

```json
{
  "post-189": {
    "primaryTopics": ["agent-memory"],
    "secondaryTopics": ["knowledge-graph", "evaluation"],
    "questions": ["when-memory-becomes-action"],
    "claims": [
      {
        "id": "post-189-c1",
        "text": "기억이 행동 근거가 되는 순간 기억 시스템은 권한 시스템이기도 하다.",
        "stance": "asserts",
        "evidence": "본문에서 실제로 확인되는 구절"
      }
    ],
    "methods": ["implementation-log", "failure-analysis"],
    "motifs": ["memory", "provenance"],
    "reviewStatus": "approved"
  }
}
```

### 5.2 통제 어휘

**Create:** `data/ontology/vocabulary.json`

v1 목표:

- topics 20~35
- questions 25~50
- motifs 10~20
- methods 약 10
- 최대 2단계 계층
- 각 항목: id, 한국어 label, aliases, optional parent, status

편집 축은 topic 계층이 아니라 별도 lens로 유지한다.

### 5.3 방향성 edge

**Create:** `data/ontology/edges.json`

```json
[
  {
    "from": "post-191",
    "to": "post-189",
    "type": "APPLIES",
    "strength": 0.92,
    "sourceClaimId": "post-191-c1",
    "sourceEvidence": "출발 글의 실제 구절",
    "targetEvidence": "도착 글의 실제 구절",
    "label": "개인별 에이전트 계보가 기억 시스템의 구현과 검증으로 이어진다.",
    "source": "editorial",
    "status": "approved"
  }
]
```

독자에게 노출할 edge는 다섯 종류다.

1. `DEEPENS`: 같은 질문을 더 좁고 깊게 전개
2. `CHALLENGES`: 전제나 결론을 깨거나 중요한 제약을 추가
3. `APPLIES`: 아이디어를 구현·관찰·사례로 구체화
4. `REFRAMES`: 다른 영역·규모·편집 축에서 다시 정의
5. `RESONATES`: 주제는 멀지만 질문·모티프·장면이 강하게 공명

같은 카테고리라는 사실만으로 edge를 만들지 않는다. 날짜는 `후속/수정` 판단의 보조 증거일 뿐 추천 점수가 아니다.

### 5.4 원문 근거 정규화

raw `content.includes(evidence)`를 사용하지 않는다.

**Create:** `lib/content/normalize-readable-text.ts`

공통 normalizer:

1. NFC 정규화
2. 기존 trailing reaction signature 제거
3. 기존 leading duplicate title 제거
4. `“ ” ‘ ’`를 straight quote로 fold
5. 연속 whitespace를 한 칸으로 collapse
6. trim

`draft-ontology`, `audit-ontology`, test가 정확히 같은 함수를 사용한다. 기존 페이지 안의 strip helper는 이 lib로 이동해 renderer도 공유한다.

### 5.5 override

**Create:** `data/ontology/overrides.json`

- `pin`: 특정 글의 기본 1-hop 고정
- `block`: 잘못된 쌍 제외
- `forceEdge`: 자동 후보 밖의 편집 연결
- `labelOverride`: 독자용 문장 수정
- `deprecate`: 기록은 남기고 노출 중단

---

## 6. bounded subgraph 결정

### 6.1 후보 생성과 승인을 분리한다

자동 모델, BM25, 임베딩, 기존 tags, `relatedSlugs`, legacy `relations.json`은 후보 생성에만 사용한다. 독자 화면에는 승인 edge만 노출한다.

후보 신호:

- 같은 질문
- claim의 보완·반박
- outcome → prerequisite 연결
- 같은 series 또는 명시적 후속
- 공유 primary/secondary topic
- 공유 entity
- 공유 motif
- BM25
- 한국어 embedding
- 기존 수동·AI 관계

최소 두 신호가 일치하거나 편집자가 직접 승인해야 한다.

### 6.2 1-hop 선택

우선순위:

1. pin
2. 승인 edge strength
3. 양쪽 evidence 직접성
4. edge type 다양성
5. 다른 편집 축으로 건너가는 가치
6. 허브 과집중 방지

모바일 최대 6, 데스크톱 최대 8.

### 6.3 2-hop 선택

- 선택된 1-hop과 승인 edge가 있음
- 현재 글과 직접 edge가 없거나 약함
- 1-hop을 경유하는 의미가 설명 가능함
- 모바일 1-hop당 최대 1, 데스크톱 일부 1-hop당 최대 2
- UI label에 경유 글과 관계를 명시

예:

> `개인화`를 거쳐 `소유권`으로 이어지는 한 갈래 더 깊은 기록

### 6.4 다양성 제약

- 동일 목적지 중복 0
- 동일 edge type 최대 2개 1-hop
- 동일 primary topic 최대 2개 1-hop
- 같은 편집 축은 전체 표시 노드의 50% 이하, 단 품질 낮은 연결을 채우지 않음
- 가능하면 다른 편집 축 최소 1개
- 소설 3편을 균형 목적으로 반복 노출하지 않음
- 최근 날짜 가산점 없음
- 미승인 edge 노출 0

### 6.5 세션 순환 방지

`sessionStorage`에 최근 읽은 slug 최대 8개를 보관한다.

- 최근 글은 기본 강조에서 제외하되 그래프 문맥에는 낮은 명도로 남길 수 있음
- 대체 edge가 없으면 `방금 지나온 글`로 표시
- 서버 저장과 사용자 계정은 사용하지 않음

---

## 7. 접근성과 성능

### 7.1 SVG와 실제 링크

- 최대 21개 노드에는 SVG가 적합
- 각 기사 노드는 실제 focusable link 또는 button + link semantics
- 장식 석회환과 윤곽은 `aria-hidden="true"`
- edge 선 자체를 screen reader가 해석하게 하지 않고 노드 설명에 관계를 포함
- DOM 순서: 현재 글 → 1-hop 중요도순 → 부모별 2-hop

키보드:

- Tab: 선형 이동
- Arrow: 공간적으로 가까운 노드
- Enter: 이동
- Space: 관계 증명 열기/닫기
- Escape: 선택 해제

### 7.2 동일 데이터의 선형 보기

`관계를 목록으로 보기`를 제공한다. 이는 옛 연관글 카드의 복원이 아니라 같은 graph 데이터를 접근 가능한 텍스트 구조로 표현한 것이다.

- 직접 닿은 기록
- 한 갈래 더 깊은 기록
- 제목, 관계 동사, 근거 문장, 경유 노드

JavaScript 미지원 시 목록이 기본 노출된다.

### 7.3 reduced motion

- stroke drawing, pulse, navigation bloom 제거
- 모든 노드와 edge 즉시 표시
- opacity 전환 80ms 이하
- 정보와 위치는 동일하게 유지

### 7.4 성능 예산

페이지별 graph payload:

- raw 18KB 이하 목표
- gzip 6KB 이하 목표

DOM/SVG:

- 기사 노드 최대 21
- edge path 최대 28
- 전체 SVG element 120 이하
- 그래프 JS gzip 35KB 이하 목표
- first layout 계산 50ms 이하
- selection update 50ms 이하
- resize는 deterministic coordinate 재계산 한 번만 수행
- 각 노드별 blur filter 금지, 현재/선택 핵만 공유 filter 사용

---

## 8. 데이터 구축과 편집 검수

### 8.1 전수 범위

109개 모든 글에 대해:

- 승인된 post annotation
- 승인 outgoing edge 최소 3개
- edge type 최소 2종
- incoming 또는 outgoing이 모두 없는 고립 글 0
- 노출 edge마다 양쪽 원문 evidence와 label

최소 edge 수는 약 327개다. 자동 초안은 가능하지만 승인과 문장 검수는 의미 편집 작업이다.

### 8.2 현실적 일정

- 계약·12개 대표 prototype: 4~6시간
- 109개 annotation 자동 초안과 vocabulary 정규화: 6~10시간
- 327개 이상 edge의 근거·방향·label 승인: 20~40시간
- 그래프 UI, 애니메이션, 접근성: 8~14시간
- 전수 audit, 감수, release: 4~8시간

총 작업량은 **약 4~7일**을 예상한다. 12개 대표 prototype이 의미·시각 검수를 통과한 뒤 전체 109개 편집으로 확장한다.

---

## 9. 파일 구조

### 데이터와 로직

- Create: `data/ontology/posts.json`
- Create: `data/ontology/vocabulary.json`
- Create: `data/ontology/edges.json`
- Create: `data/ontology/overrides.json`
- Create: `data/ontology/index.json`
- Create: `lib/ontology/types.ts`
- Create: `lib/ontology/build-subgraph.ts`
- Create: `lib/content/normalize-readable-text.ts`
- Create: `scripts/draft-ontology.mjs`
- Create: `scripts/build-ontology-index.mjs`
- Create: `scripts/audit-ontology.mjs`

### UI

- Create: `components/CaveConstellation.tsx`
- Create: `components/CaveConstellationGraph.tsx`
- Create: `components/CaveConstellationEvidence.tsx`
- Create: `components/CaveConstellationList.tsx`
- Modify: `app/posts/[slug]/page.tsx`
- Modify: `app/globals.css` using `.cave-constellation-*` prefix

현재 저장소는 CSS Module을 사용하지 않고 `app/globals.css`와 source contract를 사용하므로 새 CSS도 같은 방식을 따른다.

### 제거

- Delete: `components/TimelineView.tsx`
- Delete: `components/KnowledgeGraph.tsx`
- Delete: `components/KnowledgeGraphWrapper.tsx`
- Delete: `components/RelatedPopover.tsx`
- Remove runtime use: `data/relations.json`
- Remove: `getScoreColor`, `sameTagPosts`, `topTag`, `postsMeta`
- Remove: `getRelatedPosts` export if no remaining consumer
- Keep `relatedSlugs` only as ontology candidate provenance, not runtime UI
- Archive legacy relation generator scripts out of runtime path
- Remove `d3`, `@types/d3` only after consumer count is zero

### 평가 snapshot

기존 방식을 삭제하기 전에:

- Create: `docs/eval/legacy-relations-baseline.json`
- Copy current `data/relations.json` for read-only quality comparison
- It must not be imported into the app bundle

### 테스트

- Create: `tests/ontology-contract.test.mjs`
- Create: `tests/cave-constellation-render.test.mjs`
- Modify: `tests/content-contract.test.mjs`
- Modify: `package.json`
- Modify: `scripts/auto-sync.mjs`

---

## 10. 단계별 구현

### Task 1: 레거시 기준 snapshot과 제거 실패 테스트

1. `relations.json`을 `docs/eval/legacy-relations-baseline.json`으로 snapshot
2. 레거시 네 컴포넌트, 문구, percentage UI가 제거되어야 한다는 테스트 작성
3. `CaveConstellation`이 글 상세에 정확히 한 번 존재해야 한다는 테스트 작성
4. 현재 코드에서 FAIL 확인

### Task 2: 12개 대표 글 온톨로지 fixture

대표 집합은 네 축, 세 depth, tag 유무, legacy relation 유무를 포함한다.

1. types와 vocabulary 작성
2. post annotation 작성
3. 승인 edge와 양쪽 evidence 작성
4. common text normalizer 이동·공유
5. invalid slug, self-edge, duplicate, missing evidence, unapproved exposure 테스트
6. source/target evidence가 post-processed body에 실제 존재하는지 검증

### Task 3: 결정론적 subgraph builder

테스트 우선:

- pin/block/deprecated 우선순위
- 1-hop/2-hop 상한
- 동일 목적지 0
- 미승인 0
- edge type/axis 다양성
- 좌표 slot deterministic byte equality
- 모바일 13개, 데스크톱 21개 상한

### Task 4: SVG 시각 prototype

12개 대표 글로 구현한다.

- 390, 520, 900, 1280px
- 현재 핵, 1-hop, 2-hop, 네 축, 불연속 석회환
- 다섯 edge pattern
- 선택 evidence panel
- first tap select, second action navigate
- 44px hit target
- keyboard, list mode, no-JS fallback
- reduced-motion
- label collision fixture

prototype 완료 기준:

- 일반적인 force graph로 보이지 않음
- graph가 첫눈에 보이고 추천 기능임이 이해됨
- 관계를 누르면 이유와 양쪽 원문이 보임
- mobile overflow 0
- text clipping 0
- animation 후 정적 정보가 선명함

### Task 5: 독립 시각·의미 감수 gate

12개 prototype을 exact Opus 5와 controller가 감수한다.

- 의미가 장식보다 먼저 읽히는가
- 동굴/광맥 언어가 CARROT CAVE 고유 문법인가
- mobile에서 node density가 과하지 않은가
- edge pattern이 색 없이 구분되는가
- evidence가 실제 연결을 증명하는가

이 gate가 PASS하기 전 109개 데이터 작업으로 확장하지 않는다.

### Task 6: 109개 annotation 초안

1. 10~15편 batch
2. topic/question/claim/entity/method/motif 후보 생성
3. evidence 없는 claim 폐기
4. vocabulary alias에 우선 병합
5. suggested 상태로 저장
6. primary topic, question, claim 전수 검토

### Task 7: 327개 이상 edge 후보와 승인

1. 질문, claim, reader state, topic, entity, motif, BM25, embedding, legacy 관계로 후보 생성
2. type, direction, label, sourceEvidence, targetEvidence 제안
3. 모든 `CHALLENGES` 전수 검토
4. 모든 label과 양쪽 evidence 검토
5. 글당 outgoing 3개, type 2종 확보
6. 고립 글과 허브 집중 조정
7. 억지 관계는 숫자를 맞추기 위해 승인하지 않음

### Task 8: 레거시 UI와 D3 제거

1. page imports와 score logic 제거
2. 네 legacy component 삭제
3. runtime `relations.json` 제거
4. dead `getRelatedPosts` 제거 여부 확인
5. D3 consumer 0 확인 후 dependencies 제거
6. CaveConstellation 하나만 삽입
7. Task 1 tests PASS

### Task 9: ontology audit를 verify와 auto-sync에 연결

`package.json`:

```text
npm test
npm run audit:post-titles
npm run audit:ontology
npm run build
```

`audit:ontology` invariants:

- 모든 현재 post slug에 approved annotation 존재
- invalid/self/duplicate edge 0
- 미승인 UI edge 0
- normalized evidence mismatch 0
- outgoing approved edge 3개 이상
- edge type 2종 이상
- isolated post 0
- hidden legacy component/string 0
- generated index와 source byte-consistent

현재 `scripts/auto-sync.mjs`는 자체 `verifySync()` 후 바로 commit/push한다. 이를 수정한다.

- 새 글을 `posts.ts`에 반영한 뒤 ontology draft를 생성
- approved annotation/edge가 없는 새 글은 **push를 보류**하고 `ontology_review_required` report를 남김
- 기존 글 reaction만 바뀐 경우 ontology gate를 통과하면 정상 push
- `gitCommitAndPush` 직전에 `npm run audit:ontology` 실행
- audit 실패 시 commit/push 금지

`CaveConstellation`은 방어적으로 ontology entry가 없으면 `null`을 반환하지만, production에 그런 글이 배포되지 않는 것이 정상 계약이다.

### Task 10: 전체 의미 품질 평가

삭제 전 snapshot을 사용해 비교한다.

표본: 축과 depth를 층화한 24개 시작 글.

비교:

1. 최신 글 4개
2. `docs/eval/legacy-relations-baseline.json`
3. 새 온톨로지 1-hop graph

각 edge 0~2점:

- 실제 관련성
- 다음 읽기 가치
- 방향 정확성
- label 정확성
- evidence 충실성
- 화면 내 비중복성

release threshold:

- label/evidence 사실 정확성 100%
- 관련성 평균 1.7/2 이상
- 새 방식이 legacy보다 편집자 선호에서 우세
- blocker 관계 오류 0

### Task 11: 전수 반응형·접근성·성능 QA

- 109개 route 모두 graph 1개
- timeline/related/D3 graph 0
- graph node와 edge 상한 준수
- valid destination 3개 이상
- fetch error 0
- 390, 520, 900, 1280 overflow 0
- 44px hit target
- keyboard complete
- reduced-motion complete
- no-JS list destination 존재
- gzip payload/JS budget 확인
- 2-cycle/3-cycle과 hub concentration report

### Task 12: review와 production release

1. fresh full diff exact Opus 5 review
2. blocker/important 해결
3. Ponytail review-only 기록
4. `npm run verify`
5. commit/push
6. Vercel production deploy
7. live origin 109개 route deterministic audit
8. representative 390/1280 live visual smoke
9. `/Users/gimseojun/.hermes/profiles/sano/scripts/release_closure_gate.py --workdir /Users/gimseojun/projects/rabbitcrypt --remote-ref origin/main`
10. clean worktree, HEAD == origin/main, public URL 보고

---

## 11. 성공 기준

### 의미

- 모든 가시 edge는 관계 동사와 양쪽 원문으로 설명 가능
- 날짜와 유사도 퍼센트가 의미를 대신하지 않음
- 다섯 관계가 서로 실제로 다른 독서 방향을 만듦
- 109개 모두 고립되지 않음

### 시각

- 그래프가 보조 장식이 아니라 유일한 추천 인터페이스
- 일반 force hairball이 아님
- 중앙 핵, 석회환, 네 지층 축, 발광 광맥이 CARROT CAVE만의 장면을 만듦
- 관계 선택이 그래프 자체의 변화를 통해 이해됨
- motion을 꺼도 graph 의미가 완전함

### 운영

- 109개 annotation coverage 100%
- approved outgoing edge 최소 3개
- normalized evidence mismatch 0
- 미승인 edge 노출 0
- auto-sync가 ontology 없는 새 글을 push하지 않음
- graph DB와 runtime AI 없음

---

## 12. 비목표

v1에서 만들지 않는다.

- 109개를 한 화면에 모두 그리는 전역 hairball
- voice interview node
- 사용자 계정 기반 개인화
- 런타임 LLM 추천
- graph/vector DB
- 노드 drag와 force simulation
- 반응 수 기반 ranking
- 자동 생성 edge의 무검수 공개
- 클릭률만 최적화하는 추천

---

## 13. 최종 권고

첫 번째 구현 단위는 109개 전체가 아니라 **12개 대표 글의 완성된 사유의 성좌 prototype**이다. 의미 edge, 결정론적 graph, 광맥 animation, evidence interaction, mobile accessibility를 먼저 완성해 참신함과 실용성을 검증한다.

그 gate가 통과하면 동일한 계약으로 109개 전체를 편집한다. 그래프의 신비로움은 점과 선의 양에서 나오지 않는다. 독자가 한 광맥을 눌렀을 때, 멀리 떨어진 두 문장이 왜 같은 동굴 안에 있었는지를 발견하는 순간에서 나온다.
