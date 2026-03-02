'use client';

import { useEffect } from 'react';
import { getMarketTickersApi } from '@/lib/api/marketApi';
import { priceWS } from '@/lib/websocket/priceWebSocket';
import { useMarketStore } from '@/store/marketStore';

const SYMBOL_LIST = ['XAUUSD', 'XAGUSD', 'XPTUSD', 'XPDUSD', 'XNIUSD', 'XCUUSD'];

/**
 * 全局行情更新器 (Global Market Updater)
 * 挂载在 Root/Dashboard Layout 上，确保用户无论在哪个页面
 * 都能保持 WebSocket 持续连接并更新 zustand 里的最新价格，
 * 实现真正的 全局动态更新。
 */
export default function GlobalMarketUpdater() {
    const { setTickers, updateTicker, setLoading } = useMarketStore();

    useEffect(() => {
        // 1. 初始化拉取：为了页面直出时不空载
        getMarketTickersApi()
            .then(tickers => {
                setTickers(tickers);
                setLoading(false);
            })
            .catch(err => {
                console.error('[GlobalMarketUpdater] API fetch error:', err);
                setLoading(false);
            });

        // 2. 连接 WebSocket
        priceWS.connect();

        // 3. 订阅所有资产的实时更新，随时注入 Zustand
        const callbacks = SYMBOL_LIST.map(symbol => {
            const cb = (ticker: any) => updateTicker(ticker);
            priceWS.subscribe(symbol, cb);
            return { symbol, cb };
        });

        // 取消订阅
        return () => {
            callbacks.forEach(({ symbol, cb }) => {
                priceWS.unsubscribe(symbol, cb);
            });
            // 可选：如果完全退出 Dashboard 才断开 WS
            // priceWS.disconnect(); 
        };
    }, [setTickers, updateTicker]);

    return null; // 此组件仅负责逻辑，不渲染 UI
}
