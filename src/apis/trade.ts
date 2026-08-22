import http from '@/utils/http'

/* ==================== 交易支撑-快递公司 ==================== */

export function getExpressCompanyListAPI(params: Record<string, any>) {
  return http<Record<string, any>>({ url: '/expressCompany/list', method: 'get', params })
}
export function getExpressCompanyOptionsAPI() {
  return http<Record<string, any>[]>({ url: '/expressCompany/options', method: 'get' })
}
export function createExpressCompanyAPI(data: Record<string, any>) {
  return http<number>({ url: '/expressCompany/create', method: 'post', params: data })
}
export function updateExpressCompanyAPI(data: Record<string, any>) {
  return http<number>({ url: '/expressCompany/update', method: 'post', params: data })
}
export function deleteExpressCompanyAPI(id: number) {
  return http<number>({ url: '/expressCompany/delete', method: 'post', params: { id } })
}

/* ==================== 交易支撑-运费模板 ==================== */

export function getFreightTemplateListAPI(params: Record<string, any>) {
  return http<Record<string, any>>({ url: '/freightTemplate/list', method: 'get', params })
}
export function createFreightTemplateAPI(data: Record<string, any>) {
  return http<number>({ url: '/freightTemplate/create', method: 'post', params: data })
}
export function updateFreightTemplateAPI(data: Record<string, any>) {
  return http<number>({ url: '/freightTemplate/update', method: 'post', params: data })
}
export function deleteFreightTemplateAPI(id: number) {
  return http<number>({ url: '/freightTemplate/delete', method: 'post', params: { id } })
}

/* ==================== 交易支撑-自提点 ==================== */

export function getPickupPointListAPI(params: Record<string, any>) {
  return http<Record<string, any>>({ url: '/pickupPoint/list', method: 'get', params })
}
export function getPickupPointOptionsAPI() {
  return http<Record<string, any>[]>({ url: '/pickupPoint/options', method: 'get' })
}
export function createPickupPointAPI(data: Record<string, any>) {
  return http<number>({ url: '/pickupPoint/create', method: 'post', params: data })
}
export function updatePickupPointAPI(data: Record<string, any>) {
  return http<number>({ url: '/pickupPoint/update', method: 'post', params: data })
}
export function deletePickupPointAPI(id: number) {
  return http<number>({ url: '/pickupPoint/delete', method: 'post', params: { id } })
}

/* ==================== 交易支撑-自提核销码 ==================== */

/** 生成自提核销码 */
export function generatePickupCodeAPI(data: Record<string, any>) {
  return http<Record<string, any>>({ url: '/pickupCode/generate', method: 'post', params: data })
}
/** 核销 */
export function verifyPickupCodeAPI(code: string) {
  return http<Record<string, any>>({ url: '/pickupCode/verify', method: 'post', params: { code } })
}
/** 分页查询核销码 */
export function getPickupCodeListAPI(params: Record<string, any>) {
  return http<Record<string, any>>({ url: '/pickupCode/list', method: 'get', params })
}
