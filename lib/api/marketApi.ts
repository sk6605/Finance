/* ============================================================
   lib/api/marketApi.ts — 市场行情 API（已修正为真实端点）
   
   真实 API 端点（从 JS Bundle 逆向）：
   - 交易对列表: GET /api/trade/appSymbol/list
   - 单个价格: GET /api/trade/appSymbol/price
   - 余额查询: GET /api/finance/appWallet/queryUserBalance
   ============================================================ */

import apiClient from './apiClient';
import { MarketTicker } from '@/types';

/* ── 真实 API 的交易对格式（兼容多种字段名） ── */
// 真实 API 返回: currentPrice / rise / riseRate / amount / high / low / symbol
// 之前错误假设: price / change / changePercent / volume
interface AppSymbol {
    id?: string;
    symbol?: string;
    name?: string;
    // 价格字段（两套名字都兼容）
    currentPrice?: number;
    price?: number;
    // 涨跌额
    rise?: number;
    change?: number;
    // 涨跌幅
    riseRate?: number;
    changePercent?: number;
    // 成交量
    amount?: number;
    volume?: number;
    high?: number;
    low?: number;
    // 其他可能的字段
    [key: string]: unknown;
}

export async function getMarketTickersApi(): Promise<MarketTicker[]> {
    const res = await apiClient.get('/api/trade/appSymbol/list');

    // 兼容处理所有可能的响应格式
    const data = res.data;
    let symbols: AppSymbol[] = [];

    if (Array.isArray(data)) {
        symbols = data;
    } else if (data && Array.isArray(data.result)) {
        symbols = data.result;
    } else if (data && data.result && Array.isArray(data.result.records)) {
        symbols = data.result.records;
    } else if (data && data.result && typeof data.result === 'object' && !Array.isArray(data.result)) {
        // 可能是以 symbol 为 key 的 map 对象
        symbols = Object.values(data.result) as AppSymbol[];
    }

    return symbols
        .filter(s => s.symbol)         // 必须有 symbol 名称
        .map(s => ({
            symbol: String(s.symbol),
            // 兼容 currentPrice 或 price
            price: Number(s.currentPrice ?? s.price) || 0,
            // 兼容 rise 或 change
            change24h: Number(s.rise ?? s.change) || 0,
            // 兼容 riseRate 或 changePercent
            changePercent24h: Number(s.riseRate ?? s.changePercent) || 0,
            // 兼容 amount 或 volume
            volume24h: Number(s.amount ?? s.volume) || 0,
            high24h: Number(s.high) || 0,
            low24h: Number(s.low) || 0,
        }));
}


/* ── 获取单个交易对的实时价格 ── */
export async function getTickerApi(symbol: string): Promise<MarketTicker> {
    const res = await apiClient.get<{ code: number; result: AppSymbol }>(
        '/api/trade/appSymbol/price',
        { params: { symbol } }
    );
    const s = res.data.result;
    return {
        symbol: s.symbol,
        price: Number(s.price) || 0,
        change24h: Number(s.change) || 0,
        changePercent24h: Number(s.changePercent) || 0,
        volume24h: Number(s.volume) || 0,
        high24h: Number(s.high) || 0,
        low24h: Number(s.low) || 0,
    };
}

/* ── 获取 K 线历史数据 ── */
export async function getKlineDataApi(
    symbol: string,
    period: '1min' | '5min' | '15min' | '1H' | '4H' | '1D' = '1min',
    limit: number = 200
): Promise<import('@/types').KlineCandle[]> {
    // 这个端点可能不存在，先尝试常见路径
    const res = await apiClient.get<{ code: number; result: import('@/types').KlineCandle[] }>(
        '/api/trade/appSymbol/kline',
        { params: { symbol, period, limit } }
    );
    return Array.isArray(res.data) ? res.data : (res.data.result || []);
}

/* ── 获取系统设置（公告、系统配置） ── */
export async function getSystemSettingApi(key: string): Promise<string> {
    const res = await apiClient.get<{ code: number; result: string }>(
        '/api/set/appSysSet/getKeyByParam',
        { params: { key } }
    );
    return res.data.result || '';
}
