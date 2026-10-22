import type { Metadata } from "next";
import "./globals.css";
import "./terminal.css";

export const metadata: Metadata = {
  title: "내 방식 QR — 나에게 맞는 이용 방법",
  description: "한 번 만든 접근성 프로필로 병원과 카페를 편안하게 이용하세요.",
  icons: {
    icon: "/logo.svg",
    shortcut: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}
