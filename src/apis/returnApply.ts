import type { CommonPage } from '@/types/common'
import type {
  OmsOrderReturnApply,
  OmsOrderReturnApplyResult,
  ReturnApplyQueryParam,
  ApproveAfterSaleRequest,
  RejectAfterSaleRequest,
  ReceiveAfterSaleRequest,
} from '@/types/returnApply'
import http from '@/utils/http'

/**
 * 分页查询售后申请（新 API：/afterSale/read/list）
 */
export function getAfterSaleListAPI(params: ReturnApplyQueryParam) {
  return http<CommonPage<OmsOrderReturnApply>>({
    url: '/afterSale/read/list',
    method: 'get',
    params: params,
  })
}

/**
 * 获取售后申请详情（新 API：/afterSale/read/{id}）
 */
export function getAfterSaleDetailAPI(id: number) {
  return http<OmsOrderReturnApplyResult>({
    url: `/afterSale/read/${id}`,
    method: 'get',
  })
}

/**
 * 审核通过售后（新 API：/afterSale/audit/{id}/approve）
 * Release A: 操作人来自后端登录态，客户端不传 handleMan
 */
export function approveAfterSaleAPI(id: number, data: ApproveAfterSaleRequest) {
  return http({
    url: `/afterSale/audit/${id}/approve`,
    method: 'post',
    data: data,
  })
}

/**
 * 审核拒绝售后（新 API：/afterSale/audit/{id}/reject）
 */
export function rejectAfterSaleAPI(id: number, data: RejectAfterSaleRequest) {
  return http({
    url: `/afterSale/audit/${id}/reject`,
    method: 'post',
    data: data,
  })
}

/**
 * 确认收到退货（新 API：/afterSale/receive/{id}）
 */
export function receiveAfterSaleAPI(id: number, data: ReceiveAfterSaleRequest) {
  return http({
    url: `/afterSale/receive/${id}`,
    method: 'post',
    data: data,
  })
}

// ========== 旧 API（兼容保留，仅只读） ==========

/**
 * 分页查询退货申请（旧 API，兼容保留）
 * @deprecated 请使用 getAfterSaleListAPI
 */
export function getReturnApplyListAPI(params: ReturnApplyQueryParam) {
  return http<CommonPage<OmsOrderReturnApply>>({
    url: '/returnApply/list',
    method: 'get',
    params: params,
  })
}

/**
 * 获取退货申请详情（旧 API，兼容保留）
 * @deprecated 请使用 getAfterSaleDetailAPI
 */
export function getReturnApplyByIdAPI(id: number) {
  return http<OmsOrderReturnApplyResult>({
    url: '/returnApply/' + id,
    method: 'get',
  })
}
