import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { SessionProvider as SessionProviderWrapper } from '@/components/SessionProvider';

export const metadata: Metadata = {
  title: "FloodGuard AI - Autonomous Early Warning System",
  description: "AI-powered flash flood prediction, evacuation planning, and emergency communication system",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-white text-gray-900 dark:bg-gray-900 dark:text-white antialiased">
        <ThemeProvider>
          <SessionProviderWrapper>{children}</SessionProviderWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
