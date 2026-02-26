import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TabTally",
  description: "Shared expenses, approvals, and daily settlement.",
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
