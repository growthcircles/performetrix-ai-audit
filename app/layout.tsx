import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PerforMetrix AI Audit",
  description: "AI maturity diagnostic for CHROs",
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
