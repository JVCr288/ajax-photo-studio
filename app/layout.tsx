import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AJAX CLICK",
  description: "AI Creative Workspace"
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
