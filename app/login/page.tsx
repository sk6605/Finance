/* ============================================================
   app/login/page.tsx — 登录 & 注册页
   功能：
   - 左半部分：品牌展示（Logo、标语、特性列表）
   - 右半部分：Login / Register Tab 切换表单
   - 登录：邮箱 + 密码，成功后保存 Token 跳转 /market
   - 注册：邮箱 + 密码 + 确认密码 + 邀请码 + OTP 验证
   ============================================================ */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginApi, registerApi, sendEmailOtpApi } from '@/lib/api/authApi';
import { useAuthStore } from '@/store/authStore';

type AuthTab = 'login' | 'register';

export default function LoginPage() {
    const router = useRouter();
    const { setAuth } = useAuthStore();

    // ── 登录表单状态 ──
    const [tab, setTab] = useState<AuthTab>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPwd, setShowPwd] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // ── 注册表单额外字段 ──
    const [confirmPwd, setConfirmPwd] = useState('');
    const [inviteCode, setInviteCode] = useState('');
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [otpLoading, setOtpLoading] = useState(false);

    /* ── 发送 OTP 到邮箱 ── */
    const handleSendOtp = async () => {
        if (!email) return setError('Please enter your email first');
        setOtpLoading(true);
        try {
            await sendEmailOtpApi(email);
            setOtpSent(true);
            setError('');
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to send OTP');
        } finally {
            setOtpLoading(false);
        }
    };

    /* ── 提交登录 ── */
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!email || !password) return setError('Please fill all fields');
        setLoading(true);
        try {
            const { user, token } = await loginApi(email, password);
            setAuth(user, token);
            router.replace('/market');
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Login failed. Check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    /* ── 提交注册 ── */
    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!email || !password || !confirmPwd || !otp) return setError('Please fill all required fields');
        if (password !== confirmPwd) return setError('Passwords do not match');
        if (password.length < 6) return setError('Password must be at least 6 characters');
        setLoading(true);
        try {
            const { user, token } = await registerApi({ email, password, smscode: otp, inviteCode });
            setAuth(user, token);
            router.replace('/market');
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    // 右侧表单提交处理
    const handleSubmit = tab === 'login' ? handleLogin : handleRegister;

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            {/* ══ 左半：品牌展示区 ══ */}
            <div style={{
                flex: 1,
                background: 'linear-gradient(135deg, #060d1c 0%, #0d1628 50%, #0a1218 100%)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: '60px',
                position: 'relative', overflow: 'hidden',
            }}>
                {/* 背景装饰圆 */}
                <div style={{ position: 'absolute', top: '-100px', left: '-100px', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, #d4af3710 0%, transparent 70%)' }} />
                <div style={{ position: 'absolute', bottom: '-60px', right: '-60px', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, #d4af3708 0%, transparent 70%)' }} />

                <div style={{ maxWidth: '440px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
                    {/* Logo */}
                    <div style={{
                        width: 72, height: 72, borderRadius: '18px',
                        background: 'linear-gradient(135deg, #d4af37, #f0c040)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '22px', fontWeight: 800, color: '#000',
                        margin: '0 auto 24px',
                        boxShadow: '0 0 40px #d4af3740',
                    }}>
                        XAU
                    </div>
                    <h1 style={{ fontSize: '36px', fontWeight: 800, lineHeight: 1.2, marginBottom: '16px' }}>
                        The Future of<br />
                        <span style={{ color: 'var(--color-gold-primary)' }}>Gold Trading</span>
                    </h1>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '16px', marginBottom: '40px', lineHeight: 1.6 }}>
                        Trade gold-backed digital tokens with real-time markets, options trading, and secure storage.
                    </p>

                    {/* 特性列表 */}
                    {[
                        { icon: '🪙', text: 'Real Physical Gold Backing' },
                        { icon: '🔒', text: 'Bank-Grade Security & 2FA' },
                        { icon: '⚡', text: 'Real-Time Price Updates' },
                        { icon: '📈', text: 'Options & Contract Trading' },
                    ].map(f => (
                        <div key={f.text} style={{
                            display: 'flex', alignItems: 'center', gap: '12px',
                            padding: '12px 16px', marginBottom: '10px', textAlign: 'left',
                            background: '#ffffff08', borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--color-border)',
                        }}>
                            <span style={{ fontSize: '20px' }}>{f.icon}</span>
                            <span style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>{f.text}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* ══ 右半：登录 / 注册表单 ══ */}
            <div style={{
                width: '480px',
                background: 'var(--color-bg-secondary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '40px',
                borderLeft: '1px solid var(--color-border)',
            }}>
                <div style={{ width: '100%', maxWidth: '380px' }}>
                    {/* 标题 */}
                    <h2 style={{ fontSize: '26px', fontWeight: 700, marginBottom: '6px' }}>
                        {tab === 'login' ? 'Welcome back' : 'Create account'}
                    </h2>
                    <p style={{ color: 'var(--color-text-secondary)', marginBottom: '28px', fontSize: '14px' }}>
                        {tab === 'login' ? 'Sign in to your XAU Storage account' : 'Start trading gold today'}
                    </p>

                    {/* Tab 切换 */}
                    <div style={{ display: 'flex', marginBottom: '28px', background: 'var(--color-bg-input)', borderRadius: 'var(--radius-sm)', padding: '3px' }}>
                        {(['login', 'register'] as AuthTab[]).map(t => (
                            <button key={t} onClick={() => { setTab(t); setError(''); }} style={{
                                flex: 1, padding: '10px', border: 'none', borderRadius: '6px', cursor: 'pointer',
                                background: tab === t ? 'var(--color-bg-card)' : 'transparent',
                                color: tab === t ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                                fontWeight: tab === t ? 600 : 400, fontSize: '14px',
                                boxShadow: tab === t ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
                                transition: 'all 0.2s',
                            }}>
                                {t.charAt(0).toUpperCase() + t.slice(1)}
                            </button>
                        ))}
                    </div>

                    {/* 表单 */}
                    <form onSubmit={handleSubmit}>
                        {/* 邮箱 */}
                        <div style={{ marginBottom: '14px' }}>
                            <label style={{ fontSize: '13px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '6px' }}>Email Address</label>
                            <input className="input-field" type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
                        </div>

                        {/* 密码 */}
                        <div style={{ marginBottom: '14px' }}>
                            <label style={{ fontSize: '13px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '6px' }}>Password</label>
                            <div style={{ position: 'relative' }}>
                                <input className="input-field" type={showPwd ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required style={{ paddingRight: '44px' }} />
                                <button type="button" onClick={() => setShowPwd(!showPwd)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: '12px' }}>
                                    {showPwd ? 'Hide' : 'Show'}
                                </button>
                            </div>
                        </div>

                        {/* 注册额外字段 */}
                        {tab === 'register' && (
                            <>
                                <div style={{ marginBottom: '14px' }}>
                                    <label style={{ fontSize: '13px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '6px' }}>Confirm Password</label>
                                    <input className="input-field" type="password" placeholder="••••••••" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} required />
                                </div>
                                <div style={{ marginBottom: '14px' }}>
                                    <label style={{ fontSize: '13px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '6px' }}>Invite Code (optional)</label>
                                    <input className="input-field" type="text" placeholder="Enter invite code" value={inviteCode} onChange={e => setInviteCode(e.target.value)} />
                                </div>
                                {/* OTP */}
                                <div style={{ marginBottom: '14px' }}>
                                    <label style={{ fontSize: '13px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '6px' }}>Email Verification Code</label>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <input className="input-field" type="text" placeholder="6-digit code" value={otp} onChange={e => setOtp(e.target.value)} required />
                                        <button type="button" onClick={handleSendOtp} disabled={otpLoading || otpSent} className="btn-outline-gold" style={{ padding: '0 14px', whiteSpace: 'nowrap', fontSize: '12px' }}>
                                            {otpSent ? 'Sent ✓' : otpLoading ? '...' : 'Send OTP'}
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* 忘记密码（仅登录） */}
                        {tab === 'login' && (
                            <div style={{ textAlign: 'right', marginBottom: '16px' }}>
                                <a href="#" style={{ fontSize: '12px', color: 'var(--color-gold-primary)', textDecoration: 'none' }}>
                                    Forgot password?
                                </a>
                            </div>
                        )}

                        {/* 错误提示 */}
                        {error && (
                            <div style={{ background: '#ff475710', border: '1px solid var(--color-red)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', color: 'var(--color-red)', fontSize: '13px', marginBottom: '16px' }}>
                                {error}
                            </div>
                        )}

                        {/* 提交按钮 */}
                        <button type="submit" className="btn-gold" style={{ width: '100%', padding: '14px', fontSize: '15px' }} disabled={loading}>
                            {loading ? 'Please wait...' : tab === 'login' ? 'Sign In' : 'Create Account'}
                        </button>
                    </form>

                    {/* 切换到注册/登录 */}
                    <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                        {tab === 'login' ? "Don't have an account? " : 'Already have an account? '}
                        <button
                            onClick={() => { setTab(tab === 'login' ? 'register' : 'login'); setError(''); }}
                            style={{ background: 'none', border: 'none', color: 'var(--color-gold-primary)', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}
                        >
                            {tab === 'login' ? 'Register' : 'Sign In'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
