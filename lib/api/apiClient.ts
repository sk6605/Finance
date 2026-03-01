/* ============================================================
   lib/api/apiClient.ts — Axios 实例配置（已根据真实 API 修正）
   
   发现的真实 API 规格（从 valorexinthium.com JS Bundle 逆向）：
   - Token 头: X-Access-Token（不是 Authorization: Bearer）
   - 响应格式: { code: 200/401/500, result: T, message: string }
   - Base URL: https://valorexinthium.com
   ============================================================ */

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// API 基础地址（直连 valorexinthium.com 的后端）
const BASE_URL = 'https://valorexinthium.com';

// 创建 Axios 实例
const apiClient = axios.create({
    baseURL: BASE_URL,
    timeout: 60000,  // 60秒超时（原始 App 也是 60s）
    headers: {
        'Content-Type': 'application/json',
    },
});

/* ── 请求拦截器：每次请求自动带上 Token ── */
apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        // 从 localStorage 读取 JWT Token
        const token = typeof window !== 'undefined'
            ? localStorage.getItem('xau_auth_token')
            : null;

        if (token) {
            // 注入到 X-Access-Token 头（真实 API 使用此头，非 Authorization Bearer）
            config.headers['X-Access-Token'] = token;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

/* ── 响应拦截器：统一处理错误 ── */
apiClient.interceptors.response.use(
    (response) => {
        const data = response.data;
        // 真实 API 响应格式：{ code: 200, result: T }
        // code 200 或 0 = 成功
        if (data.code === 200 || data.code === 0 || Array.isArray(data)) {
            return response;
        }
        // code 401 = Token 过期
        if (data.code === 401) {
            localStorage.removeItem('xau_auth_token');
            localStorage.removeItem('xau_user_info');
            window.location.href = '/login';
        }
        return Promise.reject(new Error(data.message || 'API Error'));
    },
    (error: AxiosError) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('xau_auth_token');
            localStorage.removeItem('xau_user_info');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default apiClient;
