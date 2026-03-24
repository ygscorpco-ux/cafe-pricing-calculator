import type { Metadata } from "next";
import { Noto_Sans_KR, Space_Grotesk } from "next/font/google";

import "./globals.css";

const notoSansKr = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "아따 얼만교?",
  description:
    "카페 메뉴 가격, 원가, 목표 순이익 기준 권장 판매가를 빠르게 계산하는 카페 가격 설계 도구",
  metadataBase: new URL("https://cafe-pricing-calculator.vercel.app"),
  applicationName: "아따 얼만교?",
  openGraph: {
    title: "아따 얼만교?",
    description:
      "카페 메뉴 가격, 원가, 목표 순이익 기준 권장 판매가를 빠르게 계산하는 카페 가격 설계 도구",
    type: "website",
    locale: "ko_KR",
    siteName: "아따 얼만교?",
    url: "https://cafe-pricing-calculator.vercel.app",
    images: [
      {
        url: "/share-card.png?v=20260324",
        width: 1200,
        height: 630,
        alt: "아따 얼만교? 카페 가격 설계 도구 공유 이미지",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "아따 얼만교?",
    description:
      "카페 메뉴 가격, 원가, 목표 순이익 기준 권장 판매가를 빠르게 계산하는 카페 가격 설계 도구",
    images: ["/share-card.png?v=20260324"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${notoSansKr.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
