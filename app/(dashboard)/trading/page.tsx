/* ============================================================
   app/(dashboard)/trading/page.tsx — 期权 & 合约交易页
   功能：
   - 交易对选择器（XAUUSD、XAGUSD 等）
   - Tab 切换：Option（期权）| Contract（合约）
   - 左侧：K 线蜡烛图（TradingView Lightweight Charts），实时更新
   - 右侧：下单面板（期权：买涨/跌；合约：做多/空）
   - 下方：当前持仓/活跃订单表
   ============================================================ */

'use client';

import { useEffect, useState } from 'react';
import TopHeader from '@/components/layout/TopHeader';
import { useMarketStore } from '@/store/marketStore';
import { useAuthStore } from '@/store/authStore';
import { getOptionProductsApi, placeOptionOrderApi, getMyOptionOrdersApi } from '@/lib/api/tradingApi';
import { priceWS } from '@/lib/websocket/priceWebSocket';
import { MarketTicker, OptionOrder, OptionProduct } from '@/types';
import TradingChart from '@/components/trading/TradingChart';
import ExchangeRateModal from '@/components/trading/ExchangeRateModal';

const SYMBOL_COLOR: Record<string, string> = {
    XAUUSD: '#d4af37', XAGUSD: '#c0c0c0', XPTUSD: '#a8a9ad',
    XPDUSD: '#b0a090', XNIUSD: '#7a9ab0', XCUUSD: '#b87333',
};

type TradeTab = 'option' | 'contract';
const LEVERAGE_OPTIONS = [1, 2, 3, 5, 10];

