/* ============================================================
   types/index.ts — 全项目 TypeScript 类型定义
   所有接口和类型都集中在此文件，方便维护和查找
   ============================================================ */

// ── 用户 & 认证 ─────────────────────────────────────────────

/** 已登录用户的基本信息 */
export interface User {
  id: string;
  uid: string;
  email: string;
  phone?: string;
  avatar?: string;
  kycStatus: 'unverified' | 'pending' | 'verified';
  hasFundPassword: boolean;
  has2FA: boolean;
  inviteCode: string;
  createdAt: string;
}

/** 登录请求参数 */
export interface LoginPayload {
  email: string;
  password: string;
}

/** 注册请求参数 */
export interface RegisterPayload {
  email: string;
  password: string;
  confirmPassword: string;
  inviteCode?: string;
  otp: string;
}

/** API 登录/注册成功响应中的 Token 数据 */
export interface AuthToken {
  token: string;
  expiresAt: string;
}

// ── 市场行情 ──────────────────────────────────────────────────

/** 单个交易对的实时行情 */
export interface MarketTicker {
  symbol: string;        // e.g. "XAUUSD"
  price: number;         // 当前价格
  change24h: number;     // 24小时价格变动（绝对值）
  changePercent24h: number; // 24小时涨跌幅（百分比）
  volume24h: number;     // 24小时成交量
  high24h: number;       // 24小时最高价
  low24h: number;        // 24小时最低价
}

/** K 线单根蜡烛数据（用于 TradingView Lightweight Charts） */
export interface KlineCandle {
  time: number;   // Unix 时间戳（秒）
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

// ── 期权交易（Options） ───────────────────────────────────────

/** 期权产品（时间周期配置） */
export interface OptionProduct {
  id: string;
  period: number;       // 期限（秒），如 30, 60, 300
  periodLabel: string;  // 显示文字，如 "30s", "1min"
  profitRate: number;   // 收益率，如 85 代表 85%
  minAmount: number;
  maxAmount: number;
}

/** 提交期权订单的请求参数 */
export interface OptionOrderPayload {
  symbol: string;
  amount: number;
  productId: string;    // 期权产品 ID（对应时间周期）
  direction: 'up' | 'down';
}

/** 期权订单记录 */
export interface OptionOrder {
  id: string;
  symbol: string;
  amount: number;
  direction: 'up' | 'down';
  profitRate: number;
  openPrice: number;
  closePrice?: number;
  status: 'active' | 'won' | 'lost';
  pnl?: number;         // 盈亏金额（负数为亏损）
  openTime: string;
  closeTime?: string;
  expiresAt: string;
}

// ── 合约交易（Contract） ──────────────────────────────────────

/** 合约产品配置 */
export interface ContractProduct {
  symbol: string;
  maxLeverage: number;  // 最大杠杆倍数
  minMargin: number;
  makerFee: number;     // 挂单手续费率
  takerFee: number;     // 吃单手续费率
}

/** 开仓请求参数 */
export interface ContractOrderPayload {
  symbol: string;
  margin: number;         // 保证金金额
  leverage: number;       // 杠杆倍数（1-10）
  direction: 'long' | 'short';
  quantity?: number;
  takeProfit?: number;    // 止盈价格（可选）
  stopLoss?: number;      // 止损价格（可选）
}

/** 合约持仓 */
export interface ContractPosition {
  id: string;
  symbol: string;
  direction: 'long' | 'short';
  margin: number;
  leverage: number;
  quantity: number;
  openPrice: number;
  markPrice: number;      // 当前标记价格
  pnl: number;            // 未实现盈亏
  pnlPercent: number;
  liquidationPrice: number; // 强平价格
  openTime: string;
}

// ── Mining 挖矿/存储 ──────────────────────────────────────────

/** 挖矿计划产品 */
export interface MiningProduct {
  id: string;
  name: string;
  description?: string;
  dailyRate: number;    // 日利率（%）
  period: number;       // 期限（天）
  minAmount: number;
  maxAmount?: number;
  totalSlots?: number;   // 总名额
  remainingSlots?: number;
}

/** 提交购买挖矿计划的参数 */
export interface MiningSubscribePayload {
  productId: string;
  amount: number;
  fundPassword: string;
}

/** 用户的挖矿订单 */
export interface MiningOrder {
  id: string;
  productName: string;
  amount: number;
  dailyRate: number;
  totalEarned: number;
  status: 'active' | 'completed';
  startDate: string;
  endDate: string;
}

// ── 资产 & 钱包 ───────────────────────────────────────────────

/** 单个资产余额 */
export interface AssetBalance {
  currency: string;   // e.g. "USDT", "XAU"
  balance: number;
  available: number;  // 可用余额（总余额 - 冻结）
  frozen: number;     // 冻结金额（在交易中）
  usdtValue: number;  // 折合 USDT 价值
}

/** 充值地址 */
export interface DepositAddress {
  currency: string;
  network: string;    // e.g. "TRC20", "ERC20"
  address: string;
  minDeposit: number;
}

/** 提现请求参数 */
export interface WithdrawPayload {
  currency: string;
  network: string;
  address: string;
  amount: number;
  fundPassword: string;
}

/** 资产流水记录 */
export interface AssetRecord {
  id: string;
  type: 'deposit' | 'withdraw' | 'trade' | 'mining' | 'fee';
  currency: string;
  amount: number;      // 正数入账，负数出账
  status: 'pending' | 'completed' | 'failed';
  txHash?: string;     // 区块链交易哈希（充提款时有）
  remark?: string;
  createdAt: string;
}

// ── 通知 ──────────────────────────────────────────────────────

/** 系统通知 */
export interface Notification {
  id: string;
  title: string;
  content: string;
  isRead: boolean;
  type: 'system' | 'trade' | 'deposit' | 'withdraw';
  createdAt: string;
}

// ── 客服聊天 ──────────────────────────────────────────────────

/** 聊天消息 */
export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'support';
  type: 'text' | 'image' | 'file';
  fileUrl?: string;
  createdAt: string;
}

// ── API 响应通用结构 ──────────────────────────────────────────

/** 所有 API 的通用响应包装 */
export interface ApiResponse<T = unknown> {
  code: number;      // 0 或 200 = 成功，其他 = 错误
  message: string;
  data: T;
}
