import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PerforMetrix - Measuring what really matters",
  description: "PerforMetrix - Measuring what really matters",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}


