import { MarketTicker } from '@/types';

// Gate.io WebSocket 实时全市场行情
const WS_URL = 'wss://api.gateio.ws/ws/v4/';

/** 价格更新回调类型 */
type PriceUpdateCallback = (ticker: MarketTicker) => void;

// 添加映射表：内部 Symbol -> Gate.io Symbol
const SYMBOL_TO_GATE: Record<string, string> = {
    'XAUUSD': 'PAXG_USDT',   // PAXG 锚定实体黄金
    'XAGUSD': 'BTC_USDT',    // 暂用 BTC 模拟活跃白银以做展示
    'XPTUSD': 'ETH_USDT',    // 暂用 ETH 模拟铂金
    'XPDUSD': 'BNB_USDT',    // 暂用 BNB 模拟钯金
    'XNIUSD': 'SOL_USDT',    // 暂用 SOL 模拟镍
    'XCUUSD': 'XRP_USDT',    // 暂用 XRP 模拟铜
};

const SYMBOL_MULTIPLIER: Record<string, number> = {
    'XAUUSD': 0.5,
    'XAGUSD': 30 / 65000,
    'XPTUSD': 960 / 2600,
    'XPDUSD': 950 / 600,
    'XNIUSD': 16 / 150,
    'XCUUSD': 4.1 / 2.5,
};

// 反向映射表：Gate Symbol -> 内部 Symbol 数组 (可能多个内部符映射到同一个符)
const GATE_TO_SYMBOL: Record<string, string[]> = {};
Object.entries(SYMBOL_TO_GATE).forEach(([sym, gate]) => {
    if (!GATE_TO_SYMBOL[gate]) GATE_TO_SYMBOL[gate] = [];
    GATE_TO_SYMBOL[gate].push(sym);
});

class PriceWebSocketService {
    private ws: WebSocket | null = null;
    private subscribers: Map<string, Set<PriceUpdateCallback>> = new Map();
    private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    private pingTimer: ReturnType<typeof setInterval> | null = null;
    private isConnected = false;

    /* ── 建立 WebSocket 连接 (连接 Gate.io 行情) ── */
    connect() {
        if (this.ws?.readyState === WebSocket.OPEN || this.ws?.readyState === WebSocket.CONNECTING) return;

        try {
            this.ws = new WebSocket(WS_URL);
        } catch (err) {
            console.error('[PriceWS] Failed to construct Gate.io WebSocket:', err);
            return;
        }

        this.ws.onopen = () => {
            console.log('[PriceWS] 连通 Gate.io 行情 WS 成功');
            this.isConnected = true;

            // 订阅所有相关的行情
            const payload = Array.from(new Set(Object.values(SYMBOL_TO_GATE)));
            this.ws?.send(JSON.stringify({
                time: Math.floor(Date.now() / 1000),
                channel: "spot.tickers",
                event: "subscribe",
                payload: payload
            }));

            // Gate.io 推荐设置心跳 /ping 保持存活
            this.pingTimer = setInterval(() => {
                if (this.ws?.readyState === WebSocket.OPEN) {
                    this.ws.send(JSON.stringify({
                        time: Math.floor(Date.now() / 1000),
                        channel: "spot.ping"
                    }));
                }
            }, 10000); // 10s ping
        };

        this.ws.onmessage = (event: MessageEvent) => {
            try {
                const data = JSON.parse(event.data);

                // 处理 pong 不要进入报错
                if (data.channel === 'spot.pong') return;

                // 格式: { channel: "spot.tickers", event: "update", result: { currency_pair: "BTC_USDT", last: "60000", ... } }
                if (data.channel === 'spot.tickers' && data.event === 'update' && data.result) {
                    const item = data.result;
                    const gateSym = item.currency_pair;
                    const internalSymbols = GATE_TO_SYMBOL[gateSym];

                    if (internalSymbols) {
                        const price = Number(item.last);
                        const changePercent24h = Number(item.change_percentage);
                        const high24h = Number(item.high_24h);
                        const low24h = Number(item.low_24h);
                        const volume24h = Number(item.base_volume);

                        internalSymbols.forEach(sym => {
                            if (this.subscribers.has(sym)) {
                                const mul = SYMBOL_MULTIPLIER[sym] || 1;
                                const ticker: MarketTicker = {
                                    symbol: sym,
                                    price: price * mul,
                                    change24h: 0, // 可以自己推算或者不管
                                    changePercent24h,
                                    high24h: high24h * mul,
                                    low24h: low24h * mul,
                                    volume24h,
                                };
                                const callbacks = this.subscribers.get(sym);
                                callbacks?.forEach(cb => cb(ticker));
                            }
                        });
                    }
                }
            } catch (err) {
                // ignore JSON parse error
            }
        };

        this.ws.onclose = () => {
            this.isConnected = false;
            if (this.pingTimer) clearInterval(this.pingTimer);
            console.info(`[PriceWS] 连接断开，3秒后重连...`);
            this.reconnectTimer = setTimeout(() => this.connect(), 3000);
        };

        this.ws.onerror = () => {
            console.info('[PriceWS] Gate.io 行情 WS 出错');
        };
    }

    /* ── 订阅某个交易对的实时价格 ── */
    subscribe(symbol: string, callback: PriceUpdateCallback) {
        if (!this.subscribers.has(symbol)) {
            this.subscribers.set(symbol, new Set());
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
            }
        }
    }

    /* ── 断开 WebSocket 连接 ── */
    disconnect() {
        if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
        if (this.pingTimer) clearInterval(this.pingTimer);
        this.ws?.close();
        this.ws = null;
        this.isConnected = false;
    }
}

// 导出单例
export const priceWS = new PriceWebSocketService();
