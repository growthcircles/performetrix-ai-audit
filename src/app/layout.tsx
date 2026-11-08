import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PerforMetrix",
  description: "AI Audit",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body style={{ backgroundColor: '#14171F', color: '#E8E4DA', margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  );
}