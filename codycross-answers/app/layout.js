import './globals.css';

export const metadata = {
  title: 'CodyCross Answers & Solutions',
  description: 'All CodyCross puzzle answers, daily crossword solutions, and todays password answers. Auto-updated daily.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
