import { normalizeEvent, recordEvent } from '@/lib/stats/core';
import { newsletterDeps } from '@/lib/newsletter/deps';

export const dynamic = 'force-dynamic';

// Reading beacon. Accepts sendBeacon (text/plain) and fetch(keepalive) bodies. Always answers 204.
export async function POST(request: Request) {
  try {
    const text = (await request.text()).slice(0, 2000);
    const e = normalizeEvent(JSON.parse(text), request.headers.get('user-agent') ?? '', request.headers.get('x-vercel-ip-country') ?? '', new Date());
    if (e) await recordEvent(newsletterDeps().store, e);
  } catch { /* never surface errors to readers */ }
  return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
}
