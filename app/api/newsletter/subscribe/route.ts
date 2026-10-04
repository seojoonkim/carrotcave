import { subscribe } from '@/lib/newsletter/core';
import { newsletterDeps } from '@/lib/newsletter/deps';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  if (body?.website) return Response.json({ ok: true, status: 'pending' }); // honeypot
  const result = await subscribe(newsletterDeps(), body?.email, 'site');
  return Response.json(result, { status: result.ok ? 200 : 400 });
}
