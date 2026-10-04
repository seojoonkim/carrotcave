import NotFoundView from '@/components/views/NotFoundView';

// English 404 for anything under /en (unknown paths and missing posts).
export default function EnglishNotFound() {
  return <NotFoundView locale="en" />;
}
