import { runDigest } from '@/lib/newsletter/core';
import { newsletterDeps } from '@/lib/newsletter/deps';
import { feedItems } from '@/lib/newsletter/feed';

export const dynamic = 'force-dynamic';

// Vercel Cron calls this daily at 23:00 UTC (08:00 KST) with Authorization: Bearer $CRON_SECRET.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) return new Response('Unauthorized', { status: 401 });
  const result = await runDigest(newsletterDeps(), feedItems(), { mode: 'cron' });
  return Response.json(result);
}
