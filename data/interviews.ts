export interface InterviewArchive {
  slug: string;
  name: string;
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
    slug: 'tibo-ai-wave',
    name: '티보',
    eyebrow: 'OPENAI / PERSONAL AGENTS / AI SYSTEMS',
    title: '모두가 보기 전에 다음 AI 파도를 이해하는 법',
    summary: '티보는 개인 에이전트, 음성 인터페이스, 초고속 추론과 자기개선을 통해 AI의 다음 파도가 사람의 흐름에 맞춰지는 방식으로 온다고 말한다.',
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
    eyebrow: 'STARTUP SCHOOL / AI / FOUNDERS',
    title: '지금보다 창업하기 좋은 때는 없다',
    summary: 'AI 에이전트 시대 창업과 통념을 깬 확신, 안전·권력 분산, 자유로운 미래를 샘 올트먼과 개리 탄이 논한다.',
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
    eyebrow: 'SEMICONDUCTOR / AI SYSTEMS',
    title: '반도체 연구자의 필드 노트',
    summary: '랴오헝은 화웨이 어센드 개발사를 통해 AI 반도체 경쟁의 승부처가 단일 칩이 아닌 공급망·소프트웨어·생태계까지 경제적으로 순환하는 전층 공동설계라고 주장한다.',
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
    eyebrow: 'DEEPSEEK / PRIVATE MEETING / AGI',
    title: 'AGI를 향한 절제',
    summary: '량원펑은 오픈소스와 합리적 이윤의 절제가 단기 상업화보다 지속학습의 AGI 성공률을 높인다고 주장한다.',
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
    eyebrow: 'KIMI / AGENTIC LLM / AGI',
    title: '무한의 시작에 서서',
    summary: '양즈린은 K2 강화학습과 범용 에이전트 전략을 짚고, AI를 문제 해결로 지식과 문명의 경계를 넓히는 증폭기로 본다.',
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
