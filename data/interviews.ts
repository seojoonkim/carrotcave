export interface InterviewArchive {
  slug: string;
  name: string;
  eyebrow: string;
  title: string;
  description: string;
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
    thumbnailUrl: '/voices/liao-heng/assets/liao-heng-portrait.webp',
    sourceUrl: 'https://www.bilibili.com/video/BV1nB3u6tERu/',
    duration: '4:37:51',
    chapters: 7,
    segments: 8142,
    embedPath: '/voices/liao-heng/index.html',
    status: 'published',
  },
];

export function getInterview(slug: string) {
  return interviews.find((interview) => interview.slug === slug);
}
