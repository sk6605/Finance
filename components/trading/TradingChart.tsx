'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { getKlineDataApi } from '@/lib/api/marketApi';
import { priceWS } from '@/lib/websocket/priceWebSocket';
import { KlineCandle, MarketTicker } from '@/types';
import { useMarketStore } from '@/store/marketStore';

const KLINE_PERIODS = ['1min', '5min', '15min', '1H', '4H', '1D'] as const;
type KlinePeriod = typeof KLINE_PERIODS[number];

function calculateSMA(data: any[], count: number) {
    const r = [];
    let sum = 0;
    for (let i = 0; i < data.length; ++i) {
        sum += data[i].close;
        if (i >= count - 1) {
            if (i >= count) {
                sum -= data[i - count].close;
            }
            r.push({ time: data[i].time, value: sum / count });
        }
    }
    return r;
}

// Format Large Volume
function formatVolume(vol: number) {
    if (vol >= 1000000) return (vol / 1000000).toFixed(3) + 'M';
    if (vol >= 1000) return (vol / 1000).toFixed(3) + 'k';
    return vol.toFixed(2);
}

export default function TradingChart({ symbol, isActive }: { symbol: string; isActive: boolean }) {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<any>(null);
    const candleSeriesRef = useRef<any>(null);
    const ma5SeriesRef = useRef<any>(null);
    const ma10SeriesRef = useRef<any>(null);
    const ma30SeriesRef = useRef<any>(null);
    const ma60SeriesRef = useRef<any>(null);

    const [klinePeriod, setKlinePeriod] = useState<KlinePeriod>('1min');
    const [klineLoading, setKlineLoading] = useState(false);
    const [rawData, setRawData] = useState<any[]>([]);

    // Tooltip and Legend states
    const [crosshairInfo, setCrosshairInfo] = useState<any>(null);
    const [maLabels, setMaLabels] = useState({ ma5: 0, ma10: 0, ma30: 0, ma60: 0 });

    const currentTicker = useMarketStore(state => state.tickers[symbol]);

    /* ── 初始化 TradingView Lightweight Chart ── */
    useEffect(() => {
        if (!chartContainerRef.current) return;

        let chart: any;
        let isMounted = true;

        import('lightweight-charts').then(({ createChart, CandlestickSeries, LineSeries }) => {
            if (!isMounted) return;

            const { clientWidth } = chartContainerRef.current!;
            const width = clientWidth > 0 ? clientWidth : 800;

            chart = createChart(chartContainerRef.current!, {
                width: width,
                height: 540,
                layout: {
                    background: { color: '#090e1a' },
                    textColor: '#8899aa',
                },
                grid: {
                    vertLines: { color: '#1e3055', style: 2 },
                    horzLines: { color: '#1e3055', style: 2 },
                },
                crosshair: {
                    mode: 1,
                    vertLine: { width: 1, color: '#4a5b7c', style: 0 },
                    horzLine: { width: 1, color: '#4a5b7c', style: 0 },
                },
                rightPriceScale: { borderColor: '#1e3055' },
                timeScale: { borderColor: '#1e3055', timeVisible: true },
            });

            const candleSeries = chart.addSeries(CandlestickSeries, {
                upColor: '#00c38c',
                downColor: '#f74959',
                borderDownColor: '#f74959',
                borderUpColor: '#00c38c',
                wickDownColor: '#f74959',
                wickUpColor: '#00c38c',
            });

            // MA Colors matching user screenshot exactly
            const cMA5 = '#FFA000';  // Orange
            const cMA10 = '#9C27B0'; // Purple
            const cMA30 = '#2196F3'; // Blue
            const cMA60 = '#E91E63'; // Pink

            const ma5Series = chart.addSeries(LineSeries, { color: cMA5, lineWidth: 1, crosshairMarkerVisible: false });
            const ma10Series = chart.addSeries(LineSeries, { color: cMA10, lineWidth: 1, crosshairMarkerVisible: false });
            const ma30Series = chart.addSeries(LineSeries, { color: cMA30, lineWidth: 1, crosshairMarkerVisible: false });
            const ma60Series = chart.addSeries(LineSeries, { color: cMA60, lineWidth: 1, crosshairMarkerVisible: false });

            chartRef.current = chart;
            candleSeriesRef.current = candleSeries;
            ma5SeriesRef.current = ma5Series;
            ma10SeriesRef.current = ma10Series;
            ma30SeriesRef.current = ma30Series;
            ma60SeriesRef.current = ma60Series;

            chart.subscribeCrosshairMove((param: any) => {
                const container = chartContainerRef.current;
                if (!param.time || param.point.x < 0 || param.point.x > container!.clientWidth || param.point.y < 0 || param.point.y > container!.clientHeight) {
                    setCrosshairInfo(null);
                    return;
                }

                const data = param.seriesData.get(candleSeries);
                const ma5 = param.seriesData.get(ma5Series);
                const ma10 = param.seriesData.get(ma10Series);
                const ma30 = param.seriesData.get(ma30Series);
                const ma60 = param.seriesData.get(ma60Series);

                if (data) {
                    // lightweight-charts time is in seconds for string/timestamp
                    // We need to output YYYY-MM-DD HH:mm format
                    const d = new Date(param.time * 1000);
                    // Handle UTC offset locally so it displays cleanly (or just use UTC string if we want standard)
                    const dateStr = d.toISOString().replace('T', ' ').substring(0, 16);

                    setCrosshairInfo({
                        x: param.point.x,
                        y: param.point.y,
                        time: dateStr,
                        timeRaw: param.time,
                        open: (data as any).open,
                        high: (data as any).high,
                        low: (data as any).low,
                        close: (data as any).close,
                    });

                    setMaLabels(prev => ({
                        ma5: ma5?.value || prev.ma5,
                        ma10: ma10?.value || prev.ma10,
                        ma30: ma30?.value || prev.ma30,
                        ma60: ma60?.value || prev.ma60,
                    }));
                }
            });

            const handleResize = () => {
                if (chartContainerRef.current) {
                    chart.applyOptions({ width: chartContainerRef.current.clientWidth });
                }
            };
            window.addEventListener('resize', handleResize);

            loadKlineData();
        });

        return () => {
            isMounted = false;
            if (chart) chart.remove();
            window.removeEventListener('resize', () => { });
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadKlineData = useCallback(async () => {
        if (!candleSeriesRef.current) return;
        setKlineLoading(true);
        try {
            const candles: KlineCandle[] = await getKlineDataApi(symbol, klinePeriod);
            const chartData = candles
                .sort((a, b) => a.time - b.time)
                .map(c => ({ time: c.time, open: c.open, high: c.high, low: c.low, close: c.close, volume: c.volume }));

            setRawData(chartData);

            candleSeriesRef.current.setData(chartData);
            ma5SeriesRef.current.setData(calculateSMA(chartData, 5));
            ma10SeriesRef.current.setData(calculateSMA(chartData, 10));
            ma30SeriesRef.current.setData(calculateSMA(chartData, 30));
            ma60SeriesRef.current.setData(calculateSMA(chartData, 60));

            // Default legend values = latest candle
            if (chartData.length > 0) {
                const maList5 = calculateSMA(chartData, 5);
                const maList10 = calculateSMA(chartData, 10);
                const maList30 = calculateSMA(chartData, 30);
                const maList60 = calculateSMA(chartData, 60);

                setMaLabels({
                    ma5: maList5.length > 0 ? maList5[maList5.length - 1].value : 0,
                    ma10: maList10.length > 0 ? maList10[maList10.length - 1].value : 0,
                    ma30: maList30.length > 0 ? maList30[maList30.length - 1].value : 0,
                    ma60: maList60.length > 0 ? maList60[maList60.length - 1].value : 0,
                });
            }

        } catch (err) {
            console.error(`[TradingChart ${symbol}] K 线加载失败:`, err);
        } finally {
            setKlineLoading(false);
        }
    }, [symbol, klinePeriod]);

    useEffect(() => {
        loadKlineData();
    }, [loadKlineData]);

    const activeVolume = useMemo(() => {
        if (!crosshairInfo) return 0;
        const infoTime = crosshairInfo.timeRaw;
        const exactMatch = rawData.find(d => Number(d.time) === Number(infoTime));
        return exactMatch?.volume || 0;
    }, [crosshairInfo, rawData]);

    useEffect(() => {
        if (isActive && chartRef.current && chartContainerRef.current) {
            setTimeout(() => {
                if (chartContainerRef.current && chartRef.current) {
                    chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
                }
            }, 50);
        }
    }, [isActive]);

    useEffect(() => {
        const handleTick = (ticker: MarketTicker) => {
            if (candleSeriesRef.current && rawData.length > 0) {
                // To keep it simple and ensure the latest bar just bounces its price
                // and we don't spam infinite bars per minute, append to the very last timestamp.
                const lastTimestamp = rawData[rawData.length - 1].time;

                // Technically we should check if time crossed a new bar threshold based on klinePeriod,
                // but for live visual ticks, this bounces the very final candle.
                candleSeriesRef.current.update({
                    time: lastTimestamp,
                    open: rawData[rawData.length - 1].open,
                    high: Math.max(rawData[rawData.length - 1].high, ticker.price),
                    low: Math.min(rawData[rawData.length - 1].low, ticker.price),
                    close: ticker.price,
                });
            }
        };
        priceWS.subscribe(symbol, handleTick);
        return () => priceWS.unsubscribe(symbol, handleTick);
    }, [symbol, rawData]);

    // Tooltip offset logic (keeps card from falling off edges)
    const tX = crosshairInfo?.x || 0;
    const tY = crosshairInfo?.y || 0;
    const tooltipLeft = tX > 200 ? tX - 180 : tX + 20;
    const tooltipTop = tY > 200 ? tY - 140 : tY + 20;

    return (
        <div className={`${isActive ? 'block' : 'hidden'} w-full`}>

            {/* Header: Label + Price + Buttons */}
            <div className="card" style={{ marginBottom: '8px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <span className="text-[28px] font-bold font-monospace">
                        {currentTicker ? currentTicker.price.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '—'}
                    </span>
                    <span className={`ml-2.5 text-[12px] ${(currentTicker?.changePercent24h ?? 0) >= 0 ? 'text-[var(--color-green)]' : 'text-[var(--color-red)]'}`}>
                        {currentTicker ? `${currentTicker.changePercent24h >= 0 ? '+' : ''}${currentTicker.changePercent24h.toFixed(2)}%` : ''}
                    </span>
                </div>
                <div className="flex gap-4">
                    {KLINE_PERIODS.map(p => (
                        <button key={p} onClick={() => setKlinePeriod(p)} style={{
                            padding: '5px 10px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 500,
                            background: klinePeriod === p ? 'var(--color-gold-primary)' : 'var(--color-bg-input)',
                            color: klinePeriod === p ? '#000' : 'var(--color-text-secondary)',
                        }}>{p}</button>
                    ))}
                </div>
            </div>

            {/* K 线图区域 */}
            <div className="card p-0 overflow-hidden relative">
                {klineLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#090e1a]/70 z-10">
                        <span className="text-[var(--color-text-secondary)]">Loading chart...</span>
                    </div>
                )}

                {/* 悬浮 MA Legend (Left Top inside chart) */}
                <div className="absolute top-12 left-12 z-[5] flex gap-3 text-xs font-bold pointer-events-none opacity-90 font-mono">
                    <span className="text-[#8899aa]">MA(5,10,30,60)</span>
                    <span className="text-[#FFA000]">MA5: {maLabels.ma5.toFixed(4)}</span>
                    <span className="text-[#9C27B0]">MA10: {maLabels.ma10.toFixed(4)}</span>
                    <span className="text-[#2196F3]">MA30: {maLabels.ma30.toFixed(4)}</span>
                    <span className="text-[#E91E63]">MA60: {maLabels.ma60.toFixed(4)}</span>
                </div>

                {/* 悬浮 Detail Card (Tooltip) on Crosshair hover */}
                {crosshairInfo && (
                    <div className="absolute z-20 bg-white border border-black/10 rounded-md px-3.5 py-2.5 shadow-[0_4px_12px_rgba(0,0,0,0.2)] min-w-[160px] pointer-events-none font-mono text-[#334E68] text-xs" style={{ left: tooltipLeft, top: tooltipTop }}>
                        <div className="flex justify-between mb-1">
                            <span className="text-[#829AB1]">Time:</span>
                            <span>{crosshairInfo.time}</span>
                        </div>
                        <div className="flex justify-between mb-[2px]">
                            <span className="text-[#829AB1]">Open:</span>
                            <span className="text-[#102A43]">{crosshairInfo.open.toFixed(4)}</span>
                        </div>
                        <div className="flex justify-between mb-[2px]">
                            <span className="text-[#829AB1]">High:</span>
                            <span className="text-[#102A43]">{crosshairInfo.high.toFixed(4)}</span>
                        </div>
                        <div className="flex justify-between mb-[2px]">
                            <span className="text-[#829AB1]">Low:</span>
                            <span className="text-[#102A43]">{crosshairInfo.low.toFixed(4)}</span>
                        </div>
                        <div className="flex justify-between mb-[2px]">
                            <span className="text-[#829AB1]">Close:</span>
                            <span className="text-[#102A43]">{crosshairInfo.close.toFixed(4)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-[#829AB1]">Volume:</span>
                            <span className="text-[#102A43]">{formatVolume(activeVolume)}</span>
                        </div>
                    </div>
                )}

                <div ref={chartContainerRef} className="w-full" />
            </div>
        </div>
    );
}
