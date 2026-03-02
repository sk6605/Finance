/* ============================================================
   store/marketStore.ts — 市场行情全局状态（Zustand）
   功能：存储所有交易对的实时价格，供各组件读取
   通过 WebSocket 持续更新，不需要每个组件独立请求
   ============================================================ */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MarketTicker } from '@/types';

interface MarketState {
    // ── 状态 ──
    /** 所有交易对的实时行情 Map（key: symbol, value: MarketTicker） */
    tickers: Record<string, MarketTicker>;
    /** 当前选中的交易对（在交易页使用） */
    selectedSymbol: string;
    /** 用户当前在 Trading 页面打开的交易对标签（至少包含 XAUUSD） */
    activeTabs: string[];
    isLoading: boolean;

    // ── 操作 ──
    /** 批量更新行情数据（首次加载时使用） */
    setTickers: (tickers: MarketTicker[]) => void;
    /** 更新单个交易对行情（WebSocket 推送时使用） */
    updateTicker: (ticker: MarketTicker) => void;
    /** 切换当前选中的交易对，并自动加入到标签栏 */
    setSelectedSymbol: (symbol: string) => void;
    /** 关闭一个交易对标签 */
    removeTab: (symbol: string) => void;
    setLoading: (loading: boolean) => void;
}

export const useMarketStore = create<MarketState>()(
    persist(
        (set, get) => ({
            tickers: {},
            selectedSymbol: 'XAUUSD',  // 默认选中黄金
            activeTabs: ['XAUUSD'],    // 默认打开黄金
            isLoading: true,

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

            setSelectedSymbol: (symbol) =>
                set((state) => {
                    // 如果刚选的尚未在 tabs 里，加进去
                    const tabs = state.activeTabs.includes(symbol)
                        ? state.activeTabs
                        : [...state.activeTabs, symbol];
                    return { selectedSymbol: symbol, activeTabs: tabs };
                }),

            removeTab: (symbol) =>
                set((state) => {
                    let newTabs = state.activeTabs.filter(t => t !== symbol);
                    // 不能让 tabs 为空，至少保留 XAUUSD
                    if (newTabs.length === 0) {
                        newTabs = ['XAUUSD'];
                    }
                    // 如果关掉的是当前选中的，切换到第一个
                    const newSelected = state.selectedSymbol === symbol ? newTabs[0] : state.selectedSymbol;
                    return { activeTabs: newTabs, selectedSymbol: newSelected };
                }),

            setLoading: (loading) => set({ isLoading: loading }),
        }),
        {
            name: 'market-storage', // localStorage key
            // Only persist activeTabs and selectedSymbol
            partialize: (state) => ({
                activeTabs: state.activeTabs,
                selectedSymbol: state.selectedSymbol,
            }),
        }
    )
);
