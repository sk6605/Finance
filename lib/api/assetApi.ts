/* ============================================================
   lib/api/assetApi.ts — 资产 & 钱包 API（已修正为真实端点）

   真实 API 端点（从 JS Bundle 逆向）：
   - 余额: GET /api/finance/appWallet/queryUserBalance
   - 完整资产: GET /api/finance/appWallet/queryUserAssets
   - 充值地址: GET /api/finance/rechargeAddr/getAddr
   - 充值申请: POST /api/finance/appRecharge/apply（加密）
   - 提现申请: POST /api/finance/appWithdrawal/apply（加密）
   - 流水记录: GET /api/finance/appBalanceLog/list
   - 充值记录: GET /api/finance/appRecharge/listMy
   - 提现记录: GET /api/finance/appWithdrawal/listMy
   ============================================================ */

import apiClient from './apiClient';
import { encryptPayload } from './encryption';
import { AssetBalance, AssetRecord, DepositAddress } from '@/types';

/* ── 获取用户余额（USDT 等） ── */
export async function getAssetBalancesApi(): Promise<AssetBalance[]> {
    const res = await apiClient.get<{ code: number; result: AssetBalance[] | { balances: AssetBalance[] } }>(
        '/api/finance/appWallet/queryUserBalance'
    );
    const result = res.data.result;
    return Array.isArray(result) ? result : (result as { balances: AssetBalance[] }).balances || [];
}

/* ── 获取完整资产列表（多币种） ── */
export async function getFullAssetsApi(): Promise<{ currency: string; balance: number; usdtValue: number }[]> {
    const res = await apiClient.get<{ code: number; result: { currency: string; balance: number; usdtValue: number }[] }>(
        '/api/finance/appWallet/queryUserAssets'
    );
    return Array.isArray(res.data.result) ? res.data.result : [];
}

/* ── 获取充值地址（QR 码地址） ── */
export async function getDepositAddressApi(params: {
    currency: string;
    chainType?: string;  // 网络类型：TRC20 / ERC20
}): Promise<DepositAddress> {
    const res = await apiClient.get<{ code: number; result: DepositAddress }>(
        '/api/finance/rechargeAddr/getAddr',
        { params }
    );
    return res.data.result;
}

/* ── 提交提现申请（加密 POST） ── */
export async function submitWithdrawApi(payload: {
    currency: string;
    money: number;         // 字段名 money
    address: string;       // 提现地址
    safePassword: string;  // 资金密码
    remark?: string;
}): Promise<{ id: string }> {
    const encryptedBody = await encryptPayload(payload);
    const res = await apiClient.post<{ code: number; result: { id: string } }>(
        '/api/finance/appWithdrawal/apply',
        encryptedBody
    );
    return res.data.result;
}

/* ── 获取余额变动流水记录 ── */
export async function getBalanceLogsApi(params: {
    pageNo?: number;
    pageSize?: number;
    type?: string;
} = {}): Promise<AssetRecord[]> {
    const res = await apiClient.get<{ code: number; result: { records: AssetRecord[] } }>(
        '/api/finance/appBalanceLog/list',
        { params: { pageNo: 1, pageSize: 20, ...params } }
    );
    return res.data.result?.records || [];
}

/* ── 获取充值记录 ── */
export async function getRechargeRecordsApi(params = {}): Promise<AssetRecord[]> {
    const res = await apiClient.get<{ code: number; result: { records: AssetRecord[] } }>(
        '/api/finance/appRecharge/listMy',
        { params: { pageNo: 1, pageSize: 20, ...params } }
    );
    return res.data.result?.records || [];
}

/* ── 获取提现记录 ── */
export async function getWithdrawRecordsApi(params = {}): Promise<AssetRecord[]> {
    const res = await apiClient.get<{ code: number; result: { records: AssetRecord[] } }>(
        '/api/finance/appWithdrawal/listMy',
        { params: { pageNo: 1, pageSize: 20, ...params } }
    );
    return res.data.result?.records || [];
}
