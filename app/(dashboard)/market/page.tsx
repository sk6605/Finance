/* ============================================================
   app/(dashboard)/market/page.tsx — 市场行情首页
   功能：
   - 展示所有交易对的实时价格列表（XAUUSD、XAGUSD 等）
   - 显示 24H 涨跌幅、成交量
   - 点击行可跳转至交易页选中该交易对
   - 页面加载时自动拉取行情，并通过 WebSocket 实时更新
   ============================================================ */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import TopHeader from '@/components/layout/TopHeader';
import { getMarketTickersApi } from '@/lib/api/marketApi';
import { priceWS } from '@/lib/websocket/priceWebSocket';
import { useMarketStore } from '@/store/marketStore';
import { MarketTicker } from '@/types';

// 所有交易对的显示名称和图标颜色映射
const SYMBOL_META: Record<string, { name: string; color: string }> = {
    XAUUSD: { name: 'Gold / USD', color: '#d4af37' },
    XAGUSD: { name: 'Silver / USD', color: '#c0c0c0' },
    XPTUSD: { name: 'Platinum / USD', color: '#a8a9ad' },
    XPDUSD: { name: 'Palladium / USD', color: '#b0a090' },
    XNIUSD: { name: 'Nickel / USD', color: '#7a9ab0' },
    XCUUSD: { name: 'Copper / USD', color: '#b87333' },
};

export default function MarketPage() {
    const router = useRouter();
    const { tickers, setTickers, updateTicker, setSelectedSymbol, setLoading, isLoading } = useMarketStore();
    const [error, setError] = useState<string | null>(null);

    /* ── 首次加载：从 API 拉取所有行情 ── */
    useEffect(() => {
        const fetchTickers = async () => {
            setLoading(true);
            try {
                const data = await getMarketTickersApi();
                setTickers(data);
            } catch (err) {
                setError('Failed to load market data');
                console.error('[MarketPage] 加载行情失败:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchTickers();
    }, [setTickers, setLoading]);

    /* ── WebSocket：订阅所有交易对的实时价格推送 ── */
    useEffect(() => {
        priceWS.connect();
        const symbols = Object.keys(SYMBOL_META);

        // 为每个交易对注册价格更新回调
        const callbacks: Array<{ symbol: string; cb: (t: MarketTicker) => void }> = symbols.map(symbol => {
            const cb = (ticker: MarketTicker) => updateTicker(ticker);
            priceWS.subscribe(symbol, cb);
            return { symbol, cb };
        });

        // 组件卸载时取消所有订阅
        return () => {
            callbacks.forEach(({ symbol, cb }) => priceWS.unsubscribe(symbol, cb));
        };
    }, [updateTicker]);

    /* ── 点击行：切换交易对并跳转交易页 ── */
    const handleRowClick = useCallback((symbol: string) => {
        setSelectedSymbol(symbol);
        router.push('/trading');
    }, [router, setSelectedSymbol]);

    // 计算渐变背景色
    const getSymbolColor = (symbol: string) => {
        if (SYMBOL_META[symbol]) return SYMBOL_META[symbol].color;
        // 伪随机颜色
        const colors = ['#7a9ab0', '#b87333', '#1e90ff', '#32cd32', '#9370db', '#f08080'];
        let hash = 0;
        for (let i = 0; i < symbol.length; i++) hash = symbol.charCodeAt(i) + ((hash << 5) - hash);
        return colors[Math.abs(hash) % colors.length];
    };

    // 获取数据列表（直接使用 API 返回的数据，不再只过滤 SYMBOL_META）
    const tickerList = Object.values(tickers).filter(Boolean) as MarketTicker[];

    return (
        <div>
            <TopHeader
                title="Market Overview"
                subtitle="Live market prices — click any row to trade"
            />

            <div style={{ padding: '28px' }}>
                {/* ── 错误提示 ── */}
                {error && (
                    <div style={{
                        background: '#ff475710', border: '1px solid var(--color-red)',
                        borderRadius: 'var(--radius-sm)', padding: '12px 16px',
                        color: 'var(--color-red)', marginBottom: '20px',
                    }}>
                        {error}
                    </div>
                )}

                {/* ── 市场行情表格 ── */}
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    {/* 表头 */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 160px 140px 160px 140px',
                        padding: '14px 20px',
                        background: 'var(--color-bg-input)',
                        borderBottom: '1px solid var(--color-border)',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: 'var(--color-text-secondary)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                    }}>
                        <span>Asset</span>
                        <span style={{ textAlign: 'right' }}>Price (USD)</span>
                        <span style={{ textAlign: 'right' }}>24H Change</span>
                        <span style={{ textAlign: 'right' }}>24H Volume</span>
                        <span style={{ textAlign: 'right' }}>Action</span>
                    </div>

                    {/* 加载中占位 */}
                    {isLoading && (
                        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                            Loading market data...
                        </div>
                    )}

                    {/* 数据行 */}
                    {tickerList.map((ticker, index) => {
                        const metaName = SYMBOL_META[ticker.symbol]?.name || ticker.symbol;
                        const metaColor = getSymbolColor(ticker.symbol);
                        const isUp = ticker.changePercent24h >= 0;

                        return (
                            <div
                                key={ticker.symbol}
                                onClick={() => handleRowClick(ticker.symbol)}
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 160px 140px 160px 140px',
                                    padding: '16px 20px',
                                    borderBottom: index < tickerList.length - 1 ? '1px solid var(--color-border)' : 'none',
                                    cursor: 'pointer',
                                    transition: 'background 0.15s',
                                    alignItems: 'center',
                                }}
                                onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg-hover)')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            >
                                {/* 资产名称 + 图标 */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{
                                        width: 40, height: 40,
                                        background: metaColor + '20',
                                        border: `1px solid ${metaColor}40`,
                                        borderRadius: '50%',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '10px', fontWeight: 700, color: metaColor,
                                    }}>
                                        {ticker.symbol.slice(0, 3)}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '15px' }}>{ticker.symbol}</div>
                                        <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{metaName}</div>
                                    </div>
                                </div>

                                {/* 当前价格 */}
                                <div style={{ textAlign: 'right', fontWeight: 600, fontSize: '15px', fontFamily: 'monospace' }}>
                                    {ticker.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                                </div>

                                {/* 24H 涨跌幅 */}
                                <div style={{ textAlign: 'right' }}>
                                    <span className={isUp ? 'price-up' : 'price-down'} style={{ fontWeight: 600 }}>
                                        {isUp ? '+' : ''}{ticker.changePercent24h.toFixed(2)}%
                                    </span>
                                </div>

                                {/* 24H 成交量 */}
                                <div style={{ textAlign: 'right', color: 'var(--color-text-secondary)', fontSize: '14px' }}>
                                    {ticker.volume24h >= 1000
                                        ? `${(ticker.volume24h / 1000).toFixed(2)}K`
                                        : ticker.volume24h.toFixed(2)}
                                </div>

                                {/* 交易按钮 */}
                                <div style={{ textAlign: 'right' }}>
                                    <button
                                        className="btn-gold"
                                        style={{ padding: '7px 18px', fontSize: '13px' }}
                                        onClick={(e) => {
                                            e.stopPropagation(); // 防止触发行点击
                                            handleRowClick(ticker.symbol);
                                        }}
                                    >
                                        Trade
                                    </button>
                                </div>
                            </div>
                        );
                    })}

                    {/* 无数据占位 */}
                    {!isLoading && tickerList.length === 0 && !error && (
                        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                            No market data available
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
