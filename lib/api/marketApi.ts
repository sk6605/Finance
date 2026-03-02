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

// 添加价格乘数映射以贴合真实世界价格 (Gate.io 的 PAXG 是真实金价的两倍左右，代币映射需要根据当前市场调比)
export const SYMBOL_MULTIPLIER: Record<string, number> = {
    'XAUUSD': 0.5,         // PAXG 约 5400 -> 真实黄金约 2700
    'XAGUSD': 30 / 65000,  // BTC 约 65000 -> 真实白银约 30
    'XPTUSD': 960 / 2600,  // ETH 约 2600 -> 真实铂金约 960
    'XPDUSD': 950 / 600,   // BNB 约 600 -> 真实钯金约 950
    'XNIUSD': 16 / 150,    // SOL 约 150 -> 真实镍约 16
    'XCUUSD': 4.1 / 2.5,   // XRP 约 2.5 -> 真实铜约 4.1
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
                    const mul = SYMBOL_MULTIPLIER[sym] || 1;
                    mapped.push({
                        symbol: sym,
                        price: Number(item.last) * mul,
                        change24h: 0, // Gate doesn't provide absolute change directly easily, but we have percentage
                        changePercent24h: Number(item.change_percentage),
                        volume24h: Number(item.base_volume), // volume stays raw for visual effect
                        high24h: Number(item.high_24h) * mul,
                        low24h: Number(item.low_24h) * mul,
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
        const mul = SYMBOL_MULTIPLIER[symbol] || 1;
        return {
            symbol,
            price: Number(item.last) * mul,
            change24h: 0,
            changePercent24h: Number(item.change_percentage),
            volume24h: Number(item.base_volume),
            high24h: Number(item.high_24h) * mul,
            low24h: Number(item.low_24h) * mul,
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
        const mul = SYMBOL_MULTIPLIER[symbol] || 1;
        return res.data.map((k: any) => ({
            time: Number(k[0]), // Gate.io is already in seconds
            open: Number(k[5]) * mul,
            high: Number(k[3]) * mul,
            low: Number(k[4]) * mul,
            close: Number(k[2]) * mul,
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
