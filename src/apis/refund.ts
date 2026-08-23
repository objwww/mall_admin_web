import type { CommonPage } from '@/types/common'
import type { OmsOrderRefund, RefundAuditLog, RefundQueryParam } from '@/types/refund'
import http from '@/utils/http'

/**
 * 退款单列表
 */
export function getRefundListAPI(params: RefundQueryParam) {
  return http<CommonPage<OmsOrderRefund>>({
    url: '/refund/read/list',
    method: 'get',
    params,
  })
}

/**
 * 退款单详情
 */
export function getRefundDetailAPI(id: number) {
  return http<OmsOrderRefund>({
    url: `/refund/read/${id}`,
    method: 'get',
  })
}

/**
 * 退款失败重试
 */
export function retryRefundAPI(id: number) {
  return http({
    url: `/refund/retry/${id}`,
    method: 'post',
  })
}

/**
 * 退款操作审计记录
 */
export function getRefundLogsAPI(id: number) {
  return http<RefundAuditLog[]>({
    url: `/refund/read/${id}/logs`,
    method: 'get',
  })
}

/**
 * 查询退款渠道状态（PROCESSING 卡死恢复）
 */
export function reconcileRefundAPI(id: number) {
  return http({
    url: `/refund/reconcile/${id}`,
    method: 'post',
  })
}
