import durations from '@/data/post-video-durations.json';
import type { InterviewArchive } from '@/data/interviews';

const postDurations = durations as Record<string, string>;
const VIDEO_HOSTS = /(?:youtube\.com|youtu\.be|bilibili\.com|vimeo\.com)/i;
const CLOCK = /^\d{1,2}(?::\d{2}){1,2}$/;

/** A post counts as video when it ships its own video file. Length is read from the file (ffprobe) at build time. */
export function postVideo(post: { slug: string; videoUrls?: string[] }) {
  if (!post.videoUrls?.length) return undefined;
  return { duration: postDurations[post.slug] };
}

/** A voice counts as video only when its source is a video platform (articles/transcripts are not). */
export function voiceVideo(item: Pick<InterviewArchive, 'sourceUrl' | 'duration'>) {
  if (!VIDEO_HOSTS.test(item.sourceUrl)) return undefined;
  return { duration: CLOCK.test(item.duration) ? item.duration : undefined };
}
