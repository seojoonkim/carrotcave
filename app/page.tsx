import HomeView from '@/components/views/HomeView';

export default async function Home({ searchParams }: { searchParams: Promise<{ section?: string }> }) {
  const { section } = await searchParams;
  return <HomeView section={section} locale="ko" />;
}
