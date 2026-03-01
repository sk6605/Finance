/* ============================================================
   lib/api/userApi.ts — 用户设置 API（已修正为真实端点）

   真实 API 端点（从 JS Bundle 逆向）：
   - 修改密码: POST /api/user/appUser/changePassword（加密）
   - KYC: POST /api/auth/appAuth/applyKYC
   - 2FA 生成: GET /api/app/generateGoogleKey
   - 2FA 绑定: POST /api/user/appUser/bindGoogleAuth（加密）
   - 团队信息: GET /api/marketing/myTeam
   ============================================================ */

import apiClient from './apiClient';
import { encryptPayload } from './encryption';

/* ── 修改登录密码（加密 POST） ── */
export async function changePasswordApi(payload: {
    oldPassword: string;
    newPassword: string;
    confirmPassword?: string;
}): Promise<void> {
    const encryptedBody = await encryptPayload(payload);
    await apiClient.post('/api/user/appUser/changePassword', encryptedBody);
}

/* ── 提交 KYC 认证（上传身份证件，multipart） ── */
export async function submitKycApi(formData: FormData): Promise<void> {
    await apiClient.post('/api/auth/appAuth/applyKYC', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
}

/* ── 查询 KYC 认证状态 ── */
export async function getKycStatusApi(): Promise<{ status: string }> {
    const res = await apiClient.get<{ code: number; result: { status: string } }>(
        '/api/auth/appAuth/isHaveAuth'
    );
    return res.data.result || { status: 'unverified' };
}

/* ── 生成 Google 2FA 密钥和二维码 ── */
export async function generate2FAKeyApi(): Promise<{ qrCode: string; secretKey: string }> {
    const res = await apiClient.get<{ code: number; result: { qrCode: string; secretKey: string } }>(
        '/api/app/generateGoogleKey'
    );
    return res.data.result;
}

/* ── 绑定 Google 2FA（验证 TOTP 代码，加密 POST） ── */
export async function bind2FAApi(payload: {
    googleCode: string;  // 6 位 TOTP 验证码
    secretKey: string;
}): Promise<void> {
    const encryptedBody = await encryptPayload(payload);
    await apiClient.post('/api/user/appUser/bindGoogleAuth', encryptedBody);
}

/* ── 获取邀请团队信息 ── */
export async function getTeamInfoApi(): Promise<{
    inviteCode: string;
    inviteUrl: string;
    totalNum: number;
    totalCommission: number;
}> {
    const res = await apiClient.get<{ code: number; result: { inviteCode: string; inviteUrl: string; totalNum: number; totalCommission: number } }>(
        '/api/marketing/myTeam'
    );
    return res.data.result || { inviteCode: '', inviteUrl: '', totalNum: 0, totalCommission: 0 };
}

/* ── 获取系统公告列表 ── */
export async function getAnnouncementsApi(params = {}): Promise<{ id: string; title: string; content: string; createTime: string }[]> {
    const res = await apiClient.get<{ code: number; result: { records: { id: string; title: string; content: string; createTime: string }[] } }>(
        '/api/sys/annountCement/vue3List',
        { params: { pageNo: 1, pageSize: 10, ...params } }
    );
    return res.data.result?.records || [];
}

/* ── 获取通知列表 ── */
export async function getNotificationsApi(params = {}): Promise<{ id: string; title: string; content: string; isRead: boolean; createTime: string }[]> {
    const res = await apiClient.get<{ code: number; result: { records: { id: string; title: string; content: string; isRead: boolean; createTime: string }[] } }>(
        '/api/content/appNotice/myList',
        { params: { pageNo: 1, pageSize: 20, ...params } }
    );
    return res.data.result?.records || [];
}
