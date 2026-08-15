import { Baloo_2, Inter } from 'next/font/google';
import './globals.css';

const baloo = Baloo_2({
  variable: '--font-baloo',
  subsets: ['latin', 'devanagari'],
  weight: ['400', '500', '600', '700', '800'],
});

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

export const metadata = {
  title: { default: 'Satrang Music', template: '%s | Satrang Music' },
  description: 'Create, share, and play public music collections.',
  openGraph: {
    title: 'Satrang Music',
    description: 'Create, share, and play public music collections.',
    images: ['/power.png'],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${baloo.variable} ${inter.variable} h-full antialiased`}>
      <body className="h-full overflow-hidden">{children}</body>
    </html>
  );
}
