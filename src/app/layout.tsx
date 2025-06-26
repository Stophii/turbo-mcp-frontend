import type { Metadata } from "next";
import "./globals.css";

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
