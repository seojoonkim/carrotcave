import { redirect } from 'next/navigation';
import { confirm } from '@/lib/newsletter/core';
import { newsletterDeps } from '@/lib/newsletter/deps';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const status = await confirm(newsletterDeps(), new URL(request.url).searchParams.get('t'));
  redirect(`/newsletter?status=${status}`);
}
