/* ============================================================
   app/layout.tsx — 根布局（Root Layout）
   功能：设置 HTML 语言、全局字体、引入全局 CSS
   所有页面共用此布局作为最外层容器
   ============================================================ */

import type { Metadata } from 'next';
import './globals.css';

// 页面 SEO 基础配置
export const metadata: Metadata = {
  title: 'XAU Storage — Gold Trading Platform',
  description: 'Trade gold-backed digital tokens with real-time markets, options trading, and secure storage.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Google Fonts: Inter 字体 */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
