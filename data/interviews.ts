export interface InterviewArchive {
  slug: string;
  name: string;
  /** English name for English-only surfaces (share cards). */
  nameEn?: string;
  eyebrow: string;
  title: string;
  summary: string;
  description: string;
  /** Publication date of sourceUrl, not the date the interview occurred. */
  sourcePublishedAt: string;
  thumbnailUrl?: string;
  sourceUrl: string;
  duration: string;
  chapters: number;
  segments: number;
  embedPath: string;
  status: 'published' | 'draft';
}

export const interviews: InterviewArchive[] = [
  {
    slug: 'jk-entertech-forum-ai',
    name: '김종윤·최혁재·김서준',
    nameEn: 'Jongyoon Kim, Hyukjae Choi & Simon Kim',
    eyebrow: 'JAPAN–KOREA ENTERTECH FORUM / AI / IP',
    title: 'AI는 콘텐츠의 주인을 바꾼다',
    summary: 'AI가 콘텐츠의 주도권을 유저에게 넘기고 제작비를 낮추는 가운데 IP의 가치와 한일 협업이 어디로 향하는지 논의한다.',
    description: '2026년 10월 23일 도쿄 시부야 한일 엔터테크 포럼 세션 1 「엔터테인먼트 산업에서의 AI 진화상」 패널을 7개 장, 23개 주제, 44개 발화로 정리한 기록입니다. 사회는 성호철 조선일보 도쿄지국장이 맡았습니다.',
    sourcePublishedAt: '2026-10-23', // Panel date; no public recording URL.
    thumbnailUrl: '/voices/jk-entertech-forum-ai/session1-stage.jpg',
    sourceUrl: 'https://jk-entertech-panel.vercel.app/',
    duration: '7개 장',
    chapters: 7,
    segments: 44,
    embedPath: '/voices/jk-entertech-forum-ai/index.html',
    status: 'published',
  },
  {
    slug: 'zuckerberg-wang-muse-wonder',
    name: '마크 저커버그·알렉산더 왕',
    nameEn: 'Mark Zuckerberg & Alexandr Wang',
    eyebrow: 'CHEEKY PINT / AI / AGENTS',
    title: '뮤즈 원더, 1,000억 달러짜리 AI 베팅',
    summary: '개인 에이전트가 일을 대신하면 모델의 행동이 제품을 가르고, 구매를 맡는 방식과 기기, 개발비를 버는 구조까지 바뀐다고 말한다.',
    description: 'Cheeky Pint에서 존 콜리슨이 마크 저커버그, 알렉산더 왕과 나눈 뮤즈 원더 대담. 2시간 14분 대화 전체(발언 667개)를 한국어로 옮기고 12개 장으로 나눴습니다.',
    sourcePublishedAt: '2026-10-12', // Official YouTube upload_date, verified with yt-dlp.
    thumbnailUrl: '/voices/zuckerberg-wang-muse-wonder/assets/muse-wonder.jpg',
    sourceUrl: 'https://www.youtube.com/watch?v=XfdIhd1g6EI',
    duration: '2:14:31',
    chapters: 12,
    segments: 23,
    embedPath: '/voices/zuckerberg-wang-muse-wonder/index.html',
    status: 'published',
  },
  {
    slug: 'mark-zuckerberg-muse',
    name: '마크 저커버그',
    nameEn: 'Mark Zuckerberg',
    eyebrow: 'META / MUSE / PERSONAL SUPERINTELLIGENCE',
    title: 'Muse, 개인 초지능을 일상의 도구로',
    summary: '활용과 가격, 개인 에이전트의 프라이버시, AI 연구와 안전을 통해 Muse로 개인 초지능을 널리 보급하려는 Meta의 구상을 이야기한다.',
    description: 'Sources Podcast에서 마크 저커버그와 진행자 알렉스 히스가 나눈 대화의 영어 자동자막 전체를 공식 11개 장, 화자 미분리 한국어 번역 264개 문단으로 읽는 리더. 스폰서 구간 포함.',
    sourcePublishedAt: '2026-09-08',
    thumbnailUrl: '/voices/mark-zuckerberg-muse/zuckerberg-muse.jpg',
    sourceUrl: 'https://www.youtube.com/watch?v=Lx8lrn-cytc',
    duration: '1:10:10',
    chapters: 11,
    segments: 264,
    embedPath: '/voices/mark-zuckerberg-muse/index.html',
    status: 'published',
  },
  {
    slug: 'shin-jeongkyu-astra',
    name: '신정규',
    nameEn: 'Jeongkyu Shin',
    eyebrow: 'LABLUP / ASTRA / AI INFRASTRUCTURE',
    title: 'Astra 이후, AI 기업에는 무엇이 남는가',
    summary: '모델 내부의 반복 계산과 추론 하드웨어, 낮아진 개발 비용이 Astra 이후 AI 기업의 해자를 어디로 옮기는지 짚는다.',
    description: '래블업 신정규 대표와 해시드 김서준 대표의 2026년 9월 7일 대담을 7개 장, 188개 발화로 재구성한 대화록입니다. 편집자 보충 문답이 섞여 있고 당사자 검수 전입니다.',
    sourcePublishedAt: '2026-09-07', // Conversation date on the reconstructed source page.
    thumbnailUrl: '/voices/shin-jeongkyu-astra/shin-jeongkyu.jpg',
    sourceUrl: 'https://astra-interview.vercel.app/',
    duration: '7개 장',
    chapters: 7,
    segments: 188,
    embedPath: '/voices/shin-jeongkyu-astra/index.html',
    status: 'published',
  },
  {
    slug: 'masayoshi-son-asi-economy',
    name: '손정의',
    nameEn: 'Masayoshi Son',
    eyebrow: 'SOFTBANK WORLD 2026 / ASI ECONOMY / AI INFRASTRUCTURE',
    title: '2040년 ASI Economy를 먼저 준비하는 법',
    summary: 'AI 에이전트와 휴머노이드가 2040년에 만드는 경제, 전력과 연산 인프라, 그리고 Return on AI라는 새로운 경영 지표를 이야기한다.',
    description: 'SoftBank World 2026 손정의 특별강연을 8개 장과 문단별 타임코드로 정리한 한국어 번역 리더.',
    sourcePublishedAt: '2026-09-01', // Official YouTube upload_date, verified with yt-dlp.
    thumbnailUrl: '/voices/masayoshi-son-asi-economy/son-asi-economy.jpg',
    sourceUrl: 'https://www.youtube.com/watch?v=dTO-tYqZOZg',
    duration: '1:06:15',
    chapters: 8,
    segments: 484,
    embedPath: '/voices/masayoshi-son-asi-economy/index.html',
    status: 'published',
  },
  {
    slug: 'tibo-ai-wave',
    name: '티보',
    nameEn: 'Tibo',
    eyebrow: 'OPENAI / PERSONAL AGENTS / AI SYSTEMS',
    title: '모두가 보기 전에 다음 AI 파도를 이해하는 법',
    summary: '개인 에이전트, 음성 인터페이스, 초고속 추론과 자기개선을 통해 AI의 다음 파도가 사람의 흐름에 맞춰지는 방식으로 온다고 말한다.',
    description: 'Matthew Berman이 OpenAI의 티보와 Google · DeepMind 시절의 교훈, 개인 에이전트, Codex, 초고속 추론과 자기개선을 논한 인터뷰의 전체 한국어 번역 리더.',
    sourcePublishedAt: '2026-08-24',
    thumbnailUrl: '/voices/tibo-ai-wave/tibo-interview.jpg',
    sourceUrl: 'https://www.youtube.com/watch?v=4qjEgPojjzM',
    duration: '44:28',
    chapters: 7,
    segments: 142,
    embedPath: '/voices/tibo-ai-wave/index.html',
    status: 'published',
  },
  {
    slug: 'sam-altman-startup-school-2026',
    name: '샘 올트먼',
    nameEn: 'Sam Altman',
    eyebrow: 'STARTUP SCHOOL / AI / FOUNDERS',
    title: '지금보다 창업하기 좋은 때는 없다',
    summary: '개리 탄과 함께 AI 에이전트 시대의 창업, 통념을 깬 확신, 안전과 권력 분산, 자유로운 미래를 논한다.',
    description: 'Startup School 2026에서 샘 올트먼과 개리 탄이 나눈 공식 Y Combinator 대담의 전체 한국어 번역 리더.',
    sourcePublishedAt: '2026-07-28',
    thumbnailUrl: '/voices/sam-altman-startup-school-2026/assets/sam-altman-startup-school.jpg',
    sourceUrl: 'https://www.youtube.com/watch?v=ZIaOBAjvc38',
    duration: '38:59',
    chapters: 7,
    segments: 99,
    embedPath: '/voices/sam-altman-startup-school-2026/index.html',
    status: 'published',
  },
  {
    slug: 'liao-heng',
    name: '랴오헝',
    nameEn: 'Liao Heng',
    eyebrow: 'SEMICONDUCTOR / AI SYSTEMS',
    title: '반도체 연구자의 필드 노트',
    summary: '화웨이 어센드 개발사를 통해 AI 반도체 경쟁의 승부처가 단일 칩이 아닌 공급망·소프트웨어·생태계까지 경제적으로 순환하는 전층 공동설계라고 주장한다.',
    description: '화웨이 반도체 수석과학자 랴오헝의 공개 인터뷰를 7개 장, 35개 중요 지점, 전체 한국어 번역 전사로 다시 읽기 좋게 정리했습니다.',
    sourcePublishedAt: '2026-07-25', // Bilibili API: pubdate for sourceUrl.
    thumbnailUrl: '/voices/liao-heng/assets/liao-heng-portrait.webp',
    sourceUrl: 'https://www.bilibili.com/video/BV1nB3u6tERu/',
    duration: '4:37:51',
    chapters: 7,
    segments: 8142,
    embedPath: '/voices/liao-heng/index.html',
    status: 'published',
  },
  {
    slug: 'liang-wenfeng',
    name: '량원펑',
    nameEn: 'Liang Wenfeng',
    eyebrow: 'DEEPSEEK / PRIVATE MEETING / AGI',
    title: 'AGI를 향한 절제',
    summary: '오픈소스와 합리적 이윤의 절제가 단기 상업화보다 지속학습의 AGI 성공률을 높인다고 주장한다.',
    description: '화자 미분리 유출 ASR 자료의 447개 문단을 원문 말투와 반복에 가깝게 옮긴 한국어 최소 편집 대화록입니다.',
    sourcePublishedAt: '2026-07-27', // Zaobao report publication date for sourceUrl.
    thumbnailUrl: '/voices/liang-wenfeng/assets/liang-wenfeng-portrait.webp',
    sourceUrl: 'https://www.zaobao.com.sg/news/china/story20260727-9427115',
    duration: '19개 구간',
    chapters: 5,
    segments: 447,
    embedPath: '/voices/liang-wenfeng/index.html',
    status: 'published',
  },
  {
    slug: 'yang-zhilin',
    name: '양즈린',
    nameEn: 'Yang Zhilin',
    eyebrow: 'KIMI / AGENTIC LLM / AGI',
    title: '무한의 시작에 서서',
    summary: 'K2 강화학습과 범용 에이전트 전략을 짚고, AI를 문제 해결로 지식과 문명의 경계를 넓히는 증폭기로 본다.',
    description: 'Moonshot AI와 Kimi 창업자 양즈린이 K2, Agentic LLM, 강화학습, 제품과 조직을 논한 100분 대화의 전체 한국어 번역 전사입니다.',
    sourcePublishedAt: '2025-08-27', // YouTube: uploadDate for sourceUrl.
    thumbnailUrl: '/voices/yang-zhilin/assets/yang-zhilin-portrait.jpg',
    sourceUrl: 'https://www.youtube.com/watch?v=ouG6jrkECrc',
    duration: '1:40:59',
    chapters: 6,
    segments: 2531,
    embedPath: '/voices/yang-zhilin/index.html',
    status: 'published',
  },
];

export function getInterview(slug: string) {
  return interviews.find((interview) => interview.slug === slug);
}
