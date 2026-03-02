/* ============================================================
   lib/api/tradingApi.ts — 交易 API（已修正为真实端点）

   真实 API 端点（从 JS Bundle 逆向）：
   - 期权产品配置: GET /api/trade/appSecondContractSet/list
   - 期权下单: POST /api/trade/appSecondContractOrder/buy（加密）
   - 我的期权订单: GET /api/trade/appSecondContractOrder/listMy
   - 合约开仓: POST /api/trade/appTradePositions/create（加密）
   - 合约平仓: POST /api/trade/appTradePositions/close/{id}
   - 我的持仓: GET /api/trade/appTradePositions/listMy
   ============================================================ */

import apiClient from './apiClient';
import { encryptPayload } from './encryption';
import { ContractOrderPayload, ContractPosition, OptionOrder, OptionProduct } from '@/types';
import { amountSchema, leverageSchema, sanitizeString } from './validation';
import { z } from 'zod';

// ── 期权交易 ──────────────────────────────────────────────────

/* ── 获取期权产品配置（时间周期 + 收益率） ── */
export async function getOptionProductsApi(symbol?: string): Promise<OptionProduct[]> {
    const res = await apiClient.get(
        '/api/trade/appSecondContractSet/list',
        { params: symbol ? { symbol } : {} }
    );
    // 兼容所有可能的响应格式
    const data = res.data;
    let items: OptionProduct[] = [];
    if (Array.isArray(data)) {
        items = data;
    } else if (Array.isArray(data?.result)) {
        items = data.result;
    } else if (Array.isArray(data?.result?.records)) {
        items = data.result.records;
    } else if (data?.result && typeof data.result === 'object') {
        items = Object.values(data.result) as OptionProduct[];
    }
    return items;
}

/* ── 期权下单（买涨 / 买跌，加密 POST） ── */
export async function placeOptionOrderApi(payload: {
    symbol: string;
    money: number;       // 实际字段名是 money，不是 amount
    setId: string;       // 期权产品 ID，字段名是 setId
    type: 1 | 2;        // 1=买涨 UP, 2=买跌 DOWN
}): Promise<OptionOrder> {
    // 基础校验与净化
    const safeSymbol = sanitizeString(payload.symbol);
    const safeMoney = amountSchema.parse(payload.money);
    const safeSetId = z.string().min(1).parse(payload.setId);

    const safePayload = { ...payload, symbol: safeSymbol, money: safeMoney, setId: safeSetId };
    const encryptedBody = await encryptPayload(safePayload);
    const res = await apiClient.post<{ code: number; result: OptionOrder }>(
        '/api/trade/appSecondContractOrder/buy',
        encryptedBody
    );
    return res.data.result;
}

/* ── 获取我的期权订单列表 ── */
export async function getMyOptionOrdersApi(params: { pageNo?: number; pageSize?: number } = {}): Promise<OptionOrder[]> {
    const res = await apiClient.get<{ code: number; result: { records: OptionOrder[] } }>(
        '/api/trade/appSecondContractOrder/listMy',
        { params: { pageNo: 1, pageSize: 20, ...params } }
    );
    return res.data.result?.records || [];
}

// ── 合约交易 ──────────────────────────────────────────────────

/* ── 开仓（做多 Long / 做空 Short，加密 POST） ── */
export async function openContractPositionApi(payload: ContractOrderPayload): Promise<ContractPosition> {
    const safePayload = {
        ...payload,
        symbol: sanitizeString(payload.symbol),
        margin: amountSchema.parse(payload.margin),
        leverage: leverageSchema.parse(payload.leverage)
    };
    const encryptedBody = await encryptPayload(safePayload);
    const res = await apiClient.post<{ code: number; result: ContractPosition }>(
        '/api/trade/appTradePositions/create',
        encryptedBody
    );
    return res.data.result;
}

/* ── 平仓（传入持仓 ID） ── */
export async function closeContractPositionApi(positionId: string): Promise<void> {
    await apiClient.post(`/api/trade/appTradePositions/close/${positionId}`, {});
}

/* ── 获取当前持仓列表 ── */
export async function getContractPositionsApi(params = {}): Promise<ContractPosition[]> {
    const res = await apiClient.get<{ code: number; result: { records: ContractPosition[] } }>(
        '/api/trade/appTradePositions/listMy',
        { params: { pageNo: 1, pageSize: 50, ...params } }
    );
    return res.data.result?.records || [];
}

/* ── 修改止盈止损 ── */
export async function updateStopLossApi(payload: { id: string; stopLoss: number; stopProfit: number }): Promise<void> {
    const safePayload = {
        id: z.string().min(1).parse(payload.id),
        stopLoss: amountSchema.optional().parse(payload.stopLoss || undefined) || 0,
        stopProfit: amountSchema.optional().parse(payload.stopProfit || undefined) || 0
    };
    const encryptedBody = await encryptPayload(safePayload);
    await apiClient.post('/api/trade/appTradePositions/updateStopLoss', encryptedBody);
}
