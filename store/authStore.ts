/* ============================================================
   store/authStore.ts — 全局认证状态管理（Zustand）
   功能：存储当前登录用户信息、Token，提供登录/退出操作
   在整个应用中共享用户认证状态
   ============================================================ */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';

interface AuthState {
    // ── 状态 ──
    user: User | null;         // 当前登录用户的信息
    token: string | null;      // JWT 认证 Token
    isLoggedIn: boolean;       // 是否已登录

    // ── 操作 ──
    /** 登录成功后调用：保存用户信息和 Token */
    setAuth: (user: User, token: string) => void;
    /** 更新用户信息（例如 KYC 审核通过后刷新） */
    updateUser: (user: Partial<User>) => void;
    /** 退出登录：清空所有认证状态 */
    clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            isLoggedIn: false,

            setAuth: (user, token) => {
                // 同时保存到 localStorage 供 Axios 拦截器读取
                localStorage.setItem('xau_auth_token', token);
                set({ user, token, isLoggedIn: true });
            },

            updateUser: (updates) =>
                set((state) => ({
                    user: state.user ? { ...state.user, ...updates } : null,
                })),

            clearAuth: () => {
                localStorage.removeItem('xau_auth_token');
                set({ user: null, token: null, isLoggedIn: false });
            },
        }),
        {
            name: 'xau_user_info', // localStorage key（持久化存储）
            partialize: (state) => ({ user: state.user, token: state.token, isLoggedIn: state.isLoggedIn }),
            // Hydration 处理
            skipHydration: true,
        }
    )
);

// 安全的客户端 Hydration Hook
import { useState, useEffect } from 'react';

export const useHydratedAuth = () => {
    const [hasHydrated, setHasHydrated] = useState(false);
    const authState = useAuthStore();

    useEffect(() => {
        useAuthStore.persist.rehydrate();
        setHasHydrated(true);
    }, []);

    return { ...authState, hasHydrated };
};
