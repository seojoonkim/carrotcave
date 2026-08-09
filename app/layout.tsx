import type { Metadata, Viewport } from 'next';
import { Noto_Serif_KR, JetBrains_Mono, Playfair_Display, Noto_Sans_KR, Inter, Cormorant_Garamond } from 'next/font/google';
import './globals.css';

const notoSerif = Noto_Serif_KR({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-serif',
  display: 'swap',
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-mono',
  display: 'swap',
});

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
});

const notoSans = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['300', '400'],
  variable: '--font-sans',
  display: 'swap',
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-logo',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-title',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://carrotcave.com'),
  title: 'CARROT CAVE · 토끼를 따라왔는데, 생각이 길을 잃었습니다.',
  description: 'Simon Kim의 기술, 사람, 시장과 미래에 관한 개인 출판 아카이브.',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'CARROT CAVE',
    description: 'Followed the rabbit. Lost in thought.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#292c33',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className={`${notoSerif.variable} ${jetbrains.variable} ${playfairDisplay.variable} ${notoSans.variable} ${inter.variable} ${cormorant.variable}`}>
      <body
        className="antialiased min-h-screen"
        style={{ background: '#292c33', color: '#f2f1ec' }}
      >
        {children}
      </body>
    </html>
  );
}
