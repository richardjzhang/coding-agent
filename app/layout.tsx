import { GeistMono, GeistSans } from "geist/font";
import type { Metadata } from "next";
import "./globals.css";
import { VercelToolbar } from "@vercel/toolbar/next";

export const metadata: Metadata = {
  title: "Github Repo Agent",
  description: "A Next.js frontend for the github repo agent API",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const shouldInjectToolbar = process.env.NODE_ENV === "development";

  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="font-geist-sans antialiased">{children}</body>
      {shouldInjectToolbar && <VercelToolbar />}
    </html>
  );
}
