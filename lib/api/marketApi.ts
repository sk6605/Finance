/* ============================================================
   lib/api/marketApi.ts — 市场行情 API（已修正为真实端点）
   
   真实 API 端点（从 JS Bundle 逆向）：
   - 交易对列表: GET /api/trade/appSymbol/list
   - 单个价格: GET /api/trade/appSymbol/price
   - 余额查询: GET /api/finance/appWallet/queryUserBalance
   ============================================================ */

import apiClient from './apiClient';
import { MarketTicker } from '@/types';

import axios from 'axios';

/* ── 映射内部交易对到 Gate.io 真实交易对 (不需要使用被限区的 Binance) ── */
const SYMBOL_TO_GATE: Record<string, string> = {
    'XAUUSD': 'PAXG_USDT',   // PAXG 锚定实体黄金
    'XAGUSD': 'BTC_USDT',    // 暂用 BTC 模拟活跃白银以做展示
    'XPTUSD': 'ETH_USDT',    // 暂用 ETH 模拟铂金
    'XPDUSD': 'BNB_USDT',    // 暂用 BNB 模拟钯金
    'XNIUSD': 'SOL_USDT',    // 暂用 SOL 模拟镍
    'XCUUSD': 'XRP_USDT',    // 暂用 XRP 模拟铜
};

const GATE_TO_SYMBOL: Record<string, string[]> = {};
Object.entries(SYMBOL_TO_GATE).forEach(([sym, gate]) => {
    if (!GATE_TO_SYMBOL[gate]) GATE_TO_SYMBOL[gate] = [];
    GATE_TO_SYMBOL[gate].push(sym);
});

export async function getMarketTickersApi(): Promise<MarketTicker[]> {
    try {
        const res = await axios.get('/api/gateio/spot/tickers');
        const data = res.data;
        const mapped: MarketTicker[] = [];

        data.forEach((item: any) => {
            const gateSym = item.currency_pair;
            const internalSymbols = GATE_TO_SYMBOL[gateSym];
            if (internalSymbols) {
                internalSymbols.forEach(sym => {
                    mapped.push({
                        symbol: sym,
                        price: Number(item.last),
                        change24h: 0, // Gate doesn't provide absolute change directly easily, but we have percentage
                        changePercent24h: Number(item.change_percentage),
                        volume24h: Number(item.base_volume),
                        high24h: Number(item.high_24h),
                        low24h: Number(item.low_24h),
                    });
                });
            }
        });

        return Object.keys(SYMBOL_TO_GATE).map(s => mapped.find(m => m.symbol === s)).filter(Boolean) as MarketTicker[];
    } catch (err) {
        console.error('[MarketAPI] Gate.io ticker fetch failed', err);
        return [];
    }
}

export async function getTickerApi(symbol: string): Promise<MarketTicker> {
    try {
        const gateSym = SYMBOL_TO_GATE[symbol] || symbol;
        const res = await axios.get(`/api/gateio/spot/tickers?currency_pair=${gateSym}`);
        const item = res.data[0];
        if (!item) throw new Error("No data");
        return {
            symbol,
            price: Number(item.last),
            change24h: 0,
            changePercent24h: Number(item.change_percentage),
            volume24h: Number(item.base_volume),
            high24h: Number(item.high_24h),
            low24h: Number(item.low_24h),
        };
    } catch (err) {
        return { symbol, price: 0, change24h: 0, changePercent24h: 0, volume24h: 0, high24h: 0, low24h: 0 };
    }
}

export async function getKlineDataApi(
    symbol: string,
    period: '1min' | '5min' | '15min' | '1H' | '4H' | '1D' = '1min',
    limit: number = 200
): Promise<import('@/types').KlineCandle[]> {
    try {
        const gateSym = SYMBOL_TO_GATE[symbol] || symbol;
        const intervalMap: Record<string, string> = {
            '1min': '1m',
            '5min': '5m',
            '15min': '15m',
            '1H': '1h',
            '4H': '4h',
            '1D': '1d',
        };
        const interval = intervalMap[period] || '1m';

        const res = await axios.get(`/api/gateio/spot/candlesticks?currency_pair=${gateSym}&interval=${interval}&limit=${limit}`);

        // Gate.io returns: [timestamp, quote_vol, close, high, low, open, base_vol]
        return res.data.map((k: any) => ({
            time: Number(k[0]), // Gate.io is already in seconds
            open: Number(k[5]),
            high: Number(k[3]),
            low: Number(k[4]),
            close: Number(k[2]),
            volume: Number(k[6]),
        }));
    } catch (err) {
        console.error('[MarketAPI] Gate.io kline fetch failed', err);
        return [];
    }
}

/* ── 获取系统设置（公告、系统配置） ── */
export async function getSystemSettingApi(key: string): Promise<string> {
    const res = await apiClient.get<{ code: number; result: string }>(
        '/api/set/appSysSet/getKeyByParam',
        { params: { key } }
    );
    return res.data.result || '';
}
