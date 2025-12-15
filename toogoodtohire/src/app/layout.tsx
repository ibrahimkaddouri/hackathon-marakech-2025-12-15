import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TooGoodToHire",
  description: "AI-Powered Recruitment with HRFlow & Recall.ai",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background`}>
        <div className="flex min-h-screen flex-col">
          <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
            <div className="container flex h-14 items-center">
              <span className="text-xl font-bold">TooGoodToHire</span>
              <nav className="ml-auto flex items-center space-x-4 text-sm font-medium">
                <a href="/" className="hover:text-foreground/80">Setup</a>
                <a href="/results" className="hover:text-foreground/80">Results</a>
                <a href="/interviews" className="hover:text-foreground/80">Interviews</a>
              </nav>
            </div>
          </header>
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
