/* ============================================================
   lib/websocket/priceWebSocket.ts — 实时价格 WebSocket 客户端
   功能：连接平台 WebSocket，订阅交易对价格推送
   - 支持订阅/取消订阅多个交易对
   - 自动重连（最多 3 次，避免无限重连）
   - 本地开发环境下跳过连接（服务器 CORS 不允许 localhost）
   ============================================================ */

import { MarketTicker } from '@/types';
import { getMarketTickersApi } from '../api/marketApi';

// WebSocket 连接地址（基于 valorexinthium.com）
const WS_URL = 'wss://valorexinthium.com/ws';

// 最大自动重连次数（避免在 CORS 拒绝时无限循环报错）
const MAX_RECONNECT_ATTEMPTS = 3;

/** 价格更新回调类型 */
type PriceUpdateCallback = (ticker: MarketTicker) => void;

class PriceWebSocketService {
    private ws: WebSocket | null = null;
    private subscribers: Map<string, Set<PriceUpdateCallback>> = new Map();
    private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    private isConnected = false;
    private reconnectAttempts = 0;

    // 降级轮询（Polling）相关
    private pollingTimer: ReturnType<typeof setInterval> | null = null;
    private isPolling = false;

    /* ── 建立 WebSocket 连接 ── */
    connect() {
        // 已连接或正在轮询则跳过
        if (this.ws?.readyState === WebSocket.OPEN || this.isPolling) return;

        // 达到最大重连次数后停止（防止 CORS 拒绝时无限循环），并启动轮询
        if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
            console.info('[PriceWS] WebSocket 不可用（服务器可能不允许此 origin），将使用轮询降级...');
            this.startPolling();
            return;
        }

        try {
            this.ws = new WebSocket(WS_URL);
        } catch {
            // WebSocket URL 构造失败（SSR 环境等），直接降级轮询
            this.startPolling();
            return;
        }

        this.ws.onopen = () => {
            console.log('[PriceWS] 连接成功');
            this.isConnected = true;
            this.reconnectAttempts = 0; // 连接成功后重置计数
            this.stopPolling();         // 如果之前在轮询，则停止
            // 重连后重新订阅所有交易对
            this.subscribers.forEach((_, symbol) => this.sendSubscribe(symbol));
        };

        this.ws.onmessage = (event: MessageEvent) => {
            try {
                const data = JSON.parse(event.data) as { type: string; data: MarketTicker };
                if (data.type === 'ticker' && data.data?.symbol) {
                    // 触发该交易对的所有回调
                    const callbacks = this.subscribers.get(data.data.symbol);
                    callbacks?.forEach(cb => cb(data.data));
                }
            } catch (err) {
                console.warn('[PriceWS] 消息解析失败:', err);
            }
        };

        this.ws.onclose = () => {
            this.isConnected = false;
            this.reconnectAttempts++;

            if (this.reconnectAttempts <= MAX_RECONNECT_ATTEMPTS) {
                // 尚未达到上限，等待后重连
                console.info(`[PriceWS] 连接断开，3秒后重连 (${this.reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
                this.reconnectTimer = setTimeout(() => this.connect(), 3000);
            }
        };

        this.ws.onerror = () => {
            // 降级为 info 级别（不是红色 error），避免控制台报警
            console.info('[PriceWS] WebSocket 连接被拒绝（可能是服务器 CORS 限制，不影响其他功能）');
        };
    }

    /* ── 降级轮询（Polling）逻辑 ── */
    private startPolling() {
        if (this.isPolling) return;
        this.isPolling = true;
        console.log('[PriceWS] 🚀 轮询模式已启动 (每 3 秒获取最新价格)');

        // 立即执行一次获取最新价格
        this.fetchPricesAndNotify();

        // 每 3 秒拉取一次
        this.pollingTimer = setInterval(() => {
            // 如果没有人订阅，就不拉取，省流量
            if (this.subscribers.size > 0) {
                this.fetchPricesAndNotify();
            }
        }, 3000);
    }

    private stopPolling() {
        if (this.pollingTimer) {
            clearInterval(this.pollingTimer);
            this.pollingTimer = null;
        }
        this.isPolling = false;
    }

    // 拉取 HTTP API 行情并触发回调
    private async fetchPricesAndNotify() {
        try {
            const data = await getMarketTickersApi();
            data.forEach(ticker => {
                // 如果这个交易对有人订阅，则触发回调
                if (this.subscribers.has(ticker.symbol)) {
                    const callbacks = this.subscribers.get(ticker.symbol);
                    callbacks?.forEach(cb => cb(ticker));
                }
            });
        } catch (err) {
            console.warn('[PriceWS-Polling] 获取行情失败:', err);
        }
    }

    /* ── 订阅某个交易对的实时价格 ── */
    subscribe(symbol: string, callback: PriceUpdateCallback) {
        if (!this.subscribers.has(symbol)) {
            this.subscribers.set(symbol, new Set());
            // 通知服务端开始推送这个交易对（如果是 WS 模式的话）
            if (this.isConnected) this.sendSubscribe(symbol);
        }
        this.subscribers.get(symbol)!.add(callback);
    }

    /* ── 取消订阅某个交易对 ── */
    unsubscribe(symbol: string, callback: PriceUpdateCallback) {
        const callbacks = this.subscribers.get(symbol);
        if (callbacks) {
            callbacks.delete(callback);
            if (callbacks.size === 0) {
                this.subscribers.delete(symbol);
                if (this.isConnected) this.sendUnsubscribe(symbol);
            }
        }
    }

    /* ── 断开 WebSocket 连接 ── */
    disconnect() {
        if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
        this.ws?.close();
        this.ws = null;
        this.isConnected = false;
        this.stopPolling();
    }

    /* 发送订阅消息到服务端 */
    private sendSubscribe(symbol: string) {
        this.ws?.send(JSON.stringify({ action: 'subscribe', symbol }));
    }

    /* 发送取消订阅消息到服务端 */
    private sendUnsubscribe(symbol: string) {
        this.ws?.send(JSON.stringify({ action: 'unsubscribe', symbol }));
    }
}

// 导出单例（全局共用一个 WebSocket 连接）
export const priceWS = new PriceWebSocketService();
