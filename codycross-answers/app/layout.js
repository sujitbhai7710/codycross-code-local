import './globals.css';
import { Bricolage_Grotesque, DM_Sans } from 'next/font/google';

const displayFont = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-display',
});

const bodyFont = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
});

export const metadata = {
  title: {
    default: 'CodyCross Atlas',
    template: '%s | CodyCross Atlas',
  },
  description: 'Clean CodyCross answers, daily crossword solutions, and today\'s password in one fast archive.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${displayFont.variable} ${bodyFont.variable}`}>{children}</body>
    </html>
  );
}
