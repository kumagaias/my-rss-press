import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MyRSSPress',
  description: 'Your Personalized Morning Digest, Curated by AI',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
