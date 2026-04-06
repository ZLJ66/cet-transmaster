import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";

export const metadata: Metadata = {
  title: "CET-TransMaster 四六级翻译大师",
  description: "为中文使用者设计的四六级中译英训练应用",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: true,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-gray-50">
        <Header />
        {children}
      </body>
    </html>
  );
}
