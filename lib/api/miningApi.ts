/* ============================================================
   lib/api/miningApi.ts — 挖矿/存储计划 API（已修正为真实端点）

   真实 API 端点（从 JS Bundle 逆向）：
   - 产品列表: GET /api/prod/appProductInfo/list
   - 购买: POST /api/prod/appProductOrder/debitBuy（加密）
   - 我的订单: GET /api/prod/appProductOrder/listMy
   - 订单统计: GET /api/prod/appProductOrder/orderStat
   ============================================================ */

import apiClient from './apiClient';
import { encryptPayload } from './encryption';
import { MiningOrder, MiningProduct } from '@/types';

/* ── 获取所有挖矿产品列表 ── */
export async function getMiningProductsApi(params = {}): Promise<MiningProduct[]> {
    const res = await apiClient.get(
        '/api/prod/appProductInfo/list',
        { params: { pageNo: 1, pageSize: 50, ...params } }
    );
    const data = res.data;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.result)) return data.result;
    if (Array.isArray(data?.result?.records)) return data.result.records;
    if (data?.result && typeof data.result === 'object') return Object.values(data.result) as MiningProduct[];
    return [];
}

/* ── 购买/订阅挖矿计划（debit 直接扣余额，加密 POST） ── */
export async function subscribeMiningPlanApi(payload: {
    productId: string;
    money: number;          // 购买金额
    safePassword: string;   // 实际字段名是 safePassword（资金密码）
}): Promise<MiningOrder> {
    const encryptedBody = await encryptPayload(payload);
    const res = await apiClient.post<{ code: number; result: MiningOrder }>(
        '/api/prod/appProductOrder/debitBuy',
        encryptedBody
    );
    return res.data.result;
}

/* ── 获取用户的挖矿订单列表 ── */
export async function getMyMiningOrdersApi(params: {
    pageNo?: number;
    pageSize?: number;
    status?: string;
} = {}): Promise<MiningOrder[]> {
    const res = await apiClient.get(
        '/api/prod/appProductOrder/listMy',
        { params: { pageNo: 1, pageSize: 20, ...params } }
    );
    const data = res.data;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.result)) return data.result;
    if (Array.isArray(data?.result?.records)) return data.result.records;
    return [];
}

/* ── 获取订单统计（总投入、收益等） ── */
export async function getMiningOrderStatApi(params = {}): Promise<{
    totalMoney: number;
    totalReward: number;
    todayReward: number;
}> {
    const res = await apiClient.get<{ code: number; result: { totalMoney: number; totalReward: number; todayReward: number } }>(
        '/api/prod/appProductOrder/orderStat',
        { params }
    );
    return res.data.result || { totalMoney: 0, totalReward: 0, todayReward: 0 };
}
