import type { CommonPage } from '@/types/common'
import type { OmsOrderRefund, RefundQueryParam } from '@/types/refund'
import http from '@/utils/http'

/**
 * 退款单列表
 */
export function getRefundListAPI(params: RefundQueryParam) {
  return http<CommonPage<OmsOrderRefund>>({
    url: '/refund/list',
    method: 'get',
    params,
  })
}

/**
 * 退款单详情
 */
export function getRefundDetailAPI(id: number) {
  return http<OmsOrderRefund>({
    url: `/refund/${id}`,
    method: 'get',
  })
}

/**
 * 执行退款
 */
export function executeRefundAPI(id: number, handleMan?: string, handleNote?: string) {
  return http({
    url: `/refund/execute/${id}`,
    method: 'post',
    params: { handleMan, handleNote },
  })
}

/**
 * 退款失败重试
 */
export function retryRefundAPI(id: number, handleMan?: string) {
  return http({
    url: `/refund/retry/${id}`,
    method: 'post',
    params: { handleMan },
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
