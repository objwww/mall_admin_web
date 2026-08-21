import type { CommonPage } from '@/types/common'
import type {
  AfterSaleDetail,
  AfterSaleSummary,
  AfterSaleQueryParam,
  AfterSaleApproveParam,
  AfterSaleRejectParam,
  AfterSaleReceiveParam,
  OmsOrderReturnReason,
  OmsExpressCompany,
  OmsCompanyAddress,
} from '@/types/afterSale'
import http from '@/utils/http'

/**
 * 后台售后列表
 */
export function getAfterSaleListAPI(params: AfterSaleQueryParam) {
  return http<CommonPage<AfterSaleSummary>>({
    url: '/afterSale/list',
    method: 'get',
    params,
  })
}

/**
 * 后台售后详情
 */
export function getAfterSaleDetailAPI(id: number) {
  return http<AfterSaleDetail>({
    url: `/afterSale/${id}`,
    method: 'get',
  })
}

/**
 * 审核通过
 */
export function approveAfterSaleAPI(id: number, data: AfterSaleApproveParam) {
  return http({
    url: `/afterSale/${id}/approve`,
    method: 'post',
    data,
  })
}

/**
 * 审核拒绝
 */
export function rejectAfterSaleAPI(id: number, data: AfterSaleRejectParam) {
  return http({
    url: `/afterSale/${id}/reject`,
    method: 'post',
    data,
  })
}

/**
 * 商家确认收货
 */
export function receiveAfterSaleAPI(id: number, data: AfterSaleReceiveParam) {
  return http({
    url: `/afterSale/${id}/receive`,
    method: 'post',
    data,
  })
}

/**
 * 查询售后原因列表
 */
export function getAfterSaleReasonsAPI() {
  return http<OmsOrderReturnReason[]>({
    url: '/returnReason/list',
    method: 'get',
    params: { pageNum: 1, pageSize: 100 },
  })
}

/**
 * 查询快递公司列表
 */
export function getExpressCompaniesAPI() {
  return http<OmsExpressCompany[]>({
    url: '/afterSale/expressCompanies',
    method: 'get',
  })
}

/**
 * 查询公司收货地址列表
 */
export function getCompanyAddressListAPI() {
  return http<OmsCompanyAddress[]>({
    url: '/companyAddress/list',
    method: 'get',
  })
}
