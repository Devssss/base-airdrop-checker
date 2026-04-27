import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'BaseScore',
    description: 'On-chain activity checker for Base, Arbitrum, and Optimism',
    other: {
      'fc:miniapp': JSON.stringify({
        version: 'next',
        imageUrl: 'https://picsum.photos/seed/basescore-embed/1200/630',
        button: {
          title: 'Launch BaseScore',
          action: {
            type: 'launch_miniapp',
            name: 'BaseScore',
            url: process.env.APP_URL || 'https://ais-dev-vt7viv7b5v6nqyjz5aongg-615601803900.asia-southeast1.run.app',
            splashImageUrl: 'https://picsum.photos/seed/basescore-splash/1200/630',
            splashBackgroundColor: '#020617',
          },
        },
      }),
    },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
