"use server";
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { adminAdd, adminRemove, adminToken, clearLoginFailures, loginGate, recordLoginFailure, resendConfirmations, runDigest, safeEqual, sessionSecret, skipToday, testSend } from '@/lib/newsletter/core';
import { newsletterDeps } from '@/lib/newsletter/deps';
import { feedItems } from '@/lib/newsletter/feed';
import { ADMIN_COOKIE, requireAdmin } from './auth';

export async function login(form: FormData) {
  const password = String(form.get('password') ?? '');
  const expected = process.env.ADMIN_PASSWORD;
  const secret = process.env.NEWSLETTER_SECRET;
  if (!expected || !secret) redirect('/admin?e=1');
  const h = await headers();
  const client = (h.get('x-real-ip') || h.get('x-forwarded-for')?.split(',')[0] || 'unknown').trim();
  const { store } = newsletterDeps();
  if ((await loginGate(store, client)).locked) {
    await new Promise((r) => setTimeout(r, 900));
    redirect('/admin?e=locked');
  }
  if (!safeEqual(password, expected)) {
    await recordLoginFailure(store, client);
    await new Promise((r) => setTimeout(r, 900));
    redirect('/admin?e=1');
  }
  await clearLoginFailures(store, client);
  (await cookies()).set(ADMIN_COOKIE, adminToken(sessionSecret(secret, expected)), { httpOnly: true, secure: true, sameSite: 'strict', path: '/admin', maxAge: 7 * 86400 });
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
