import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// Font imports (required even if unused directly, just don't assign to consts)
Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  title: "Turbo MCP",
  description: "A minimal worldbuilding AI tool.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-zinc-900 text-white min-h-screen flex flex-col items-center justify-center">
        {children}
      </body>
    </html>
  );
}
