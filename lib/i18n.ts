// CarrotCave i18n: Korean lives at the existing URLs, English under /en.
// One dictionary for every UI string so both languages stay in step (tests/i18n.test.mjs checks key parity).
// Client-safe: no post data here (translated bodies live in lib/i18n-content.ts, server only).
import type { Category, DepthLevel } from '@/data/posts';

export type Locale = 'ko' | 'en';
export const LOCALES: Locale[] = ['ko', 'en'];

/** /posts/x → /en/posts/x (en) or unchanged (ko). Accepts paths with a query string. */
export function localePath(locale: Locale, path: string) {
  if (locale === 'ko') return path;
  return path === '/' ? '/en' : `/en${path.startsWith('/') ? path : `/${path}`}`;
}

/** The counterpart URL in the other language (used by the KO/EN toggle and hreflang). */
export function swapLocalePath(path: string): { ko: string; en: string } {
  const ko = path === '/en' ? '/' : path.startsWith('/en/') ? path.slice(3) : path.startsWith('/en?') ? `/${path.slice(3)}` : path;
  return { ko, en: localePath('en', ko) };
}

/** hreflang alternates for Next metadata. */
export function languageAlternates(koPath: string) {
  return { ko: koPath, en: localePath('en', koPath), 'x-default': koPath };
}

// Editorial axes: Korean names stay the canonical data values; English pages use slugs in ?section=.
export const AXIS_EN: Record<Category | '목소리' | '전체', string> = {
  탐험: 'Explore', 빌딩: 'Build', 낙서: 'Doodle', 소설: 'Fiction', 목소리: 'Voices', 전체: 'All',
};
export const AXIS_SLUG: Record<Category, string> = { 탐험: 'explore', 빌딩: 'build', 낙서: 'doodle', 소설: 'fiction' };
export const AXIS_FROM_SLUG: Record<string, Category> = { explore: '탐험', build: '빌딩', doodle: '낙서', fiction: '소설' };

export function axisLabel(locale: Locale, axis: string) {
  return locale === 'en' ? AXIS_EN[axis as keyof typeof AXIS_EN] ?? axis : axis;
}
/** Value for ?section= in the given language. */
export function axisParam(locale: Locale, axis: Category) {
  return locale === 'en' ? AXIS_SLUG[axis] : axis;
}
/** Home/section URL for an axis in the given language. */
export function axisHref(locale: Locale, axis?: Category) {
  if (!axis) return localePath(locale, '/');
  return `${localePath(locale, '/')}?section=${encodeURIComponent(axisParam(locale, axis))}`;
}

