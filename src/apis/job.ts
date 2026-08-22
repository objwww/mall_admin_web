import http from '@/utils/http'

/* ==================== 任务中心 ==================== */

/** 分页查询定时任务 */
export function getJobListAPI(params: Record<string, any>) {
  return http<Record<string, any>>({ url: '/job/list', method: 'get', params })
}
/** 新增定时任务 */
export function createJobAPI(data: Record<string, any>) {
  return http<number>({ url: '/job/create', method: 'post', params: data })
}
/** 修改定时任务 */
export function updateJobAPI(data: Record<string, any>) {
  return http<number>({ url: '/job/update', method: 'post', params: data })
}
/** 删除定时任务 */
export function deleteJobAPI(id: number) {
  return http<number>({ url: '/job/delete', method: 'post', params: { id } })
}
/** 启停定时任务 */
export function updateJobStatusAPI(id: number, status: number) {
  return http<number>({ url: '/job/status', method: 'post', params: { id, status } })
}
/** 手动执行一次 */
export function runJobAPI(id: number) {
  return http<boolean>({ url: '/job/run', method: 'post', params: { id } })
}
/** 分页查询执行日志 */
export function getJobLogListAPI(params: Record<string, any>) {
  return http<Record<string, any>>({ url: '/job/log/list', method: 'get', params })
}
