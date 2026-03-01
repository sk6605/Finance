'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { getKlineDataApi } from '@/lib/api/marketApi';
import { priceWS } from '@/lib/websocket/priceWebSocket';
import { KlineCandle, MarketTicker } from '@/types';
import { useMarketStore } from '@/store/marketStore';

const KLINE_PERIODS = ['1min', '5min', '15min', '1H', '4H', '1D'] as const;
type KlinePeriod = typeof KLINE_PERIODS[number];

export default function TradingChart({ symbol, isActive }: { symbol: string; isActive: boolean }) {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<any>(null);
    const candleSeriesRef = useRef<any>(null);
    const [klinePeriod, setKlinePeriod] = useState<KlinePeriod>('1min');
    const [klineLoading, setKlineLoading] = useState(false);

    const currentTicker = useMarketStore(state => state.tickers[symbol]);

    /* ── 初始化 TradingView Lightweight Chart ── */
    useEffect(() => {
        if (!chartContainerRef.current) return;

        let chart: any;
        let isMounted = true;

        import('lightweight-charts').then(({ createChart, CandlestickSeries }) => {
            if (!isMounted) return;

            // 为了让隐藏的图表也能计算正确宽度，直接取父级或者设为 100%
            const { clientWidth } = chartContainerRef.current!;
            const width = clientWidth > 0 ? clientWidth : 800; // fallback width

            chart = createChart(chartContainerRef.current!, {
                width: width,
                height: 420,
                layout: {
                    background: { color: '#090e1a' },
                    textColor: '#8899aa',
                },
                grid: {
                    vertLines: { color: '#1e3055' },
                    horzLines: { color: '#1e3055' },
                },
                crosshair: { mode: 1 },
                rightPriceScale: { borderColor: '#1e3055' },
                timeScale: { borderColor: '#1e3055', timeVisible: true },
            });

            const candleSeries = chart.addSeries(CandlestickSeries, {
                upColor: '#00c896',
                downColor: '#ff4757',
                borderDownColor: '#ff4757',
                borderUpColor: '#00c896',
                wickDownColor: '#ff4757',
                wickUpColor: '#00c896',
            });

            chartRef.current = chart;
            candleSeriesRef.current = candleSeries;

            const handleResize = () => {
                if (chartContainerRef.current) {
                    chart.applyOptions({ width: chartContainerRef.current.clientWidth });
                }
            };
            window.addEventListener('resize', handleResize);

            // 如果已经选定了周期，立即加载数据
            loadKlineData();
        });

        return () => {
            isMounted = false;
            // 简单的防泄漏
            if (chart) {
                chart.remove();
            }
            window.removeEventListener('resize', () => { });
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /* ── 加载 K 线数据 ── */
    const loadKlineData = useCallback(async () => {
        if (!candleSeriesRef.current) return;
        setKlineLoading(true);
        try {
            const candles: KlineCandle[] = await getKlineDataApi(symbol, klinePeriod);
            const chartData = candles
                .sort((a, b) => a.time - b.time)
                .map(c => ({ time: c.time, open: c.open, high: c.high, low: c.low, close: c.close }));
            candleSeriesRef.current.setData(chartData);
        } catch (err) {
            console.error(`[TradingChart ${symbol}] K 线加载失败:`, err);
        } finally {
            setKlineLoading(false);
        }
    }, [symbol, klinePeriod]);

    // 当周期改变时重新加载
    useEffect(() => {
        loadKlineData();
    }, [loadKlineData]);

    /* ── 激活时重新适应尺寸（解决隐藏转显示时的尺寸 bug） ── */
    useEffect(() => {
        if (isActive && chartRef.current && chartContainerRef.current) {
            // setTimeout 保证 DOM 已经渲染为 display block / visibility visible
            setTimeout(() => {
                if (chartContainerRef.current && chartRef.current) {
                    chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
                }
            }, 50);
        }
    }, [isActive]);

    /* ── WebSocket 持续接收更新（即使在后台隐藏） ── */
    useEffect(() => {
        const handleTick = (ticker: MarketTicker) => {
            if (candleSeriesRef.current) {
                const now = Math.floor(Date.now() / 1000);
                candleSeriesRef.current.update({
                    time: now,
                    open: ticker.price,
                    high: ticker.high24h,
                    low: ticker.low24h,
                    close: ticker.price,
                });
            }
        };
        // 组件挂载就开始订阅自己的独立数据流
        priceWS.subscribe(symbol, handleTick);
        return () => priceWS.unsubscribe(symbol, handleTick);
    }, [symbol]);

    return (
        <div style={{
            // 使用 absolute 隐藏可以防止丢失内部状态，但如果用 display:none 更省性能。
            //由于我们在 isActive 时加了 applyOptions 修复尺寸，这里可以直接用 display
            display: isActive ? 'block' : 'none',
            width: '100%',
        }}>
            {/* 当前价格 + K 线周期选择 */}
            <div className="card" style={{ marginBottom: '8px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <span style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'monospace' }}>
                        {currentTicker ? currentTicker.price.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '—'}
                    </span>
                    <span style={{ marginLeft: '10px', fontSize: '12px', color: (currentTicker?.changePercent24h ?? 0) >= 0 ? 'var(--color-green)' : 'var(--color-red)' }}>
                        {currentTicker ? `${currentTicker.changePercent24h >= 0 ? '+' : ''}${currentTicker.changePercent24h.toFixed(2)}%` : ''}
                    </span>
                </div>
                {/* 时间周期按钮 */}
                <div style={{ display: 'flex', gap: '4px' }}>
                    {KLINE_PERIODS.map(p => (
                        <button key={p} onClick={() => setKlinePeriod(p)} style={{
                            padding: '5px 10px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 500,
                            background: klinePeriod === p ? 'var(--color-gold-primary)' : 'var(--color-bg-input)',
                            color: klinePeriod === p ? '#000' : 'var(--color-text-secondary)',
                        }}>{p}</button>
                    ))}
                </div>
            </div>

            {/* K 线图容器 */}
            <div className="card" style={{ padding: 0, overflow: 'hidden', position: 'relative' }}>
                {klineLoading && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(9,14,26,0.7)', zIndex: 10 }}>
                        <span style={{ color: 'var(--color-text-secondary)' }}>Loading chart...</span>
                    </div>
                )}
                <div ref={chartContainerRef} style={{ width: '100%' }} />
            </div>
        </div>
    );
}
