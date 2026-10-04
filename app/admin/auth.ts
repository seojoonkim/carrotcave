import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { isAdminToken } from '@/lib/newsletter/core';

export const ADMIN_COOKIE = 'cc_admin';

export async function isAdmin() {
  const secret = process.env.NEWSLETTER_SECRET;
  if (!secret || !process.env.ADMIN_PASSWORD) return false;
  return isAdminToken((await cookies()).get(ADMIN_COOKIE)?.value, secret);
}
export async function requireAdmin() {
  if (!(await isAdmin())) redirect('/admin');
}
