import http from '@/utils/http'

/* ==================== 营销玩法 ==================== */

/** 限时折扣 */
export function getLimitDiscountListAPI(params: Record<string, any>) {
  return http<Record<string, any>>({ url: '/limitDiscount/list', method: 'get', params })
}
export function createLimitDiscountAPI(data: Record<string, any>) {
  return http<number>({ url: '/limitDiscount/create', method: 'post', params: data })
}
export function updateLimitDiscountAPI(data: Record<string, any>) {
  return http<number>({ url: '/limitDiscount/update', method: 'post', params: data })
}
export function deleteLimitDiscountAPI(id: number) {
  return http<number>({ url: '/limitDiscount/delete', method: 'post', params: { id } })
}
export function getLimitDiscountProductListAPI(activityId: number) {
  return http<Record<string, any>[]>({ url: '/limitDiscount/product/list', method: 'get', params: { activityId } })
}
export function createLimitDiscountProductAPI(data: Record<string, any>) {
  return http<number>({ url: '/limitDiscount/product/create', method: 'post', params: data })
}
export function deleteLimitDiscountProductAPI(id: number) {
  return http<number>({ url: '/limitDiscount/product/delete', method: 'post', params: { id } })
}

/** 满减送 */
export function getFullReductionListAPI(params: Record<string, any>) {
  return http<Record<string, any>>({ url: '/fullReduction/list', method: 'get', params })
}
export function createFullReductionAPI(data: Record<string, any>) {
  return http<number>({ url: '/fullReduction/create', method: 'post', params: data })
}
export function updateFullReductionAPI(data: Record<string, any>) {
  return http<number>({ url: '/fullReduction/update', method: 'post', params: data })
}
export function deleteFullReductionAPI(id: number) {
  return http<number>({ url: '/fullReduction/delete', method: 'post', params: { id } })
}

/** 拼团 */
export function getGrouponListAPI(params: Record<string, any>) {
  return http<Record<string, any>>({ url: '/groupon/list', method: 'get', params })
}
export function createGrouponAPI(data: Record<string, any>) {
  return http<number>({ url: '/groupon/create', method: 'post', params: data })
}
export function updateGrouponAPI(data: Record<string, any>) {
  return http<number>({ url: '/groupon/update', method: 'post', params: data })
}
export function deleteGrouponAPI(id: number) {
  return http<number>({ url: '/groupon/delete', method: 'post', params: { id } })
}
export function getGrouponProductListAPI(activityId: number) {
  return http<Record<string, any>[]>({ url: '/groupon/product/list', method: 'get', params: { activityId } })
}
export function createGrouponProductAPI(data: Record<string, any>) {
  return http<number>({ url: '/groupon/product/create', method: 'post', params: data })
}
export function deleteGrouponProductAPI(id: number) {
  return http<number>({ url: '/groupon/product/delete', method: 'post', params: { id } })
}

/** 砍价 */
export function getBargainListAPI(params: Record<string, any>) {
  return http<Record<string, any>>({ url: '/bargain/list', method: 'get', params })
}
export function createBargainAPI(data: Record<string, any>) {
  return http<number>({ url: '/bargain/create', method: 'post', params: data })
}
export function updateBargainAPI(data: Record<string, any>) {
  return http<number>({ url: '/bargain/update', method: 'post', params: data })
}
export function deleteBargainAPI(id: number) {
  return http<number>({ url: '/bargain/delete', method: 'post', params: { id } })
}
export function getBargainProductListAPI(activityId: number) {
  return http<Record<string, any>[]>({ url: '/bargain/product/list', method: 'get', params: { activityId } })
}
export function createBargainProductAPI(data: Record<string, any>) {
  return http<number>({ url: '/bargain/product/create', method: 'post', params: data })
}
export function deleteBargainProductAPI(id: number) {
  return http<number>({ url: '/bargain/product/delete', method: 'post', params: { id } })
}

/** DIY 装修页 */
export function getDiyPageListAPI(params: Record<string, any>) {
  return http<Record<string, any>>({ url: '/diyPage/list', method: 'get', params })
}
export function getDiyPageAPI(id: number) {
  return http<Record<string, any>>({ url: '/diyPage/get', method: 'get', params: { id } })
}
export function createDiyPageAPI(data: Record<string, any>) {
  return http<number>({ url: '/diyPage/create', method: 'post', params: data })
}
export function updateDiyPageAPI(data: Record<string, any>) {
  return http<number>({ url: '/diyPage/update', method: 'post', params: data })
}
export function deleteDiyPageAPI(id: number) {
  return http<number>({ url: '/diyPage/delete', method: 'post', params: { id } })
}
