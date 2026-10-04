import { blobStore } from './blob-store';
import { fileStore, outboxMailer, resendMailer, type Deps } from './core';

export function newsletterDeps(): Deps {
  const secret = process.env.NEWSLETTER_SECRET;
  if (!secret) throw new Error('NEWSLETTER_SECRET is not configured');
  const store = process.env.BLOB_READ_WRITE_TOKEN ? blobStore() : fileStore('/tmp/carrotcave-newsletter');
  const mailer = process.env.RESEND_API_KEY
    ? resendMailer(process.env.RESEND_API_KEY, process.env.NEWSLETTER_FROM || 'Carrot Cave <newsletter@carrotcave.com>')
    : outboxMailer();
  return { store, mailer, secret, siteUrl: process.env.NEWSLETTER_SITE_URL || 'https://carrotcave.com' };
}
