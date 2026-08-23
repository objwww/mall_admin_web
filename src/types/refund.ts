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
