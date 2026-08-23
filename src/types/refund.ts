/** 后台退款单状态 */
export type RefundStatus = 0 | 1 | 2 | 3

/** 退款单详情 */
export interface OmsOrderRefund {
  id: number
  refundSn: string
  orderId: number
  orderSn: string
  returnApplyId?: number
  memberId: number
  memberUsername?: string
  refundAmount: number
  refundType?: number
  channelCode?: string
  channelRefundNo?: string
  status: RefundStatus
  retryCount?: number
  lastRetryTime?: string
  integrationRefundStatus?: number
  errorMsg?: string
  handleMan?: string
  handleNote?: string
  handleTime?: string
  finishTime?: string
  createTime: string
  updateTime?: string
}

/** 退款单查询参数 */
export interface RefundQueryParam {
  pageNum: number
  pageSize: number
  orderSn?: string
  status?: RefundStatus
}

/** 退款操作审计记录 */
export interface RefundAuditLog {
  id: number
  refundId: number
  refundSn: string
  action: string
  fromStatus?: RefundStatus
  toStatus?: RefundStatus
  channelRefundNo?: string
  operatorType: 'MEMBER' | 'ADMIN' | 'SYSTEM'
  operatorId?: string
  source: 'MEMBER_WEB' | 'MEMBER_APP' | 'ADMIN_WEB' | 'AGENT' | 'JOB' | 'SYSTEM'
  success: 0 | 1
  errorMsg?: string
  traceId?: string
  createTime: string
}

/** 退款状态文本映射 */
export const refundStatusText: Record<number, string> = {
  0: '待退款',
  1: '退款中',
  2: '退款成功',
  3: '退款失败',
}

/** 退款渠道文本映射 */
export const refundChannelText: Record<string, string> = {
  alipay: '支付宝',
  wechat: '微信支付',
  mock: '模拟渠道',
  balance: '余额',
}

/** 退款审计动作中文映射 */
export const refundAuditActionText: Record<string, string> = {
  REFUND_CREATED: '创建退款单',
  REFUND_EXECUTE: '执行退款',
  CHANNEL_ACCEPTED: '渠道已受理',
  CHANNEL_SUCCESS: '渠道退款成功',
  CHANNEL_FAILED: '渠道退款失败',
  CHANNEL_UNKNOWN: '渠道结果未知',
  MANUAL_RETRY: '人工重试',
  RECONCILE_START: '开始渠道对账',
  RECONCILE_PROCESSING: '渠道仍在处理',
  RECONCILE_SUCCESS: '渠道对账成功',
  RECONCILE_FAILED: '渠道对账失败',
  SETTLEMENT_SUCCESS: '本地结算成功',
  SETTLEMENT_FAILED: '本地结算失败',
}

export const refundOperatorTypeText: Record<string, string> = {
  MEMBER: '会员',
  ADMIN: '管理员',
  SYSTEM: '系统',
}

export const refundOperationSourceText: Record<string, string> = {
  MEMBER_WEB: '商城网页',
  MEMBER_APP: '商城应用',
  ADMIN_WEB: '管理后台',
  AGENT: '智能助手',
  JOB: '定时任务',
  SYSTEM: '系统自动',
}
