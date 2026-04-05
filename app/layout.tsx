import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "計算チャレンジ",
  description: "小学生向け計算練習アプリ",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body className="antialiased bg-slate-50 font-sans">{children}</body>
    </html>
  );
}
