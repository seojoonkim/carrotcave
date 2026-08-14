import type { Metadata, Viewport } from 'next';
import { JetBrains_Mono, Noto_Sans_KR } from 'next/font/google';
import './globals.css';
import { siteDescription, siteName, siteOgImage } from '@/lib/social-metadata';

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-mono',
  display: 'swap',
});

const notoSans = Noto_Sans_KR({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL('https://carrotcave.com'),
  title: `${siteName} · 토끼를 따라왔는데, 생각이 길을 잃었습니다.`,
  description: siteDescription,
  alternates: { canonical: '/' },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: siteName,
    description: siteDescription,
    url: '/',
    siteName,
    locale: 'ko_KR',
    images: [{ url: siteOgImage, width: 1200, height: 630, type: 'image/png', alt: 'CarrotCave.com · Field Notes from the Rabbit Hole' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: siteName,
    description: siteDescription,
    images: [siteOgImage],
  },
};

export const viewport: Viewport = {
  themeColor: '#24262c',
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className={`${jetbrains.variable} ${notoSans.variable}`}>
      <body
        className="antialiased min-h-screen"
        style={{ backgroundColor: '#24262c', color: '#f2f1ec' }}
      >
        {children}
      </body>
    </html>
  );
}
