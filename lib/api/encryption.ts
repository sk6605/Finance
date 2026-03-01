/* ============================================================
   lib/api/encryption.ts — 登录请求加密工具
   
   真实 API 的登录请求加密方式（从 JS Bundle 逆向）：
   1. 生成随机 32 位 AES key (nonce)
   2. 用 RSA 公钥加密 nonce → rsaEncrypted
   3. 用 AES(ECB, PKCS7) 加密 JSON payload → aesEncrypted
   4. 最终 POST body = "rsaEncrypted.aesEncrypted"（字符串）
   ============================================================ */

import CryptoJS from 'crypto-js';

// 平台 RSA 公钥（从 JS Bundle 中提取）
const RSA_PUBLIC_KEY = `MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAuY9qiyDZ3T7xq9clVLFHQ55pgvc2ZqUBRPik2mNMeJOXZaPcuHfLHFSDgdo9aJYS/ISn+rOxk40UNHXY593mxzsThTOxLFglomapQLjVQP9rp5L2uDBC44js6D7Q4MMCoGd+CiJO+9RGlrNFVQzDRrERHtl/nUfL5/vOwlYFXbrvzfPuNcnuMLua8casU1yo2NoElls3OIIoVuB/caEwRL40X+d0MMb4B5bsb4lmLTKPDLyzG3Rg2VRV+8pfhGdp8wusg++ZRlnowLHVANbVc9Ha3p9r8daURK3clo1ZLyjTTZiTTtJB8sOnTpdqiozXOJmGwqIC/Lf+rgP8Lgn6zQIDAQAB`;

/* ── 生成随机字母数字字符串（AES Key） ── */
function generateNonce(length = 32): string {
    const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
}

/* ── RSA 加密（PKCS1 v1.5）── */
async function rsaEncrypt(text: string): Promise<string> {
    // 动态导入 jsencrypt（避免 SSR 问题）
    const { JSEncrypt } = await import('jsencrypt');
    const encryptor = new JSEncrypt();
    encryptor.setPublicKey(RSA_PUBLIC_KEY);
    const encrypted = encryptor.encrypt(text);
    if (!encrypted) throw new Error('RSA encryption failed');
    return encrypted;
}

/* ── AES 加密（ECB 模式，PKCS7 填充）── */
function aesEncrypt(data: object, key: string): string {
    const jsonStr = JSON.stringify(data);
    const encrypted = CryptoJS.AES.encrypt(
        CryptoJS.enc.Utf8.parse(jsonStr),
        CryptoJS.enc.Utf8.parse(key),
        {
            mode: CryptoJS.mode.ECB,
            padding: CryptoJS.pad.Pkcs7,
        }
    );
    return encrypted.toString();
}

/* ── 主函数：生成加密后的 POST body ── */
export async function encryptPayload(data: object): Promise<string> {
    const nonce = generateNonce(32);              // 随机 AES key
    const rsaEncrypted = await rsaEncrypt(nonce); // 用 RSA 加密 AES key
    const aesEncrypted = aesEncrypt(data, nonce); // 用 AES 加密实际数据
    return `${rsaEncrypted}.${aesEncrypted}`;     // 格式: "rsa加密key.aes加密数据"
}
