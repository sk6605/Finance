/* ============================================================
   lib/api/authApi.ts — 用户认证 API（已修正为真实端点）
   
   真实 API 端点（从 JS Bundle 逆向）：
   - 发送邮箱验证码: GET /api/app/getEmailCaptcha
   - 注册: POST /api/app/register（加密 body）
   - 获取用户信息: GET /api/user/appUser/getMyUserInfo
   
   ⚠️ 登录: POST /api/app/login 使用 RSA+AES 加密的自定义 POST body
      body 格式: "rsaEncrypted.aesEncrypted"（纯字符串，非 JSON）
   ============================================================ */

import apiClient from './apiClient';
import { encryptPayload } from './encryption';
import { User } from '@/types';

/** 登录成功后的响应数据结构 */
interface LoginResult {
    token: string;
    userInfo: {
        id: string;
        username: string;
        email: string;
        kycStatus?: string;
        hasFundPassword?: boolean;
        has2FA?: boolean;
        inviteCode?: string;
    };
}

/* ── 登录（使用 RSA+AES 加密发送凭证） ── */
export async function loginApi(email: string, password: string): Promise<{ token: string; user: User }> {
    // 构建要加密的 payload
    const payload = { username: email, password };

    // 用平台公钥加密 payload
    const encryptedBody = await encryptPayload(payload);

    // POST 请求：body 是纯字符串（非 JSON object），Content-Type 仍为 application/json
    const res = await apiClient.post<{ code: number; result: LoginResult }>(
        '/api/app/login',
        encryptedBody,
        { headers: { 'Content-Type': 'application/json' } }
    );

    const { token, userInfo } = res.data.result;

    // 将 API 返回的 userInfo 映射到我们的 User 类型
    const user: User = {
        id: userInfo.id,
        uid: userInfo.id,
        email: userInfo.email || userInfo.username,
        kycStatus: (userInfo.kycStatus as User['kycStatus']) || 'unverified',
        hasFundPassword: userInfo.hasFundPassword || false,
        has2FA: userInfo.has2FA || false,
        inviteCode: userInfo.inviteCode || '',
        createdAt: new Date().toISOString(),
    };

    return { token, user };
}

/* ── 发送邮箱验证码 ── */
export async function sendEmailOtpApi(email: string): Promise<void> {
    await apiClient.get('/api/app/getEmailCaptcha', { params: { email } });
}

/* ── 注册 ── */
export async function registerApi(data: {
    email: string;
    password: string;
    smscode: string;     // 邮箱验证码
    inviteCode?: string;
}): Promise<{ token: string; user: User }> {
    // 真实 API 要求 username 字段，直接用 email 作为 username
    const payload = { ...data, username: data.email };
    const encryptedBody = await encryptPayload(payload);
    const res = await apiClient.post<{ code: number; result: LoginResult }>(
        '/api/app/register',
        encryptedBody
    );
    const { token, userInfo } = res.data.result;
    const user: User = {
        id: userInfo.id,
        uid: userInfo.id,
        email: userInfo.email || userInfo.username,
        kycStatus: 'unverified',
        hasFundPassword: false,
        has2FA: false,
        inviteCode: userInfo.inviteCode || '',
        createdAt: new Date().toISOString(),
    };
    return { token, user };
}

/* ── 获取当前登录用户信息 ── */
export async function getMyUserInfoApi(): Promise<User> {
    const res = await apiClient.get<{ code: number; result: LoginResult['userInfo'] }>(
        '/api/user/appUser/getMyUserInfo'
    );
    const info = res.data.result;
    return {
        id: info.id,
        uid: info.id,
        email: info.email || info.username,
        kycStatus: (info.kycStatus as User['kycStatus']) || 'unverified',
        hasFundPassword: info.hasFundPassword || false,
        has2FA: info.has2FA || false,
        inviteCode: info.inviteCode || '',
        createdAt: new Date().toISOString(),
    };
}

/* ── 退出登录（清除本地 Token） ── */
export async function logoutApi(): Promise<void> {
    // 清除本地存储的认证信息
    if (typeof window !== 'undefined') {
        localStorage.removeItem('xau_auth_token');
        localStorage.removeItem('xau_user_info');
    }
}
