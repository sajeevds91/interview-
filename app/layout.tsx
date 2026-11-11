import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Careers at Divide",
  description: "Apply for open roles at Divide.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
