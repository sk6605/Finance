/* ============================================================
   app/(dashboard)/layout.tsx — 已登录页面的共用布局
   功能：
   - 显示左侧 Sidebar 导航
   - 主内容区右移（给 Sidebar 让位）
   - 自动检查登录状态，未登录跳转到 /login
   ============================================================ */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import { useHydratedAuth } from '@/store/authStore';
import GlobalMarketUpdater from '@/components/trading/GlobalMarketUpdater';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const { isLoggedIn, hasHydrated } = useHydratedAuth();

    /* ── 登录状态守卫：未登录则重定向到登录页 ── */
    useEffect(() => {
        // 只有当客户端 Hydration 完成后，才进行判断
        if (hasHydrated && !isLoggedIn) {
            router.replace('/login');
        }
    }, [isLoggedIn, hasHydrated, router]);

    // 未 Hydration 或未登录时不渲染内容（防止闪烁）
    if (!hasHydrated || !isLoggedIn) return null;

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            {/* 全局实时行情引擎，负责在后台不断同步价格 */}
            <GlobalMarketUpdater />

            {/* 固定左侧导航栏 */}
            <Sidebar />

            {/* 主内容区：给 Sidebar（220px）让位 */}
            <main
                style={{
                    marginLeft: 'var(--sidebar-width)',
                    flex: 1,
                    minHeight: '100vh',
                    background: 'var(--color-bg-primary)',
                    overflow: 'auto',
                }}
            >
                {children}
            </main>
        </div>
    );
}
