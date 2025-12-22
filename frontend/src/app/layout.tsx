// app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';

/* ------------------------------------------------------------------ */
/* Font setup                                                          */
/* ------------------------------------------------------------------ */
const inter = Inter({
    subsets: ['latin'],
    display: 'swap',
});

/* ------------------------------------------------------------------ */
/* Metadata                                                            */
/* ------------------------------------------------------------------ */
export const metadata: Metadata = {
    title: 'StockScope - Advanced Stock Analysis Platform',
    description:
        'Real-time stock market analysis, screeners, portfolio tracking, and technical indicators',
};

/* ------------------------------------------------------------------ */
/* Correct mobile viewport (NO zoom bugs)                              */
/* ------------------------------------------------------------------ */
export const viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
};

/* ------------------------------------------------------------------ */
/* Root Layout                                                         */
/* ------------------------------------------------------------------ */
export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className="dark h-full">
            <body
                className={`
          ${inter.className}
          min-h-screen
          w-full
          bg-background
          text-foreground
          antialiased
          overflow-x-hidden
        `}
            >
                <AuthProvider>
                    {/* App Shell */}
                    <div className="flex min-h-screen flex-col overflow-x-hidden">
                        {/* Header / Navbar */}
                        <header className="sticky top-0 z-50 w-full">
                            <Navbar />
                        </header>

                        {/* Main content */}
                        <main className="flex-1 w-full overflow-x-hidden">
                            {children}
                        </main>
                    </div>
                </AuthProvider>
            </body>
        </html>
    );
}
