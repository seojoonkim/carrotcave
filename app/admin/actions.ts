"use server";
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { adminAdd, adminRemove, adminToken, resendConfirmations, runDigest, safeEqual, skipToday, testSend } from '@/lib/newsletter/core';
import { newsletterDeps } from '@/lib/newsletter/deps';
import { feedItems } from '@/lib/newsletter/feed';
import { ADMIN_COOKIE, requireAdmin } from './auth';

export async function login(form: FormData) {
  const password = String(form.get('password') ?? '');
  const expected = process.env.ADMIN_PASSWORD;
  const secret = process.env.NEWSLETTER_SECRET;
  if (!expected || !secret || !safeEqual(password, expected)) {
    await new Promise((r) => setTimeout(r, 900));
    redirect('/admin?e=1');
  }
  (await cookies()).set(ADMIN_COOKIE, adminToken(secret), { httpOnly: true, secure: true, sameSite: 'strict', path: '/admin', maxAge: 7 * 86400 });
  redirect('/admin');
}
export async function logout() {
  (await cookies()).delete({ name: ADMIN_COOKIE, path: '/admin' });
  redirect('/admin');
}
export async function addSubscriber(form: FormData) {
  await requireAdmin();
  const ok = await adminAdd(newsletterDeps(), form.get('email'));
  redirect(`/admin?m=${ok ? 'added' : 'invalid'}`);
}
export async function removeSubscriber(form: FormData) {
  await requireAdmin();
  await adminRemove(newsletterDeps(), String(form.get('id') ?? ''));
  redirect('/admin?m=removed');
}
export async function sendTest(form: FormData) {
  await requireAdmin();
  const r = await testSend(newsletterDeps(), feedItems(), form.get('to'));
  redirect(`/admin?m=${r.sent ? 'test-sent' : 'test-failed'}`);
}
export async function sendNow() {
  await requireAdmin();
  const r = await runDigest(newsletterDeps(), feedItems(), { mode: 'manual' });
  redirect(`/admin?m=run-${r.status}`);
}
export async function skip() {
  await requireAdmin();
  await skipToday(newsletterDeps());
  redirect('/admin?m=skipped');
}
export async function resendPending() {
  await requireAdmin();
  const r = await resendConfirmations(newsletterDeps());
  redirect(`/admin?m=${r.sent ? 'confirm-sent' : 'confirm-none'}`);
}
