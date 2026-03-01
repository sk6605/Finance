/* ============================================================
   components/layout/Sidebar.tsx — 左侧固定导航栏
   功能：主导航菜单，显示5个主要页面入口 + 用户信息 + 退出登录
   替代原 App 版本的底部 Tab 导航栏
   ============================================================ */

'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { logoutApi } from '@/lib/api/authApi';

// ── 导航菜单项配置 ──
const NAV_ITEMS = [
    {
        label: 'Market',          // 首页市场行情
        href: '/market',
        icon: (active: boolean) => (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#d4af37' : '#8899aa'} strokeWidth="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
        ),
    },
    {
        label: 'Trading',         // 期权/合约交易
        href: '/trading',
        icon: (active: boolean) => (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#d4af37' : '#8899aa'} strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
                <polyline points="7 10 10 7 13 10 17 6" />
            </svg>
        ),
    },
    {
        label: 'Mining',          // 黄金存储/挖矿计划
        href: '/mining',
        icon: (active: boolean) => (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#d4af37' : '#8899aa'} strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" />
            </svg>
        ),
    },
    {
        label: 'Assets',          // 资产 & 钱包
        href: '/assets',
        icon: (active: boolean) => (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#d4af37' : '#8899aa'} strokeWidth="2">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
                <circle cx="7" cy="15" r="1" fill={active ? '#d4af37' : '#8899aa'} />
            </svg>
        ),
    },
    {
        label: 'Profile',         // 个人资料 & 设置
        href: '/profile',
        icon: (active: boolean) => (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#d4af37' : '#8899aa'} strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
            </svg>
        ),
    },
];

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { user, clearAuth } = useAuthStore();

    /* ── 退出登录处理 ── */
    const handleLogout = async () => {
        try {
            await logoutApi();
        } catch {
            // 即使 API 失败也继续清除本地状态
        } finally {
            clearAuth();
            router.push('/login');
        }
    };

    return (
        <aside
            style={{
                width: 'var(--sidebar-width)',
                minHeight: '100vh',
                background: 'var(--color-bg-secondary)',
                borderRight: '1px solid var(--color-border)',
                display: 'flex',
                flexDirection: 'column',
                position: 'fixed',
                top: 0,
                left: 0,
                bottom: 0,
                zIndex: 100,
            }}
        >
            {/* ── Logo & 品牌名 ── */}
            <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {/* 黄金 XAU 图标 */}
                    <div style={{
                        width: 36, height: 36,
                        background: 'linear-gradient(135deg, #d4af37, #f0c040)',
                        borderRadius: '8px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, color: '#000', fontSize: '14px',
                    }}>
                        XAU
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: '16px', color: '#fff' }}>XAU Storage</div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Gold Trading Platform</div>
                    </div>
                </div>
            </div>

            {/* ── 导航菜单 ── */}
            <nav style={{ flex: 1, padding: '12px 0' }}>
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '12px 20px',
                                margin: '2px 8px',
                                borderRadius: 'var(--radius-sm)',
                                background: isActive ? 'var(--color-bg-hover)' : 'transparent',
                                borderLeft: isActive ? '3px solid var(--color-gold-primary)' : '3px solid transparent',
                                color: isActive ? 'var(--color-gold-primary)' : 'var(--color-text-secondary)',
                                textDecoration: 'none',
                                fontSize: '14px',
                                fontWeight: isActive ? 600 : 400,
                                transition: 'all 0.2s ease',
                            }}
                        >
                            {item.icon(isActive)}
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            {/* ── 底部：用户信息 + 退出 ── */}
            <div style={{ padding: '16px 20px', borderTop: '1px solid var(--color-border)' }}>
                {user && (
                    <div style={{ marginBottom: '12px' }}>
                        {/* 用户邮箱（部分脱敏显示） */}
                        <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                            Logged in as
                        </div>
                        <div style={{
                            fontSize: '13px', color: 'var(--color-text-primary)',
                            fontWeight: 500, wordBreak: 'break-all',
                        }}>
                            {user.email}
                        </div>
                        {/* KYC 状态角标 */}
                        {user.kycStatus !== 'verified' && (
                            <span className="badge badge-orange" style={{ marginTop: '6px', fontSize: '10px' }}>
                                KYC Pending
                            </span>
                        )}
                    </div>
                )}
                {/* 退出登录按钮 */}
                <button
                    onClick={handleLogout}
                    style={{
                        width: '100%',
                        padding: '8px',
                        background: 'transparent',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--color-text-secondary)',
                        fontSize: '13px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => {
                        (e.target as HTMLButtonElement).style.borderColor = 'var(--color-red)';
                        (e.target as HTMLButtonElement).style.color = 'var(--color-red)';
                    }}
                    onMouseLeave={e => {
                        (e.target as HTMLButtonElement).style.borderColor = 'var(--color-border)';
                        (e.target as HTMLButtonElement).style.color = 'var(--color-text-secondary)';
                    }}
                >
                    Logout
                </button>
            </div>
        </aside>
    );
}
