import { z } from 'zod';

// ── 基础防注入与 XSS 过滤（轻量级清理） ──
// 去除字符串两侧空格，移除危险 HTML 标签和常见 SQL 注入符号
export const sanitizeString = (val: string) => {
    return val
        .trim()
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // 移除 script 标签
        .replace(/[<>'";()]/g, '') // 剔除可能引发 XSS 或基础 SQLi 的特殊字符
        .replace(/--|drop|select|update|delete|insert/gi, ''); // 弱化常见 SQL 关键词
};

/* ── Zod Schemas ── */

// 1. Email 校验（必须为合法邮箱格式，防注入）
export const emailSchema = z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format')
    .transform(val => sanitizeString(val)); // 额外清理

// 2. 密码校验（不进行强清理以防止破坏正常特殊字符密码，但限制长度过滤夸张注入）
export const passwordSchema = z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(50, 'Password is too long'); // 限制长度是防止被当做攻击 payload

// 3. 通用验证码/邀请码校验（仅限字母数字）
export const codeSchema = z
    .string()
    .regex(/^[a-zA-Z0-9]+$/, 'Code can only contain letters and numbers')
    .optional()
    .or(z.literal(''));

// 4. 交易金额校验（必须为大于 0 的有效数字）
export const amountSchema = z
    .number()
    .positive('Amount must be greater than 0');

// 5. 杠杆倍数校验
export const leverageSchema = z
    .number()
    .int()
    .min(1, 'Leverage must be at least 1')
    .max(100, 'Exceeded maximum leverage');

// 6. 提现代币地址校验 (基础的 Base58 / Hex 字符限制)
export const cryptoAddressSchema = z
    .string()
    .min(10, 'Invalid address length')
    .max(120, 'Invalid address length')
    .regex(/^[a-zA-Z0-9]+$/, 'Address contains invalid characters');

/* ── 验证助手函数 ── */

// 取第一个 Zod 错误信息
export function getZodError(error: unknown): string {
    if (error instanceof z.ZodError) {
        return error.issues[0]?.message || 'Validation failed';
    }
    return error instanceof Error ? error.message : 'Unknown error';
}
