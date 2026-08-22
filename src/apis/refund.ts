import type { CommonPage } from '@/types/common'
import type { OmsOrderRefund, RefundQueryParam } from '@/types/refund'
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
 * 查询退款渠道状态（PROCESSING 卡死恢复）
 */
export function reconcileRefundAPI(id: number) {
  return http({
    url: `/refund/reconcile/${id}`,
    method: 'post',
  })
}
