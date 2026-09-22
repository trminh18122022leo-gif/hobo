import type { Metadata } from 'next';
import { Be_Vietnam_Pro, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { CompareProvider } from '@/context/CompareContext';
import CompareFloatingBar from '@/components/CompareFloatingBar';

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ['vietnamese', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-be-vietnam-pro',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
});

export const metadata: Metadata = {
  title: 'Học Bổng Việt Nam - Tra cứu Tuyển sinh & Học bổng',
  description: 'Nền tảng tra cứu thông tin tuyển sinh và học bổng tin cậy, tự động cập nhật.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={`${beVietnamPro.variable} ${jetbrainsMono.variable} antialiased min-h-screen flex flex-col scrollbar-custom`}>
        <CompareProvider>
          <Header />
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
          <CompareFloatingBar />
          <Footer />
        </CompareProvider>
      </body>
    </html>
  );
}