export default function TradingPage() {
    const {
        selectedSymbol, setSelectedSymbol,
        tickers, updateTicker,
        activeTabs, removeTab
    } = useMarketStore();
    const { user } = useAuthStore();

    const [tradeTab, setTradeTab] = useState<TradeTab>('option');
    const [optionProducts, setOptionProducts] = useState<OptionProduct[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<OptionProduct | null>(null);
    const [tradeAmount, setTradeAmount] = useState('');
    const [activeOrders, setActiveOrders] = useState<OptionOrder[]>([]);
    const [orderSubmitting, setOrderSubmitting] = useState(false);
    const [orderMsg, setOrderMsg] = useState('');
    const [leverage, setLeverage] = useState(1);
    const [contractMargin, setContractMargin] = useState('');
    const [tpPrice, setTpPrice] = useState('');
    const [slPrice, setSlPrice] = useState('');
    const [showExchangeModal, setShowExchangeModal] = useState(false);

    useEffect(() => {
        import('@/lib/api/marketApi').then(({ getMarketTickersApi }) => {
            getMarketTickersApi().then(data => {
                const { setTickers } = useMarketStore.getState();
                setTickers(data);
            }).catch(e => console.error('Failed to prefetch tickers:', e));
        });
    }, []);

    useEffect(() => {
        priceWS.connect();
        const callbacks = activeTabs.map(sym => {
            const handleTick = (ticker: MarketTicker) => { updateTicker(ticker); };
            priceWS.subscribe(sym, handleTick);
            return { symbol: sym, cb: handleTick };
        });
        return () => { callbacks.forEach(({ symbol, cb }) => priceWS.unsubscribe(symbol, cb)); };
    }, [activeTabs, updateTicker]);

    useEffect(() => {
        const load = async () => {
            try {
                const [products, orders] = await Promise.all([
                    getOptionProductsApi(),
                    getMyOptionOrdersApi(),
                ]);
                setOptionProducts(products);
                setActiveOrders(orders);
                if (products.length > 0) setSelectedProduct(products[0]);
            } catch (err) {
                console.error('[TradingPage] 加载期权配置失败:', err);
            }
        };
        load();
    }, []);

    const handleOptionOrder = async (direction: 'up' | 'down') => {
        setOrderMsg('');
        if (!tradeAmount || Number(tradeAmount) <= 0) return setOrderMsg('Please enter a valid amount');
        if (!selectedProduct) return setOrderMsg('Please select a time period');
        setOrderSubmitting(true);
        try {
            const order = await placeOptionOrderApi({
                symbol: selectedSymbol,
                money: Number(tradeAmount),
                setId: selectedProduct.id,
                type: direction === 'up' ? 1 : 2,
            });
            setActiveOrders(prev => [order, ...prev]);
            setOrderMsg(`Order placed: ${direction.toUpperCase()} $${tradeAmount}`);
            setTradeAmount('');
        } catch (err: unknown) {
            setOrderMsg(err instanceof Error ? err.message : 'Order failed');
        } finally {
            setOrderSubmitting(false);
        }
    };

    const getSymbolColor = (s: string) => {
        if (SYMBOL_COLOR[s]) return SYMBOL_COLOR[s];
        const colors = ['#7a9ab0', '#b87333', '#1e90ff', '#32cd32', '#9370db', '#f08080'];
        let hash = 0;
        for (let i = 0; i < s.length; i++) hash = s.charCodeAt(i) + ((hash << 5) - hash);
        return colors[Math.abs(hash) % colors.length];
    };

    return (
        <div>
            <TopHeader title="Trading" subtitle="Options & Contract trading on gold and precious metals" />

            <div style={{ padding: '20px 28px' }}>

                {/* ── 顶部：Trading Currency + Exchange Rates ── */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>
                        Trading Currency:&nbsp;
                        <strong style={{ color: 'var(--color-gold-primary)', fontSize: '14px', marginLeft: '4px' }}>USD</strong>
                    </div>
                    <button
                        onClick={() => setShowExchangeModal(true)}
                        style={{
                            background: 'var(--color-bg-input)',
                            border: '1px solid var(--color-border)',
                            padding: '8px 16px',
                            borderRadius: 'var(--radius-sm)',
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '6px',
                            fontSize: '13px', fontWeight: 600,
                            color: 'var(--color-text-primary)',
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-gold-primary)')}
                        onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--color-border)')}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                        </svg>
                        Exchange Rates
                    </button>
                </div>

                {/* ── 交易对 Tabs ── */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '4px' }}>
                    {activeTabs.map(sym => {
                        const ticker = tickers[sym];
                        const isActive = sym === selectedSymbol;
                        const isUp = (ticker?.changePercent24h ?? 0) >= 0;
                        const color = getSymbolColor(sym);

                        return (
                            <div
                                key={sym}
                                onClick={() => setSelectedSymbol(sym)}
                                style={{
                                    /* FIX: larger box, centered content, generous padding */
                                    minWidth: '150px',
                                    padding: '14px 20px',
                                    borderRadius: 'var(--radius-sm)',
                                    cursor: 'pointer',
                                    background: isActive ? 'var(--color-bg-hover)' : 'var(--color-bg-card)',
                                    border: `2px solid ${isActive ? color : 'var(--color-border)'}`,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '4px',
                                    position: 'relative',
                                    textAlign: 'center',
                                }}
                            >
                                <span style={{ fontWeight: 700, fontSize: '14px', color: isActive ? color : 'var(--color-text-primary)' }}>
                                    {sym}
                                </span>
                                <span style={{ fontSize: '12px', fontFamily: 'monospace', color: isUp ? 'var(--color-green)' : 'var(--color-red)' }}>
                                    {ticker
                                        ? `${ticker.price.toFixed(2)} ${isUp ? '▲' : '▼'}${Math.abs(ticker.changePercent24h).toFixed(2)}%`
                                        : '— —'}
                                </span>
                                {/* × 关闭 */}
                                <button
                                    onClick={e => { e.stopPropagation(); removeTab(sym); }}
                                    style={{
                                        position: 'absolute', top: '6px', right: '8px',
                                        background: 'transparent', border: 'none',
                                        color: 'var(--color-text-secondary)', cursor: 'pointer',
                                        fontSize: '15px', lineHeight: 1, padding: '2px',
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-red)')}
                                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-secondary)')}
                                    title="Remove"
                                >×</button>
                            </div>
                        );
                    })}
                </div>

                {/* ── Main Grid: Chart (left) + Order Panel (right) ── */}
                {/* FIX: right column is now 420px so everything has room */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px', alignItems: 'start' }}>

                    {/* LEFT: Chart — fills the full available height of the row */}
                    <div style={{ position: 'relative', minHeight: '480px' }}>
                        {activeTabs.map(sym => (
                            <TradingChart key={sym} symbol={sym} isActive={sym === selectedSymbol} />
                        ))}
                    </div>

                    {/* RIGHT: Order Panel */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

                        {/* Option / Contract Toggle */}
                        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                            <div style={{ display: 'flex' }}>
                                {(['option', 'contract'] as TradeTab[]).map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setTradeTab(tab)}
                                        style={{
                                            flex: 1, padding: '15px', border: 'none', cursor: 'pointer',
                                            background: tradeTab === tab ? 'var(--color-bg-hover)' : 'var(--color-bg-card)',
                                            color: tradeTab === tab ? 'var(--color-gold-primary)' : 'var(--color-text-secondary)',
                                            fontWeight: tradeTab === tab ? 700 : 400,
                                            fontSize: '14px',
                                            borderBottom: tradeTab === tab
                                                ? '2px solid var(--color-gold-primary)'
                                                : '2px solid transparent',
                                        }}
                                    >
                                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* ── OPTION Panel ── */}
                        {tradeTab === 'option' && (
                            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

                                {/* Balance */}
                                <div style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '12px 16px',
                                    background: 'var(--color-bg-input)',
                                    borderRadius: 'var(--radius-sm)',
                                }}>
                                    <span style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>Balance</span>
                                    <span style={{ fontWeight: 700, color: 'var(--color-gold-primary)', fontSize: '15px' }}>20.00 USDT</span>
                                </div>

                                {/* Amount Input — FIX: taller input, bigger font */}
                                <div>
                                    <label style={{ fontSize: '13px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '8px' }}>
                                        Amount (USDT)
                                    </label>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <input
                                            className="input-field"
                                            type="number"
                                            placeholder="0.00"
                                            value={tradeAmount}
                                            onChange={e => setTradeAmount(e.target.value)}
                                            style={{ flex: 1, fontSize: '15px', padding: '12px 14px' }}
                                        />
                                        <button
                                            onClick={() => setTradeAmount('20')}
                                            style={{
                                                padding: '12px 18px',
                                                background: 'var(--color-bg-input)',
                                                border: '1px solid var(--color-border)',
                                                borderRadius: 'var(--radius-sm)',
                                                color: 'var(--color-text-secondary)',
                                                cursor: 'pointer',
                                                fontSize: '13px', fontWeight: 600,
                                                whiteSpace: 'nowrap',
                                                flexShrink: 0,
                                            }}
                                            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-gold-primary)')}
                                            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--color-border)')}
                                        >MAX</button>
                                    </div>
                                </div>

                                {/* Time Period */}
                                <div>
                                    <label style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '6px' }}>
                                        Time Period
                                    </label>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                                        {optionProducts.map(p => (
                                            <button
                                                key={p.id}
                                                onClick={() => setSelectedProduct(p)}
                                                style={{
                                                    padding: '7px 12px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '12px', fontWeight: 500,
                                                    background: selectedProduct?.id === p.id ? 'var(--color-gold-primary)' : 'var(--color-bg-input)',
                                                    color: selectedProduct?.id === p.id ? '#000' : 'var(--color-text-secondary)',
                                                    border: `1px solid ${selectedProduct?.id === p.id ? 'var(--color-gold-primary)' : 'var(--color-border)'}`,
                                                }}
                                                onMouseEnter={e => {
                                                    if (selectedProduct?.id !== p.id) {
                                                        e.currentTarget.style.borderColor = 'var(--color-gold-primary)';
                                                        e.currentTarget.style.color = 'var(--color-text-primary)';
                                                    }
                                                }}
                                                onMouseLeave={e => {
                                                    if (selectedProduct?.id !== p.id) {
                                                        e.currentTarget.style.borderColor = 'var(--color-border)';
                                                        e.currentTarget.style.color = 'var(--color-text-secondary)';
                                                    }
                                                }}
                                            >
                                                {p.periodLabel}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Profit Rate */}
                                {selectedProduct && (
                                    <div style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        padding: '12px 16px',
                                        background: '#d4af3710',
                                        border: '1px solid var(--color-border-gold)',
                                        borderRadius: 'var(--radius-sm)',
                                    }}>
                                        <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>Profit Rate</span>
                                        <span style={{ fontWeight: 700, color: 'var(--color-gold-primary)', fontSize: '15px' }}>
                                            {selectedProduct.profitRate}%
                                        </span>
                                    </div>
                                )}

                                {/* Order Message */}
                                {orderMsg && (
                                    <div style={{
                                        fontSize: '13px', padding: '10px 14px', borderRadius: 'var(--radius-sm)',
                                        background: (orderMsg.includes('failed') || orderMsg.includes('Please')) ? '#ff475710' : '#00c89610',
                                        color: (orderMsg.includes('failed') || orderMsg.includes('Please')) ? 'var(--color-red)' : 'var(--color-green)',
                                    }}>
                                        {orderMsg}
                                    </div>
                                )}

                                {/* BUY UP / BUY DOWN */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <button
                                        onClick={() => handleOptionOrder('up')}
                                        disabled={orderSubmitting}
                                        style={{
                                            padding: '16px', background: 'var(--color-green)', color: '#fff',
                                            border: 'none', borderRadius: 'var(--radius-sm)', cursor: orderSubmitting ? 'not-allowed' : 'pointer',
                                            fontWeight: 700, fontSize: '15px', opacity: orderSubmitting ? 0.6 : 1,
                                            transition: 'opacity 0.2s',
                                        }}
                                    >
                                        ▲ BUY UP
                                    </button>
                                    <button
                                        onClick={() => handleOptionOrder('down')}
                                        disabled={orderSubmitting}
                                        style={{
                                            padding: '16px', background: 'var(--color-red)', color: '#fff',
                                            border: 'none', borderRadius: 'var(--radius-sm)', cursor: orderSubmitting ? 'not-allowed' : 'pointer',
                                            fontWeight: 700, fontSize: '15px', opacity: orderSubmitting ? 0.6 : 1,
                                            transition: 'opacity 0.2s',
                                        }}
                                    >
                                        ▼ BUY DOWN
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ── CONTRACT Panel ── */}
                        {tradeTab === 'contract' && (
                            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

                                <div style={{
                                    padding: '12px 16px', background: 'var(--color-bg-input)',
                                    borderRadius: 'var(--radius-sm)', fontSize: '14px',
                                    color: 'var(--color-text-secondary)',
                                    display: 'flex', justifyContent: 'space-between',
                                }}>
                                    <span>Margin Mode</span>
                                    <strong style={{ color: 'var(--color-text-primary)' }}>Isolated</strong>
                                </div>

                                <div>
                                    <label style={{ fontSize: '13px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '8px' }}>Leverage</label>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        {LEVERAGE_OPTIONS.map(lev => (
                                            <button
                                                key={lev}
                                                onClick={() => setLeverage(lev)}
                                                style={{
                                                    flex: 1, padding: '10px 0',
                                                    border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                                                    fontSize: '13px', fontWeight: 700,
                                                    background: leverage === lev ? 'var(--color-gold-primary)' : 'var(--color-bg-input)',
                                                    color: leverage === lev ? '#000' : 'var(--color-text-secondary)',
                                                }}
                                            >{lev}X</button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label style={{ fontSize: '13px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '8px' }}>Margin (USDT)</label>
                                    <input
                                        className="input-field"
                                        type="number" placeholder="0.00"
                                        value={contractMargin} onChange={e => setContractMargin(e.target.value)}
                                        style={{ fontSize: '15px', padding: '12px 14px' }}
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div>
                                        <label style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                            TP Price <span style={{ color: 'var(--color-green)', fontSize: '11px' }}>Opt</span>
                                        </label>
                                        <input
                                            className="input-field"
                                            type="number" placeholder="Take Profit"
                                            value={tpPrice} onChange={e => setTpPrice(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                            SL Price <span style={{ color: 'var(--color-red)', fontSize: '11px' }}>Opt</span>
                                        </label>
                                        <input
                                            className="input-field"
                                            type="number" placeholder="Stop Loss"
                                            value={slPrice} onChange={e => setSlPrice(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <button style={{ padding: '16px', background: 'var(--color-green)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 700, fontSize: '15px' }}>
                                        ▲ LONG
                                    </button>
                                    <button style={{ padding: '16px', background: 'var(--color-red)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 700, fontSize: '15px' }}>
                                        ▼ SHORT
                                    </button>
                                </div>
                            </div>
                        )}

                    </div>
                </div>

                {/* ── Active Orders Table ── */}
                <div className="card" style={{ marginTop: '20px', padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--color-border)', fontWeight: 600, fontSize: '14px' }}>
                        Active Orders
                    </div>
                    {activeOrders.length === 0 ? (
                        <div style={{ padding: '30px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>No active orders</div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: 'var(--color-bg-input)', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                                    {['Symbol', 'Direction', 'Amount', 'Open Price', 'Expires', 'Status'].map(h => (
                                        <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontWeight: 600 }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {activeOrders.map(order => (
                                    <tr key={order.id} style={{ borderTop: '1px solid var(--color-border)' }}>
                                        <td style={{ padding: '12px 20px', fontWeight: 600 }}>{order.symbol}</td>
                                        <td style={{ padding: '12px 20px' }}>
                                            <span style={{ color: order.direction === 'up' ? 'var(--color-green)' : 'var(--color-red)', fontWeight: 600 }}>
                                                {order.direction === 'up' ? '▲ UP' : '▼ DOWN'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px 20px' }}>${order.amount}</td>
                                        <td style={{ padding: '12px 20px', fontFamily: 'monospace' }}>{order.openPrice}</td>
                                        <td style={{ padding: '12px 20px', color: 'var(--color-text-secondary)', fontSize: '13px' }}>{order.expiresAt}</td>
                                        <td style={{ padding: '12px 20px' }}><span className="badge badge-gold">active</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {showExchangeModal && <ExchangeRateModal onClose={() => setShowExchangeModal(false)} />}
            </div>
        </div>
    );
}
