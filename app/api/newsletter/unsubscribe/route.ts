import { redirect } from 'next/navigation';
import { unsubscribe } from '@/lib/newsletter/core';
import { newsletterDeps } from '@/lib/newsletter/deps';

export const dynamic = 'force-dynamic';

// GET only shows a confirmation page, so mail scanners that prefetch links cannot unsubscribe anyone.
export async function GET(request: Request) {
  const t = new URL(request.url).searchParams.get('t') ?? '';
  redirect(`/newsletter?unsub=${encodeURIComponent(t)}`);
}

// POST: the page's button, or a mail client's one-click unsubscribe (RFC 8058).
export async function POST(request: Request) {
  const url = new URL(request.url);
  const form = await request.formData().catch(() => null);
  const token = url.searchParams.get('t') || String(form?.get('t') ?? '');
  const status = await unsubscribe(newsletterDeps(), token);
  if (form?.get('List-Unsubscribe') === 'One-Click') return new Response(null, { status: status === 'invalid' ? 400 : 200 });
  return Response.redirect(new URL(`/newsletter?status=${status}`, url), 303);
}
