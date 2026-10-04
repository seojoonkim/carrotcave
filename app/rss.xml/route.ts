import { rssXml } from '@/lib/newsletter/core';
import { feedItems } from '@/lib/newsletter/feed';

export const dynamic = 'force-static';

export function GET() {
  return new Response(rssXml(feedItems().slice(0, 50)), {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8', 'Cache-Control': 'public, max-age=0, s-maxage=600' },
  });
}
