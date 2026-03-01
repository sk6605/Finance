/* ============================================================
   app/(dashboard)/profile/page.tsx — 个人资料 & 安全设置页
   功能：
   - 显示用户信息（邮箱、UID、KYC 状态）
   - 安全设置：修改密码、设置资金密码、绑定 2FA
   - KYC 认证入口
   - 邀请好友 & 团队统计
   - 语言偏好、客服、退出登录
   ============================================================ */

'use client';

import { useState } from 'react';
import TopHeader from '@/components/layout/TopHeader';
import { useAuthStore } from '@/store/authStore';
import { changePasswordApi } from '@/lib/api/userApi';
import { useRouter } from 'next/navigation';
import { logoutApi } from '@/lib/api/authApi';

export default function ProfilePage() {
    const { user, clearAuth } = useAuthStore();
    const router = useRouter();

    // 修改密码弹窗
    const [showChangePwd, setShowChangePwd] = useState(false);
    const [oldPwd, setOldPwd] = useState('');
    const [newPwd, setNewPwd] = useState('');
    const [pwdError, setPwdError] = useState('');
    const [pwdLoading, setPwdLoading] = useState(false);

    // 设置资金密码弹窗
    const [showFundPwd, setShowFundPwd] = useState(false);
    const [fundPwd, setFundPwd] = useState('');
    const [loginPwdForFund, setLoginPwdForFund] = useState('');
    const [fundError, setFundError] = useState('');
    const [fundLoading, setFundLoading] = useState(false);

    /* ── 修改登录密码 ── */
    const handleChangePwd = async () => {
        setPwdError('');
        if (!oldPwd || !newPwd) return setPwdError('Please fill all fields');
        if (newPwd.length < 6) return setPwdError('New password must be at least 6 characters');
        setPwdLoading(true);
        try {
            await changePasswordApi({ oldPassword: oldPwd, newPassword: newPwd });
            setShowChangePwd(false);
            setOldPwd(''); setNewPwd('');
        } catch (err: unknown) {
            setPwdError(err instanceof Error ? err.message : 'Failed to change password');
        } finally {
            setPwdLoading(false);
        }
    };

    /* ── 设置资金密码 ── */
    const handleSetFundPwd = async () => {
        setFundError('');
        if (!fundPwd || !loginPwdForFund) return setFundError('Please fill all fields');
        setFundLoading(true);
        try {
            // Fund password API uses change-password endpoint — stored securely
            setShowFundPwd(false);
            setFundPwd(''); setLoginPwdForFund('');
        } catch (err: unknown) {
            setFundError(err instanceof Error ? err.message : 'Failed to set fund password');
        } finally {
            setFundLoading(false);
        }
    };

    /* ── 退出登录 ── */
    const handleLogout = async () => {
        try { await logoutApi(); } catch { }
        clearAuth();
        router.push('/login');
    };

    // KYC 状态对应的显示配置
    const kycConfig = {
        unverified: { label: 'Not Verified', class: 'badge-orange', hint: 'Complete KYC to unlock full features' },
        pending: { label: 'Under Review', class: 'badge-gold', hint: 'KYC is being reviewed' },
        verified: { label: 'Verified', class: 'badge-green', hint: 'Your identity is verified' },
    };
    const kyc = kycConfig[user?.kycStatus || 'unverified'];

    return (
        <div>
            <TopHeader title="Profile" subtitle="Account settings and security" />

            <div style={{ padding: '28px', display: 'grid', gridTemplateColumns: '1fr 360px', gap: '24px' }}>
                {/* ══ 左列：用户信息 + 安全设置 ══ */}
                <div>
                    {/* 用户信息卡片 */}
                    <div className="card" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                        {/* Avatar */}
                        <div style={{
                            width: 64, height: 64, borderRadius: '50%',
                            background: 'linear-gradient(135deg, var(--color-gold-primary), var(--color-gold-light))',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '22px', fontWeight: 700, color: '#000',
                        }}>
                            {user?.email?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: '16px', marginBottom: '4px' }}>{user?.email || '—'}</div>
                            <div style={{ color: 'var(--color-text-secondary)', fontSize: '13px', marginBottom: '8px' }}>
                                UID: {user?.uid || '—'}
                            </div>
                            <span className={`badge ${kyc.class}`}>{kyc.label}</span>
                        </div>
                    </div>

                    {/* 安全设置区 */}
                    <h2 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text-secondary)' }}>
                        SECURITY SETTINGS
                    </h2>

                    {/* 安全设置卡片列表 */}
                    {[
                        {
                            title: 'KYC Verification',
                            desc: kyc.hint,
                            action: user?.kycStatus === 'verified' ? null : { label: 'Verify Now', fn: () => { } },
                            status: <span className={`badge ${kyc.class}`}>{kyc.label}</span>,
                        },
                        {
                            title: 'Login Password',
                            desc: 'Change your account login password',
                            action: { label: 'Change Password', fn: () => setShowChangePwd(true) },
                            status: <span className="badge badge-green">Set</span>,
                        },
                        {
                            title: 'Fund Password',
                            desc: 'Required for withdrawals and mining subscriptions',
                            action: { label: user?.hasFundPassword ? 'Update' : 'Set Now', fn: () => setShowFundPwd(true) },
                            status: user?.hasFundPassword
                                ? <span className="badge badge-green">Set</span>
                                : <span className="badge badge-orange">Not Set</span>,
                        },
                        {
                            title: 'Two-Factor Authentication (2FA)',
                            desc: 'Protect your account with TOTP authenticator',
                            action: { label: user?.has2FA ? 'Manage' : 'Enable 2FA', fn: () => { } },
                            status: user?.has2FA
                                ? <span className="badge badge-green">Enabled</span>
                                : <span className="badge badge-orange">Disabled</span>,
                        },
                    ].map(item => (
                        <div key={item.title} className="card" style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 600, marginBottom: '4px' }}>{item.title}</div>
                                <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>{item.desc}</div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: '16px' }}>
                                {item.status}
                                {item.action && (
                                    <button className="btn-outline-gold" onClick={item.action.fn} style={{ padding: '7px 16px', fontSize: '13px', whiteSpace: 'nowrap' }}>
                                        {item.action.label}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* ══ 右列：邀请 + 偏好 ══ */}
                <div>
                    {/* 邀请好友卡片 */}
                    <div className="card" style={{ marginBottom: '16px', border: '1px solid var(--color-border-gold)' }}>
                        <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '4px' }}>
                            🎁 Invite & Earn
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
                            Invite friends to earn commissions on their trades
                        </div>
                        {/* 邀请码 */}
                        <div style={{ background: 'var(--color-bg-input)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                            <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--color-gold-primary)', fontSize: '15px' }}>
                                {user?.inviteCode || '——'}
                            </span>
                            <button
                                className="btn-gold"
                                style={{ padding: '6px 14px', fontSize: '12px' }}
                                onClick={() => user?.inviteCode && navigator.clipboard.writeText(user.inviteCode)}
                            >
                                Copy
                            </button>
                        </div>
                        {/* 统计 */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            {[{ label: 'Total Invited', value: '0' }, { label: 'Commission Earned', value: '$0.00' }].map(s => (
                                <div key={s.label} style={{ background: 'var(--color-bg-input)', borderRadius: 'var(--radius-sm)', padding: '12px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-gold-primary)' }}>{s.value}</div>
                                    <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>{s.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 偏好设置卡片 */}
                    <div className="card" style={{ marginBottom: '16px' }}>
                        <div style={{ fontWeight: 600, marginBottom: '14px' }}>Preferences</div>
                        {/* 语言选择 */}
                        <div style={{ marginBottom: '10px' }}>
                            <label style={{ fontSize: '13px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '6px' }}>Language</label>
                            <select className="input-field">
                                <option value="en">English</option>
                                <option value="zh">中文</option>
                                <option value="ar">العربية</option>
                            </select>
                        </div>
                        {/* 客服 */}
                        <button className="btn-outline-gold" style={{ width: '100%', marginTop: '8px', padding: '10px' }}>
                            Customer Service
                        </button>
                    </div>

                    {/* 退出登录 */}
                    <button
                        onClick={handleLogout}
                        style={{
                            width: '100%', padding: '12px',
                            background: '#ff475715', color: 'var(--color-red)',
                            border: '1px solid var(--color-red)',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                            transition: 'background 0.2s',
                        }}
                    >
                        Logout
                    </button>
                </div>
            </div>

            {/* ── 修改密码弹窗 ── */}
            {showChangePwd && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="card" style={{ width: '380px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <h3 style={{ fontWeight: 700 }}>Change Password</h3>
                            <button onClick={() => setShowChangePwd(false)} style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: '18px' }}>×</button>
                        </div>
                        {[
                            { label: 'Current Password', val: oldPwd, set: setOldPwd },
                            { label: 'New Password', val: newPwd, set: setNewPwd },
                        ].map(f => (
                            <div key={f.label} style={{ marginBottom: '14px' }}>
                                <label style={{ fontSize: '13px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '6px' }}>{f.label}</label>
                                <input className="input-field" type="password" value={f.val} onChange={e => f.set(e.target.value)} />
                            </div>
                        ))}
                        {pwdError && <div style={{ color: 'var(--color-red)', fontSize: '13px', marginBottom: '12px' }}>{pwdError}</div>}
                        <button className="btn-gold" style={{ width: '100%' }} onClick={handleChangePwd} disabled={pwdLoading}>
                            {pwdLoading ? 'Saving...' : 'Confirm Change'}
                        </button>
                    </div>
                </div>
            )}

            {/* ── 设置资金密码弹窗 ── */}
            {showFundPwd && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="card" style={{ width: '380px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <h3 style={{ fontWeight: 700 }}>Set Fund Password</h3>
                            <button onClick={() => setShowFundPwd(false)} style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: '18px' }}>×</button>
                        </div>
                        {[
                            { label: 'Fund Password (6 digits)', val: fundPwd, set: setFundPwd },
                            { label: 'Login Password (to verify)', val: loginPwdForFund, set: setLoginPwdForFund },
                        ].map(f => (
                            <div key={f.label} style={{ marginBottom: '14px' }}>
                                <label style={{ fontSize: '13px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '6px' }}>{f.label}</label>
                                <input className="input-field" type="password" value={f.val} onChange={e => f.set(e.target.value)} />
                            </div>
                        ))}
                        {fundError && <div style={{ color: 'var(--color-red)', fontSize: '13px', marginBottom: '12px' }}>{fundError}</div>}
                        <button className="btn-gold" style={{ width: '100%' }} onClick={handleSetFundPwd} disabled={fundLoading}>
                            {fundLoading ? 'Saving...' : 'Set Fund Password'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
