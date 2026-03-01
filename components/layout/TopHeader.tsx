/* ============================================================
   components/layout/TopHeader.tsx — 顶部页面标题栏
   功能：显示当前页面标题、通知铃铛、语言选择、客服按钮
   ============================================================ */

'use client';

import { useState } from 'react';
import { useTranslation, LanguageCode } from '@/store/i18nStore';

interface TopHeaderProps {
    title: string;                  // 当前页面标题
    subtitle?: string;              // 页面副标题（可选）
}

const LANG_LABEL_MAP: Record<LanguageCode, string> = {
    en: 'English',
    zhCN: '简体中文',
    zhTW: '繁體中文',
};

export default function TopHeader({ title, subtitle }: TopHeaderProps) {
    const [showLangMenu, setShowLangMenu] = useState(false);
    const { t, lang, setLang } = useTranslation();

    return (
        <header
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 28px',
                borderBottom: '1px solid var(--color-border)',
                background: 'var(--color-bg-primary)',
                position: 'sticky',
                top: 0,
                zIndex: 50,
            }}
        >
            {/* ── 左侧：页面标题 ── */}
            <div>
                <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    {title}
                </h1>
                {subtitle && (
                    <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                        {subtitle}
                    </p>
                )}
            </div>

            {/* ── 右侧：操作按钮组 ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

                {/* 通知铃铛 */}
                <button
                    style={{
                        width: 38, height: 38,
                        background: 'var(--color-bg-card)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', position: 'relative',
                    }}
                    title={t('Notifications')}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-secondary)" strokeWidth="2">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                    {/* 未读通知红点 */}
                    <span style={{
                        position: 'absolute', top: '6px', right: '6px',
                        width: '8px', height: '8px',
                        background: 'var(--color-red)',
                        borderRadius: '50%',
                    }} />
                </button>

                {/* 语言选择 */}
                <div style={{ position: 'relative' }}>
                    <button
                        onClick={() => setShowLangMenu(!showLangMenu)}
                        style={{
                            width: 38, height: 38,
                            background: 'var(--color-bg-card)',
                            border: '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-sm)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer',
                        }}
                        title={t('Language')}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-secondary)" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="2" y1="12" x2="22" y2="12" />
                            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                        </svg>
                    </button>
                    {/* 语言下拉菜单 */}
                    {showLangMenu && (
                        <div style={{
                            position: 'absolute', top: '44px', right: 0,
                            background: 'var(--color-bg-card)',
                            border: '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-sm)',
                            overflow: 'hidden', minWidth: '130px',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                            zIndex: 200,
                        }}>
                            {(Object.keys(LANG_LABEL_MAP) as LanguageCode[]).map((key) => (
                                <button
                                    key={key}
                                    onClick={() => {
                                        setLang(key);
                                        setShowLangMenu(false);
                                    }}
                                    style={{
                                        display: 'block', width: '100%',
                                        padding: '10px 16px', textAlign: 'left',
                                        background: lang === key ? 'var(--color-bg-hover)' : 'transparent',
                                        border: 'none', cursor: 'pointer',
                                        color: lang === key ? 'var(--color-gold)' : 'var(--color-text-primary)',
                                        fontSize: '13px', fontWeight: lang === key ? 600 : 400,
                                    }}
                                >
                                    {LANG_LABEL_MAP[key]}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* 在线客服 */}
                <button
                    style={{
                        width: 38, height: 38,
                        background: 'var(--color-bg-card)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer',
                    }}
                    title={t('CustomerService')}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-secondary)" strokeWidth="2">
                        <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
                        <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
                    </svg>
                </button>
            </div>
        </header>
    );
}
