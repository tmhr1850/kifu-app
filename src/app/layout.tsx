import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { SocketProvider } from "@/contexts/SocketContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AudioProvider } from "@/contexts/AudioContext";
import { AnalyticsProvider } from "@/components/AnalyticsProvider";
import ErrorBoundary from "@/components/ErrorBoundary";
import { SessionTimeout } from "@/components/auth/SessionTimeout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "将棋棋譜管理アプリ",
  description: "将棋の棋譜を管理・再生できるアプリケーション",
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
    viewportFit: 'cover',
  },
  themeColor: '#ffffff',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '将棋棋譜管理',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* スキップリンク（アクセシビリティ） */}
        <a 
          href="#main-content" 
          className="skip-link sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-md z-50"
        >
          メインコンテンツへスキップ
        </a>
        <ErrorBoundary>
          <AnalyticsProvider>
            <AuthProvider>
              <ThemeProvider>
                <AudioProvider>
                  <SocketProvider>
                    <SessionTimeout />
                    <main id="main-content">
                      {children}
                    </main>
                  </SocketProvider>
                </AudioProvider>
              </ThemeProvider>
            </AuthProvider>
          </AnalyticsProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
