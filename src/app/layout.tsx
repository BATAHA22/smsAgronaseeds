import type { Metadata } from "next";
import { Alexandria } from "next/font/google";
import "./globals.css";

const alexandria = Alexandria({ 
  subsets: ["arabic", "latin"], 
  variable: "--font-alexandria",
  display: 'swap',
});

export const metadata: Metadata = {
  title: "YarobSMS - نظام إرسال الرسائل",
  description: "نظام إرسال رسائل SMS للعملاء",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${alexandria.variable} antialiased font-sans`}>
        <div className="min-h-dvh">
          {children}
        </div>
      </body>
    </html>
  );
}
