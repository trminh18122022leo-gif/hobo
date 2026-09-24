import type { Metadata } from 'next';
import { Be_Vietnam_Pro, JetBrains_Mono, Playfair_Display } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { CompareProvider } from '@/context/CompareContext';
import CompareFloatingBar from '@/components/CompareFloatingBar';

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ['vietnamese', 'latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-be-vietnam-pro',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
});

const playfair = Playfair_Display({
  subsets: ['vietnamese', 'latin'],
  weight: ['600', '700', '800', '900'],
  variable: '--font-playfair',
});

export const metadata: Metadata = {
  title: 'Học Bổng Việt Nam - Cổng Tuyển Sinh & Học Bổng Chuẩn Xác',
  description: 'Nền tảng tra cứu học bổng và tuyển sinh toàn diện với dữ liệu thẩm định thời gian thực và trải nghiệm thiết kế Haute Horlogerie kết hợp Liquid Glass.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className="dark" suppressHydrationWarning>
      <body
        className={`${beVietnamPro.variable} ${jetbrainsMono.variable} ${playfair.variable} antialiased min-h-screen flex flex-col bg-[#05060A] text-slate-100 relative selection:bg-amber-400/30 selection:text-amber-200`}
      >
        {/* Background Ambient Liquid Glass Mesh Orbs */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute -top-40 left-1/4 w-[600px] h-[600px] orb-gold rounded-full blur-[120px] animate-pulse opacity-60" />
          <div className="absolute top-1/3 -right-20 w-[500px] h-[500px] orb-cyan rounded-full blur-[130px] opacity-40" />
          <div className="absolute -bottom-20 left-10 w-[600px] h-[600px] orb-purple rounded-full blur-[140px] opacity-30" />
          {/* Subtle Celestial Grid Mesh */}
          <div 
            className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#d4af37_1px,transparent_1px)] [background-size:32px_32px]" 
          />
        </div>

        <CompareProvider>
          <div className="relative z-10 flex flex-col min-h-screen">
            <Header />
            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </main>
            <CompareFloatingBar />
            <Footer />
          </div>
        </CompareProvider>
      </body>
    </html>
  );
}
