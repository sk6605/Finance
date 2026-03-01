/* ============================================================
   app/page.tsx — 根路由重定向
   功能：访问 "/" 根路径时，检查登录状态自动跳转到正确页面
   - 已登录 → 跳转 /market
   - 未登录 → 跳转 /login
   ============================================================ */

import { redirect } from 'next/navigation';

export default function RootPage() {
  // 根路由直接重定向到市场页（Layout 层会处理登录守卫）
  redirect('/market');
}
