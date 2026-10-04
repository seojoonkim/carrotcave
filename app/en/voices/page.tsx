import type { Metadata } from 'next';
import VoicesView from '@/components/views/VoicesView';
import { languageAlternates } from '@/lib/i18n';

export const metadata: Metadata = { title: 'Voices · CarrotCave.com', description: 'Good conversations, kept so they can be read again.', alternates: { canonical: '/en/voices', languages: languageAlternates('/voices') } };

export default function EnglishVoicesPage() {
  return <VoicesView locale="en" />;
}
