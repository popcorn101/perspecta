import type { Metadata } from 'next';
import './globals.css';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'PERSPECTA — See Beyond the Story | PRISM Media Framing Platform',
  description:
    'Deconstruct news coverage into inspectable framing signals using the PRISM methodology. Compare multiple perspectives side-by-side without subjective bias meters.',
  keywords: [
    'media literacy',
    'framing analysis',
    'PRISM methodology',
    'news comparison',
    'journalism ethics',
    'rhetorical analysis',
  ],
  authors: [{ name: 'PERSPECTA Institute for Media Literacy' }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="bg-[#F7F3EE] text-[#241E19]">
      <body className="min-h-screen bg-[#F7F3EE] text-[#241E19] selection:bg-[#F9EFEA] selection:text-[#9E4A28] antialiased">
        {children}
      </body>
    </html>
  );
}
