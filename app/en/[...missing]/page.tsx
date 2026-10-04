import { notFound } from 'next/navigation';

// Unknown /en/... URLs fall here so they get the English 404 (app/en/not-found.tsx).
export default function EnglishMissing() {
  notFound();
}
