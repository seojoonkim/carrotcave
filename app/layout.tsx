import type { Metadata, Viewport } from 'next';
import { JetBrains_Mono, Noto_Sans_KR, Noto_Serif_KR } from 'next/font/google';
import './globals.css';

const notoSerif = Noto_Serif_KR({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
  preload: false,
});

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
  title: 'CarrotCave.com · 토끼를 따라왔는데, 생각이 길을 잃었습니다.',
  description: '토끼를 따라 더 깊이. 기술, 사람, 시장과 미래에 관한 기록.',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'CarrotCave.com',
    description: '토끼를 따라 더 깊이. 기술, 사람, 시장과 미래에 관한 기록.',
    images: [{ url: '/opengraph-image.png', width: 1200, height: 630, alt: 'CarrotCave.com · Field Notes from the Rabbit Hole' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CarrotCave.com',
    description: '토끼를 따라 더 깊이. 기술, 사람, 시장과 미래에 관한 기록.',
    images: ['/opengraph-image.png'],
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
    <html lang="ko" className={`${notoSerif.variable} ${jetbrains.variable} ${notoSans.variable}`}>
      <body
        className="antialiased min-h-screen"
        style={{ backgroundColor: '#24262c', color: '#f2f1ec' }}
      >
        {children}
      </body>
    </html>
  );
}