const DEPTH: Record<Locale, Record<DepthLevel, string>> = {
  ko: { entry: '입구 · 2분', mid: '중간 · 5분', deep: '심층 · 10분+' },
  en: { entry: 'Entry · 2 min', mid: 'Middle · 5 min', deep: 'Deep · 10+ min' },
};
export const depthLabelFor = (locale: Locale, depth: DepthLevel) => DEPTH[locale][depth];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** 2026-09-28 → 2026.09.28 (ko) / Sep 28, 2026 (en). */
export function formatDate(locale: Locale, iso: string) {
  if (locale === 'ko') return iso.replaceAll('-', '.');
  const [y, m, d] = iso.split('-').map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

// ── UI strings ───────────────────────────────────────────────────────────
export const dict = {
  ko: {
    langName: '한국어',
    otherLangLabel: 'English',
    toggleAria: '언어 선택',
    homeAria: 'CarrotCave.com 홈',
    backToList: '목록으로 돌아가기',
    backToAxis: (axis: string) => `${axis} 목록으로 돌아가기`,
    wallAll: '모든 기록은 서로 다른 입구입니다.',
    wallVoices: '좋은 대화를 다시 읽을 수 있도록 남겨둡니다.',
    count: (n: number) => `${n}편`,
    emptyAxis: '이 분류에 공개된 기록이 아직 없습니다.',
    axisRailAria: '편집 축',
    axisNotes: { 탐험: '기술과 시장, 낯선 미래', 빌딩: '직접 만들고 부딪힌 기록', 낙서: '완성 전의 생각과 관찰', 소설: '사실 밖의 가능한 세계' } as Record<Category, string>,
    searchLabel: '기록 찾기',
    searchPlaceholder: '제목이나 요약으로 찾기',
    searchFound: (n: number) => `${n}개의 기록을 찾았어요.`,
    searchNone: '찾는 기록이 아직 없어요. 다른 단어로 찾아보세요.',
    searchEmptyTitle: '굴을 다 뒤졌는데 못 찾았어요.',
    searchEmptyBody: '검색어를 지우면 전체 기록으로 돌아가요.',
    more: '더 보기',
    video: '영상',
    nextIn: (axis: string) => `${axis}의 다음 글`,
    backToAxisShort: '돌아가기',
    backToAxisLong: (axis: string) => {
      const code = axis.charCodeAt(axis.length - 1) - 0xac00;
      const jong = code >= 0 && code <= 11171 ? code % 28 : 0;
      return `${axis}${jong === 0 || jong === 8 ? '로' : '으로'} 돌아가기`;
    },
    telegramLong: '텔레그램 채널에서 보기',
    telegramShort: '텔레그램',
    telegramVideo: '🎬 영상 보기 (텔레그램)',
    share: '공유하기',
    shareCopied: '링크 복사됨',
    shareFailed: '복사 실패',
    readingEndAria: '다 읽은 뒤',
    takeawaysTitle: '이 글에서 얻을 것',
    takeawaysJump: '이 부분으로 이동',
    nextHole: '더 깊이 갈래?',
    nextHoleSub: (axis: string) => `${axis}의 다음 굴`,
    depthFloor: (n: number) => `지하 ${n}층`,
    depthNote: (n: number) => n <= 1 ? '첫 굴을 다 읽었어요. 여기서부터 내려가요.' : `지금까지 ${n}개의 굴을 끝까지 읽었어요.`,
    depthNext: (left: number) => `${left}개 더 읽으면 다음 깊이예요.`,
    postNavAria: '글 이동',
    picksKicker: 'DOWN THE RABBIT HOLE',
    picksHeading: '다음으로 읽기 좋은 글 3개',
    picksIntro: '지금 읽은 글과 생각이 이어지는 순서대로 골랐습니다.',
    picksAria: '이어 읽을 글 추천',
    rank: (n: number) => `${n}순위`,
    readThis: '이 글 읽기',
    relationship: { DEEPENS: '같은 주제를 더 깊게', CHALLENGES: '다른 관점에서', APPLIES: '생각을 실제로', REFRAMES: '새로운 시선으로', RESONATES: '핵심 생각이 비슷한' },
    progressAria: '전체 글 읽기 진행률',
    lostTitle: '여기는 아직 아무도 파지 않은 굴이에요.',
    lostBody: '토끼가 길을 잃었나 봐요. 입구로 돌아가 볼까요?',
    lostCta: '입구로 돌아가기',
    nlAria: '새 글 메일 구독',
    nlTitle: '새 글을 메일로 받아보세요',
    nlDesc: '새 글이 올라온 다음 날 아침 8시에 한 번만 보내드려요.',
    nlEmail: '이메일',
    nlSubmit: '구독',
    nlSending: '보내는 중',
    nlDoneTitle: '당근 하나 접수했어요!',
    nlAlreadyTitle: '이미 같은 굴 친구예요!',
    nlAlreadyBody: '이미 구독 중이에요. 고마워요.',
    nlQueuedBody: '신청을 받았어요. 확인 메일을 곧 보내드릴게요.',
    nlSentBody: '확인 메일을 보냈어요. 메일의 버튼을 누르면 구독이 시작돼요.',
    nlError: '이메일 주소를 다시 확인해 주세요.',
    nlLeave: '언제든 한 번에 구독을 끊을 수 있어요.',
    nlRss: 'RSS로 받기',
    nlPageTitle: '새 글 메일 구독',
    nlStatus: {
      confirmed: '구독이 확정됐어요. 새 글이 올라온 다음 날 아침 8시에 만나요.',
      unsubscribed: '구독을 해지했어요. 그동안 읽어 주셔서 고마워요.',
      invalid: '링크가 만료됐거나 올바르지 않아요. 아래에서 다시 신청해 주세요.',
    } as Record<string, string>,
    nlUnsubAsk: '당근동굴 새 글 메일 구독을 해지할까요?',
    nlUnsubButton: '구독 해지',
    sceneSr: '졸던 당근에게 깡충깡충 다가간 토끼와, 숨었다가 튀어나와 윙크하는 당근. 당근을 누르면 말을 걸어요.',
    carrotLines: ['들켰다!', '간지러워요', '당근 아니에요', '쉿, 숨는 중', '또 놀러 와요'],
    carrotHit: '당근 쓰다듬기',
    rabbitHit: '토끼 쓰다듬기',
    linkOpen: '열기',
    galleryAria: (n: number) => `사진 ${n}장`,
    galleryPick: '사진 선택',
    galleryItem: (n: number) => `사진 ${n}`,
    galleryPrev: '이전 사진',
    galleryNext: '다음 사진',
    youtube: 'YouTube 영상',
    play: (label: string) => `${label} 재생`,
    voiceNotice: '',
    siteTitle: '토끼를 따라왔는데, 생각이 길을 잃었습니다.',
    siteDescription: '토끼를 따라 더 깊이. 기술, 사람, 시장과 미래에 관한 기록.',
  },
  en: {
    langName: 'English',
    otherLangLabel: '한국어',
    toggleAria: 'Language',
    homeAria: 'CarrotCave.com home',
    backToList: 'Back to the list',
    backToAxis: (axis: string) => `Back to ${axis}`,
    wallAll: 'Every record is a different way in.',
    wallVoices: 'Good conversations, kept so they can be read again.',
    count: (n: number) => `${n} ${n === 1 ? 'piece' : 'pieces'}`,
    emptyAxis: 'Nothing has been published in this section yet.',
    axisRailAria: 'Sections',
    axisNotes: { 탐험: 'Technology, markets and strange futures', 빌딩: 'Notes from building things myself', 낙서: 'Thoughts and observations before they are finished', 소설: 'Possible worlds beyond the facts' } as Record<Category, string>,
    searchLabel: 'Search the archive',
    searchPlaceholder: 'Search titles and summaries',
    searchFound: (n: number) => `Found ${n} ${n === 1 ? 'piece' : 'pieces'}.`,
    searchNone: 'Nothing found yet. Try another word.',
    searchEmptyTitle: 'I dug through the whole cave and found nothing.',
    searchEmptyBody: 'Clear the search to see everything again.',
    more: 'Show more',
    video: 'Video',
    nextIn: (axis: string) => `Next in ${axis}`,
    backToAxisShort: 'Back',
    backToAxisLong: (axis: string) => `Back to ${axis}`,
    telegramLong: 'View on Telegram',
    telegramShort: 'Telegram',
    telegramVideo: '🎬 Watch the video (Telegram)',
    share: 'Share',
    shareCopied: 'Link copied',
    shareFailed: 'Copy failed',
    readingEndAria: 'After reading',
    takeawaysTitle: 'What you will get from this piece',
    takeawaysJump: 'Jump to this part',
    nextHole: 'Want to go deeper?',
    nextHoleSub: (axis: string) => `The next hole in ${axis}`,
    depthFloor: (n: number) => `Floor B${n}`,
    depthNote: (n: number) => n <= 1 ? 'You finished your first hole. It goes down from here.' : `You have read ${n} holes all the way through.`,
    depthNext: (left: number) => `${left} more to reach the next depth.`,
    postNavAria: 'Post navigation',
    picksKicker: 'DOWN THE RABBIT HOLE',
    picksHeading: 'Three good reads to go next',
    picksIntro: 'Picked in the order the ideas connect to what you just read.',
    picksAria: 'Recommended next reads',
    rank: (n: number) => `No. ${n}`,
    readThis: 'Read this',
    relationship: { DEEPENS: 'Deeper on the same theme', CHALLENGES: 'From another angle', APPLIES: 'The idea in practice', REFRAMES: 'A fresh way of seeing', RESONATES: 'A kindred idea' },
    progressAria: 'Reading progress',
    lostTitle: 'Nobody has dug this tunnel yet.',
    lostBody: 'Looks like the rabbit got lost. Shall we head back to the entrance?',
    lostCta: 'Back to the entrance',
    nlAria: 'Subscribe to new posts by email',
    nlTitle: 'Get new posts by email',
    nlDesc: 'One email at 8 a.m. (KST) the morning after a new post. Posts are written in Korean, with English versions on this site.',
    nlEmail: 'Email',
    nlSubmit: 'Subscribe',
    nlSending: 'Sending',
    nlDoneTitle: 'One carrot received!',
    nlAlreadyTitle: "You're already a cave friend!",
    nlAlreadyBody: "You're already subscribed. Thank you.",
    nlQueuedBody: "Got it. We'll send a confirmation email shortly.",
    nlSentBody: 'We sent a confirmation email. Press the button in it to start your subscription.',
    nlError: 'Please check your email address.',
    nlLeave: 'Unsubscribe anytime in one click.',
    nlRss: 'Get the RSS',
    nlPageTitle: 'Subscribe by email',
    nlStatus: {
      confirmed: "You're subscribed. See you at 8 a.m. the morning after a new post.",
      unsubscribed: "You've unsubscribed. Thank you for reading.",
      invalid: 'This link has expired or is invalid. Please subscribe again below.',
    } as Record<string, string>,
    nlUnsubAsk: 'Unsubscribe from CarrotCave new-post emails?',
    nlUnsubButton: 'Unsubscribe',
    sceneSr: 'A rabbit hops up to a dozing carrot, which pops out of hiding and winks. Tap the carrot to say hello.',
    carrotLines: ['Caught me!', 'That tickles', "I'm not a carrot", 'Shh, hiding', 'Come back soon'],
    carrotHit: 'Pet the carrot',
    rabbitHit: 'Pet the rabbit',
    linkOpen: 'Open',
    galleryAria: (n: number) => `${n} photos`,
    galleryPick: 'Choose a photo',
    galleryItem: (n: number) => `Photo ${n}`,
    galleryPrev: 'Previous photo',
    galleryNext: 'Next photo',
    youtube: 'YouTube video',
    play: (label: string) => `Play ${label}`,
    voiceNotice: 'This reader is in Korean. The original talk is linked inside.',
    siteTitle: 'Followed the rabbit. Lost the thread.',
    siteDescription: 'Deeper down the rabbit hole. Notes on technology, people, markets and the future.',
  },
} as const;

export type Dict = (typeof dict)['ko'];
export const t = (locale: Locale) => dict[locale] as unknown as Dict;
