import http from '@/utils/http'
import type { CommonResult } from '@/types/common'

/* ==================== 统计报表 ==================== */

/** 交易统计（GMV/订单/退款/趋势） */
export function getTradeStatisticsAPI(params: Record<string, any>) {
  return http<CommonResult<Record<string, any>>>({ url: '/statistics/trade', method: 'get', params })
}
/** 商品统计（销量TOP20） */
export function getProductStatisticsAPI(params: Record<string, any>) {
  return http<CommonResult<Record<string, any>>>({ url: '/statistics/product', method: 'get', params })
}
/** 会员统计 */
export function getMemberStatisticsAPI(params: Record<string, any>) {
  return http<CommonResult<Record<string, any>>>({ url: '/statistics/member', method: 'get', params })
}
/** 支付统计 */
export function getPaymentStatisticsAPI(params: Record<string, any>) {
  return http<CommonResult<Record<string, any>>>({ url: '/statistics/payment', method: 'get', params })
}

/* ==================== 日志审计 ==================== */

export function getAccessLogListAPI(params: Record<string, any>) {
  return http<CommonResult<Record<string, any>>>({ url: '/log/access/list', method: 'get', params })
}
export function getErrorLogListAPI(params: Record<string, any>) {
  return http<CommonResult<Record<string, any>>>({ url: '/log/error/list', method: 'get', params })
}
export function getOperationLogListAPI(params: Record<string, any>) {
  return http<CommonResult<Record<string, any>>>({ url: '/log/operation/list', method: 'get', params })
}

/* ==================== 支付管理 ==================== */

export function getPayOrderListAPI(params: Record<string, any>) {
  return http<CommonResult<Record<string, any>>>({ url: '/payOrder/list', method: 'get', params })
}
export function getPayNotifyTaskListAPI(params: Record<string, any>) {
  return http<CommonResult<Record<string, any>>>({ url: '/payNotifyTask/list', method: 'get', params })
}
export function getPayNotifyLogsAPI(id: number) {
  return http<CommonResult<Record<string, any>[]>>({ url: '/payNotifyTask/' + id + '/logs', method: 'get' })
}
