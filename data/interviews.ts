export interface InterviewArchive {
  slug: string;
  name: string;
  eyebrow: string;
  title: string;
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
    slug: 'liao-heng',
    name: '랴오헝',
    eyebrow: 'SEMICONDUCTOR / AI SYSTEMS',
    title: '반도체 연구자의 필드 노트',
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
