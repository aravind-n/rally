import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Rally',
  description: 'The teammate that leaves the meeting with the work already done.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#0a0a0a] text-white antialiased overflow-hidden h-screen">
        {children}
      </body>
    </html>
  );
}
