import type { Metadata } from 'next';
import { Atkinson_Hyperlegible } from 'next/font/google';

import './globals.css';

/*
 * Atkinson Hyperlegible was designed by the Braille Institute specifically to
 * increase legibility for low-vision readers: its letterforms are drawn so that
 * commonly-confused pairs (I/l/1, O/0, b/d) stay distinct at small sizes and
 * low contrast. For a product whose whole audience is students with visual
 * impairment and their families, it is the correct default.
 */
const atkinson = Atkinson_Hyperlegible({
  variable: '--font-atkinson',
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Audio Certificates — Vividha Trust',
    template: '%s — Vividha Trust',
  },
  description:
    'Certificates that speak. Built for the Curious Minds National STEM Challenge for students with visual impairment.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${atkinson.variable} h-full`}>
      <body className="flex min-h-full flex-col bg-paper text-ink antialiased">
        <a
          href="#main"
          className="sr-only-focusable absolute top-2 left-2 z-50 rounded bg-teal-900 px-4 py-2 font-bold text-white"
        >
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
