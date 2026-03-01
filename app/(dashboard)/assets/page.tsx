/* ============================================================
   app/(dashboard)/assets/page.tsx — 资产 & 钱包页
   功能：
   - 显示总资产余额（USDT、XAU）
   - 充值（显示钱包地址 + QR Code）
   - 提现（填写地址、金额、资金密码）
   - 资产流水记录（按类型筛选）
   ============================================================ */

'use client';

import { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import TopHeader from '@/components/layout/TopHeader';
import { getAssetBalancesApi, getDepositAddressApi, getBalanceLogsApi, submitWithdrawApi } from '@/lib/api/assetApi';
import { AssetBalance, AssetRecord, DepositAddress } from '@/types';

// 资产图标颜色
const CURRENCY_COLOR: Record<string, string> = {
    USDT: '#26a17b',
    XAU: '#d4af37',
};

type RecordFilterType = 'all' | 'deposit' | 'withdraw' | 'trade' | 'mining';

export default function AssetsPage() {
    const [balances, setBalances] = useState<AssetBalance[]>([]);
    const [records, setRecords] = useState<AssetRecord[]>([]);
    const [recordFilter, setRecordFilter] = useState<RecordFilterType>('all');
    const [isLoading, setIsLoading] = useState(true);

    // 充值面板状态
    const [showDeposit, setShowDeposit] = useState(false);
    const [depositCurrency, setDepositCurrency] = useState('USDT');
    const [depositNetwork, setDepositNetwork] = useState('TRC20');
    const [depositAddress, setDepositAddress] = useState<DepositAddress | null>(null);
    const [depositLoading, setDepositLoading] = useState(false);

    // 提现面板状态
    const [showWithdraw, setShowWithdraw] = useState(false);
    const [withdrawAddress, setWithdrawAddress] = useState('');
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [withdrawFundPwd, setWithdrawFundPwd] = useState('');
    const [withdrawError, setWithdrawError] = useState('');
    const [withdrawLoading, setWithdrawLoading] = useState(false);

    /* ── 加载余额和流水 ── */
    useEffect(() => {
        const load = async () => {
            try {
                const [bals, recs] = await Promise.all([
                    getAssetBalancesApi(),
                    getBalanceLogsApi(),
                ]);
                setBalances(bals);
                setRecords(recs);
            } catch (err) {
                console.error('[AssetsPage] 加载失败:', err);
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, []);

    /* ── 获取充值地址 ── */
    const fetchDepositAddress = async () => {
        setDepositLoading(true);
        try {
            const addr = await getDepositAddressApi({ currency: depositCurrency, chainType: depositNetwork });
            setDepositAddress(addr);
        } catch (err) {
            console.error('[AssetsPage] 获取充值地址失败:', err);
        } finally {
            setDepositLoading(false);
        }
    };

    useEffect(() => {
        if (showDeposit) fetchDepositAddress();
    }, [showDeposit, depositCurrency, depositNetwork]);

    /* ── 提交提现申请 ── */
    const handleWithdraw = async () => {
        setWithdrawError('');
        if (!withdrawAddress) return setWithdrawError('Please enter withdrawal address');
        if (!withdrawAmount || Number(withdrawAmount) <= 0) return setWithdrawError('Invalid amount');
        if (!withdrawFundPwd) return setWithdrawError('Fund password required');

        setWithdrawLoading(true);
        try {
            await submitWithdrawApi({
                currency: 'USDT',
                money: Number(withdrawAmount),
                address: withdrawAddress,
                safePassword: withdrawFundPwd,
            });
            setShowWithdraw(false);
            setWithdrawAddress('');
            setWithdrawAmount('');
            setWithdrawFundPwd('');
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Withdrawal failed';
            setWithdrawError(msg);
        } finally {
            setWithdrawLoading(false);
        }
    };

    // 总资产折合 USDT
    const totalUSDT = balances.reduce((s, b) => s + b.usdtValue, 0);

    // 过滤流水记录
    const filteredRecords = recordFilter === 'all'
        ? records
        : records.filter(r => r.type === recordFilter);

    return (
        <div>
            <TopHeader title="My Assets" subtitle="Manage your balances, deposits and withdrawals" />

            <div style={{ padding: '28px' }}>
                {/* ── 总资产摘要卡片 ── */}
                <div className="card" style={{
                    marginBottom: '24px',
                    background: 'linear-gradient(135deg, #111f3a 0%, #0d1628 100%)',
                    border: '1px solid var(--color-border-gold)',
                    position: 'relative', overflow: 'hidden',
                }}>
                    {/* 背景金色装饰 */}
                    <div style={{
                        position: 'absolute', right: -30, top: -30,
                        width: 180, height: 180,
                        background: 'radial-gradient(circle, #d4af3715 0%, transparent 70%)',
                    }} />
                    <div style={{ marginBottom: '6px', color: 'var(--color-text-secondary)', fontSize: '13px' }}>
                        Total Assets (USDT Equivalent)
                    </div>
                    <div style={{ fontSize: '36px', fontWeight: 700, color: 'var(--color-gold-primary)', marginBottom: '16px' }}>
                        ${totalUSDT.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                    {/* 操作按钮 */}
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button className="btn-gold" onClick={() => setShowDeposit(true)} style={{ padding: '10px 24px' }}>
                            Deposit
                        </button>
                        <button className="btn-outline-gold" onClick={() => setShowWithdraw(true)} style={{ padding: '10px 24px' }}>
                            Withdraw
                        </button>
                    </div>
                </div>

                {/* ── 各币种余额表格 ── */}
                <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: '24px' }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', fontWeight: 600 }}>
                        My Balances
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'var(--color-bg-input)', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                                {['Asset', 'Balance', 'Available', 'Frozen', 'USDT Value', 'Actions'].map(h => (
                                    <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontWeight: 600 }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan={6} style={{ padding: '30px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Loading...</td></tr>
                            ) : balances.map(bal => (
                                <tr key={bal.currency} style={{ borderTop: '1px solid var(--color-border)' }}>
                                    <td style={{ padding: '16px 20px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{
                                                width: 36, height: 36, borderRadius: '50%',
                                                background: (CURRENCY_COLOR[bal.currency] || '#8899aa') + '20',
                                                border: `1px solid ${CURRENCY_COLOR[bal.currency] || '#8899aa'}40`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '10px', fontWeight: 700, color: CURRENCY_COLOR[bal.currency] || '#8899aa',
                                            }}>
                                                {bal.currency.slice(0, 3)}
                                            </div>
                                            <span style={{ fontWeight: 600 }}>{bal.currency}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px 20px', fontWeight: 600 }}>{bal.balance.toFixed(6)}</td>
                                    <td style={{ padding: '16px 20px', color: 'var(--color-green)' }}>{bal.available.toFixed(6)}</td>
                                    <td style={{ padding: '16px 20px', color: 'var(--color-text-secondary)' }}>{bal.frozen.toFixed(6)}</td>
                                    <td style={{ padding: '16px 20px' }}>${bal.usdtValue.toFixed(2)}</td>
                                    <td style={{ padding: '16px 20px' }}>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button className="btn-gold" style={{ padding: '6px 14px', fontSize: '12px' }} onClick={() => setShowDeposit(true)}>
                                                Deposit
                                            </button>
                                            <button className="btn-outline-gold" style={{ padding: '6px 14px', fontSize: '12px' }} onClick={() => setShowWithdraw(true)}>
                                                Withdraw
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* ── 流水记录 ── */}
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    {/* Filter Tabs */}
                    <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', padding: '0 8px' }}>
                        {(['all', 'deposit', 'withdraw', 'trade', 'mining'] as RecordFilterType[]).map(f => (
                            <button key={f} onClick={() => setRecordFilter(f)} style={{
                                padding: '12px 16px', border: 'none', background: 'transparent', cursor: 'pointer',
                                fontSize: '13px', fontWeight: recordFilter === f ? 600 : 400,
                                color: recordFilter === f ? 'var(--color-gold-primary)' : 'var(--color-text-secondary)',
                                borderBottom: recordFilter === f ? '2px solid var(--color-gold-primary)' : '2px solid transparent',
                            }}>
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                            </button>
                        ))}
                    </div>
                    {filteredRecords.length === 0 ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>No records</div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: 'var(--color-bg-input)', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                                    {['Type', 'Amount', 'Currency', 'Status', 'Date'].map(h => (
                                        <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontWeight: 600 }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRecords.map(rec => (
                                    <tr key={rec.id} style={{ borderTop: '1px solid var(--color-border)' }}>
                                        <td style={{ padding: '14px 20px' }}>
                                            <span className={`badge ${rec.type === 'deposit' ? 'badge-green' : rec.type === 'withdraw' ? 'badge-red' : 'badge-gold'}`}>
                                                {rec.type}
                                            </span>
                                        </td>
                                        <td style={{ padding: '14px 20px', fontWeight: 600, color: rec.amount > 0 ? 'var(--color-green)' : 'var(--color-red)' }}>
                                            {rec.amount > 0 ? '+' : ''}{rec.amount.toFixed(6)}
                                        </td>
                                        <td style={{ padding: '14px 20px' }}>{rec.currency}</td>
                                        <td style={{ padding: '14px 20px' }}>
                                            <span className={`badge ${rec.status === 'completed' ? 'badge-green' : rec.status === 'failed' ? 'badge-red' : 'badge-orange'}`}>
                                                {rec.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '14px 20px', color: 'var(--color-text-secondary)', fontSize: '13px' }}>{rec.createdAt}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* ── 充值面板（Modal） ── */}
            {showDeposit && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="card" style={{ width: '420px', maxWidth: '90vw' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Deposit {depositCurrency}</h3>
                            <button onClick={() => setShowDeposit(false)} style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: '18px' }}>×</button>
                        </div>
                        {/* 网络选择 */}
                        <label style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Network</label>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px', marginBottom: '20px' }}>
                            {['TRC20', 'ERC20'].map(net => (
                                <button key={net} onClick={() => setDepositNetwork(net)} style={{
                                    padding: '8px 20px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                                    background: depositNetwork === net ? 'var(--color-gold-primary)' : 'var(--color-bg-input)',
                                    color: depositNetwork === net ? '#000' : 'var(--color-text-primary)',
                                    border: '1px solid var(--color-border)', fontWeight: 600,
                                }}>
                                    {net}
                                </button>
                            ))}
                        </div>
                        {/* QR Code */}
                        {depositLoading ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-secondary)' }}>Loading address...</div>
                        ) : depositAddress && (
                            <>
                                <div style={{ background: '#fff', padding: '16px', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                                    <QRCode value={depositAddress.address} size={180} />
                                </div>
                                <div style={{ background: 'var(--color-bg-input)', borderRadius: 'var(--radius-sm)', padding: '12px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', wordBreak: 'break-all', gap: '8px' }}>
                                    <span style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--color-text-secondary)' }}>{depositAddress.address}</span>
                                    <button onClick={() => navigator.clipboard.writeText(depositAddress.address)} className="btn-gold" style={{ padding: '6px 14px', fontSize: '12px', whiteSpace: 'nowrap' }}>Copy</button>
                                </div>
                                <div style={{ background: '#ffa50010', border: '1px solid #ffa50040', borderRadius: 'var(--radius-sm)', padding: '12px', fontSize: '12px', color: 'var(--color-orange)' }}>
                                    ⚠️ Minimum deposit: {depositAddress.minDeposit} {depositCurrency}. Only send {depositCurrency} ({depositNetwork}) to this address.
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* ── 提现面板（Modal） ── */}
            {showWithdraw && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="card" style={{ width: '420px', maxWidth: '90vw' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Withdraw USDT</h3>
                            <button onClick={() => { setShowWithdraw(false); setWithdrawError(''); }} style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: '18px' }}>×</button>
                        </div>
                        {[
                            { label: 'Withdrawal Address', value: withdrawAddress, setter: setWithdrawAddress, type: 'text', placeholder: 'Enter wallet address' },
                            { label: 'Amount (USDT)', value: withdrawAmount, setter: setWithdrawAmount, type: 'number', placeholder: 'Enter amount' },
                            { label: 'Fund Password', value: withdrawFundPwd, setter: setWithdrawFundPwd, type: 'password', placeholder: 'Enter fund password' },
                        ].map(field => (
                            <div key={field.label} style={{ marginBottom: '14px' }}>
                                <label style={{ fontSize: '13px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '6px' }}>{field.label}</label>
                                <input className="input-field" type={field.type} placeholder={field.placeholder} value={field.value} onChange={e => field.setter(e.target.value)} />
                            </div>
                        ))}
                        {withdrawError && <div style={{ color: 'var(--color-red)', fontSize: '13px', marginBottom: '12px' }}>{withdrawError}</div>}
                        <button className="btn-gold" style={{ width: '100%' }} onClick={handleWithdraw} disabled={withdrawLoading}>
                            {withdrawLoading ? 'Processing...' : 'Submit Withdrawal'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
