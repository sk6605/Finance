/* ============================================================
   app/(dashboard)/mining/page.tsx — 黄金存储/挖矿计划页
   功能：
   - 显示所有可购买的挖矿计划（日利率、期限、最低金额）
   - 点击 Subscribe 弹出购买模态框，输入金额 + 资金密码
   - 下方展示用户已购的挖矿订单（Active / History）
   ============================================================ */

'use client';

import { useEffect, useState } from 'react';
import TopHeader from '@/components/layout/TopHeader';
import { getMiningProductsApi, getMyMiningOrdersApi, subscribeMiningPlanApi } from '@/lib/api/miningApi';
import { MiningOrder, MiningProduct } from '@/types';

export default function MiningPage() {
    const [products, setProducts] = useState<MiningProduct[]>([]);
    const [myOrders, setMyOrders] = useState<MiningOrder[]>([]);
    const [ordersTab, setOrdersTab] = useState<'active' | 'completed'>('active');
    const [isLoading, setIsLoading] = useState(true);

    // 购买弹窗状态
    const [selectedProduct, setSelectedProduct] = useState<MiningProduct | null>(null);
    const [subscribeAmount, setSubscribeAmount] = useState('');
    const [fundPassword, setFundPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');

    /* ── 加载挖矿计划和我的订单 ── */
    useEffect(() => {
        const load = async () => {
            try {
                const [prods, orders] = await Promise.all([
                    getMiningProductsApi(),
                    getMyMiningOrdersApi(),
                ]);
                setProducts(prods);
                setMyOrders(orders);
            } catch (err) {
                console.error('[MiningPage] 加载失败:', err);
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, []);

    /* ── 提交购买挖矿计划 ── */
    const handleSubscribe = async () => {
        if (!selectedProduct) return;
        setSubmitError('');

        const amount = Number(subscribeAmount);
        if (isNaN(amount) || amount < selectedProduct.minAmount) {
            setSubmitError(`Minimum amount is ${selectedProduct.minAmount} USDT`);
            return;
        }
        if (!fundPassword) {
            setSubmitError('Fund password is required');
            return;
        }

        setIsSubmitting(true);
        try {
            const order = await subscribeMiningPlanApi({
                productId: selectedProduct.id,
                money: amount,
                safePassword: fundPassword,
            });
            setMyOrders(prev => [order, ...prev]);
            // 关闭弹窗
            setSelectedProduct(null);
            setSubscribeAmount('');
            setFundPassword('');
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Subscription failed';
            setSubmitError(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    // 根据当前 Tab 过滤订单
    const filteredOrders = myOrders.filter(o => o.status === ordersTab);

    return (
        <div>
            <TopHeader
                title="Gold Mining"
                subtitle="Subscribe to gold storage plans and earn daily returns"
            />

            <div style={{ padding: '28px' }}>
                {/* ── 统计卡片行 ── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' }}>
                    {[
                        { label: 'Total Invested', value: `$${myOrders.reduce((s, o) => s + (Number(o.amount) || 0), 0).toFixed(2)}` },
                        { label: 'Daily Earnings', value: '$0.00' },
                        { label: 'Total Earned', value: `$${myOrders.reduce((s, o) => s + (Number(o.totalEarned) || 0), 0).toFixed(2)}` },
                    ].map(stat => (
                        <div key={stat.label} className="card" style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                                {stat.label}
                            </div>
                            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-gold-primary)' }}>
                                {stat.value}
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── 挖矿计划卡片 Grid ── */}
                <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Available Plans</h2>
                {isLoading ? (
                    <div style={{ color: 'var(--color-text-secondary)', padding: '20px 0' }}>Loading plans...</div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', marginBottom: '36px' }}>
                        {products.map(product => (
                            <div key={product.id} className="card" style={{
                                border: '1px solid var(--color-border-gold)',
                                position: 'relative', overflow: 'hidden',
                            }}>
                                {/* 金色装饰顶条 */}
                                <div style={{
                                    position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
                                    background: 'linear-gradient(90deg, var(--color-gold-primary), var(--color-gold-light))',
                                }} />
                                <div style={{ paddingTop: '8px' }}>
                                    <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}>{product.name}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>Daily Income Plan</div>

                                    {/* 日利率（大字显示） */}
                                    <div style={{ fontSize: '36px', fontWeight: 700, color: 'var(--color-gold-primary)', lineHeight: 1 }}>
                                        {(Number(product.dailyRate) || 0).toFixed(2)}%
                                    </div>
                                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>per day</div>

                                    <div className="divider" />

                                    {/* 详情 */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                                        <span style={{ color: 'var(--color-text-secondary)' }}>Duration</span>
                                        <span style={{ fontWeight: 600 }}>{product.period} Day{product.period > 1 ? 's' : ''}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '13px' }}>
                                        <span style={{ color: 'var(--color-text-secondary)' }}>Min. Amount</span>
                                        <span style={{ fontWeight: 600 }}>${(Number(product.minAmount) || 0).toLocaleString()} USDT</span>
                                    </div>

                                    {/* 购买按钮 */}
                                    <button
                                        className="btn-gold"
                                        style={{ width: '100%' }}
                                        onClick={() => setSelectedProduct(product)}
                                    >
                                        Subscribe Now
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── 我的挖矿订单 ── */}
                <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>My Mining Orders</h2>
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    {/* Tab 切换 */}
                    <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)' }}>
                        {(['active', 'completed'] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setOrdersTab(tab)}
                                style={{
                                    padding: '12px 24px', border: 'none', cursor: 'pointer',
                                    background: 'transparent', fontSize: '14px', fontWeight: 500,
                                    color: ordersTab === tab ? 'var(--color-gold-primary)' : 'var(--color-text-secondary)',
                                    borderBottom: ordersTab === tab ? '2px solid var(--color-gold-primary)' : '2px solid transparent',
                                    transition: 'all 0.2s',
                                }}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        ))}
                    </div>

                    {/* 订单表格 */}
                    {filteredOrders.length === 0 ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                            No {ordersTab} orders
                        </div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: 'var(--color-bg-input)', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                                    {['Plan', 'Amount (USDT)', 'Daily Rate', 'Earned', 'End Date', 'Status'].map(h => (
                                        <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOrders.map((order, i) => (
                                    <tr key={order.id} style={{ borderTop: '1px solid var(--color-border)' }}>
                                        <td style={{ padding: '14px 16px', fontSize: '14px' }}>{order.productName}</td>
                                        <td style={{ padding: '14px 16px', fontWeight: 600 }}>${(Number(order.amount) || 0).toFixed(2)}</td>
                                        <td style={{ padding: '14px 16px', color: 'var(--color-gold-primary)' }}>{order.dailyRate}%</td>
                                        <td style={{ padding: '14px 16px', color: 'var(--color-green)' }}>+${(Number(order.totalEarned) || 0).toFixed(4)}</td>
                                        <td style={{ padding: '14px 16px', color: 'var(--color-text-secondary)', fontSize: '13px' }}>{order.endDate}</td>
                                        <td style={{ padding: '14px 16px' }}>
                                            <span className={`badge ${order.status === 'active' ? 'badge-green' : 'badge-gold'}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* ── 购买弹窗（Modal） ── */}
            {selectedProduct && (
                <div style={{
                    position: 'fixed', inset: 0,
                    background: 'rgba(0,0,0,0.7)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000,
                }}>
                    <div className="card" style={{ width: '400px', maxWidth: '90vw' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Subscribe Plan</h3>
                            <button
                                onClick={() => { setSelectedProduct(null); setSubmitError(''); }}
                                style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: '18px' }}
                            >×</button>
                        </div>

                        <div style={{ marginBottom: '12px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                            {selectedProduct.name} — {selectedProduct.dailyRate}%/day × {selectedProduct.period} day(s)
                        </div>

                        {/* 金额输入 */}
                        <label style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Amount (USDT)</label>
                        <input
                            className="input-field"
                            type="number"
                            placeholder={`Min. ${selectedProduct.minAmount}`}
                            value={subscribeAmount}
                            onChange={e => setSubscribeAmount(e.target.value)}
                            style={{ marginTop: '6px', marginBottom: '14px' }}
                        />

                        {/* 资金密码 */}
                        <label style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Fund Password</label>
                        <input
                            className="input-field"
                            type="password"
                            placeholder="Enter fund password"
                            value={fundPassword}
                            onChange={e => setFundPassword(e.target.value)}
                            style={{ marginTop: '6px', marginBottom: '8px' }}
                        />

                        {/* 错误提示 */}
                        {submitError && (
                            <div style={{ color: 'var(--color-red)', fontSize: '13px', marginBottom: '12px' }}>
                                {submitError}
                            </div>
                        )}

                        <button
                            className="btn-gold"
                            style={{ width: '100%', marginTop: '8px' }}
                            onClick={handleSubscribe}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Processing...' : 'Confirm Subscribe'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
