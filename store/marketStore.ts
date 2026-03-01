/* ============================================================
   store/marketStore.ts — 市场行情全局状态（Zustand）
   功能：存储所有交易对的实时价格，供各组件读取
   通过 WebSocket 持续更新，不需要每个组件独立请求
   ============================================================ */

import { create } from 'zustand';
import { MarketTicker } from '@/types';

interface MarketState {
    // ── 状态 ──
    /** 所有交易对的实时行情 Map（key: symbol, value: MarketTicker） */
    tickers: Record<string, MarketTicker>;
    /** 当前选中的交易对（在交易页使用） */
    selectedSymbol: string;
    isLoading: boolean;

    // ── 操作 ──
    /** 批量更新行情数据（首次加载时使用） */
    setTickers: (tickers: MarketTicker[]) => void;
    /** 更新单个交易对行情（WebSocket 推送时使用） */
    updateTicker: (ticker: MarketTicker) => void;
    /** 切换当前选中的交易对 */
    setSelectedSymbol: (symbol: string) => void;
    setLoading: (loading: boolean) => void;
}

export const useMarketStore = create<MarketState>((set) => ({
    tickers: {},
    selectedSymbol: 'XAUUSD',  // 默认选中黄金
    isLoading: false,

    setTickers: (tickerList) => {
        // 将数组转换为 Map 格式，方便按 symbol 快速查找
        const tickerMap = tickerList.reduce<Record<string, MarketTicker>>(
            (acc, ticker) => ({ ...acc, [ticker.symbol]: ticker }),
            {}
        );
        set({ tickers: tickerMap });
    },

    updateTicker: (ticker) =>
        set((state) => ({
            tickers: { ...state.tickers, [ticker.symbol]: ticker },
        })),

    setSelectedSymbol: (symbol) => set({ selectedSymbol: symbol }),

    setLoading: (loading) => set({ isLoading: loading }),
}));
