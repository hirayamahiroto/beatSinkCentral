import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { Layout } from "@ui/design-system/components/templates/Layout";
import { getSession } from "../libs/auth0";
import {
  routes,
  navItems,
  footerLinks,
  authAction,
  dashboardAction,
} from "../utils/config/routes";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BeatSinkCentral - Beatfolio",
  description:
    "BeatSinkCentralは、日本のビートボックス業界のプロフェッショナル化と持続可能な構造の構築を目指しています。このプラットフォームは、プレイヤー、イベント主催者、観客を繋ぐ中心的なハブとして機能し、コミュニティ内の透明性、安全性、成長を促進します。",
};

const renderLink = ({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) => (
  <Link href={href} className={className}>
    {children}
  </Link>
);

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Layout
          isLoggedIn={!!session}
          homeHref={routes.home}
          navItems={[...navItems]}
          authAction={authAction}
          dashboardAction={dashboardAction}
          footerLinks={[...footerLinks]}
          renderLink={renderLink}
        >
          {children}
        </Layout>
      </body>
    </html>
  );
}
