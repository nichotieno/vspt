import type {Metadata} from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { PortfolioProvider } from '@/contexts/PortfolioContext';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/stock-sim/ThemeProvider';
import { AuthProvider } from '@/contexts/AuthContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'StockSim',
  description: 'A simulated stock trading application.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <PortfolioProvider>
              {children}
              <Toaster />
            </PortfolioProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
