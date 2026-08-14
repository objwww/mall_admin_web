import http from '@/utils/http'
import type { CommonResult } from '@/types/common'

/* ==================== 系统管理-字典 ==================== */

/** 分页查询字典类型 */
export function getDictTypeListAPI(params: Record<string, any>) {
  return http<CommonResult<Record<string, any>>>({ url: '/dict/type/list', method: 'get', params })
}
/** 新增字典类型 */
export function createDictTypeAPI(data: Record<string, any>) {
  return http<CommonResult<number>>({ url: '/dict/type/create', method: 'post', params: data })
}
/** 修改字典类型 */
export function updateDictTypeAPI(data: Record<string, any>) {
  return http<CommonResult<number>>({ url: '/dict/type/update', method: 'post', params: data })
}
/** 删除字典类型 */
export function deleteDictTypeAPI(id: number) {
  return http<CommonResult<number>>({ url: '/dict/type/delete', method: 'post', params: { id } })
}
/** 查询字典数据列表 */
export function getDictDataListAPI(dictType: string) {
  return http<CommonResult<Record<string, any>[]>>({ url: '/dict/data/list', method: 'get', params: { dictType } })
}
/** 新增字典数据 */
export function createDictDataAPI(data: Record<string, any>) {
  return http<CommonResult<number>>({ url: '/dict/data/create', method: 'post', params: data })
}
/** 修改字典数据 */
export function updateDictDataAPI(data: Record<string, any>) {
  return http<CommonResult<number>>({ url: '/dict/data/update', method: 'post', params: data })
}
/** 删除字典数据 */
export function deleteDictDataAPI(id: number) {
  return http<CommonResult<number>>({ url: '/dict/data/delete', method: 'post', params: { id } })
}
/** 按类型获取启用字典项（前端取数） */
export function getDictOptionsAPI(dictType: string) {
  return http<CommonResult<Record<string, any>[]>>({ url: '/dict/data/options', method: 'get', params: { dictType } })
}

/* ==================== 系统管理-部门 ==================== */

/** 部门列表（树形） */
export function getDeptListAPI(params: Record<string, any>) {
  return http<CommonResult<Record<string, any>[]>>({ url: '/dept/list', method: 'get', params })
}
/** 新增部门 */
export function createDeptAPI(data: Record<string, any>) {
  return http<CommonResult<number>>({ url: '/dept/create', method: 'post', params: data })
}
/** 修改部门 */
export function updateDeptAPI(data: Record<string, any>) {
  return http<CommonResult<number>>({ url: '/dept/update', method: 'post', params: data })
}
/** 删除部门 */
export function deleteDeptAPI(id: number) {
  return http<CommonResult<number>>({ url: '/dept/delete', method: 'post', params: { id } })
}
/** 给管理员分配部门/岗位 */
export function assignAdminOrgAPI(data: Record<string, any>) {
  return http<CommonResult<number>>({ url: '/dept/admin/assign', method: 'post', params: data })
}
/** 当前登录人数据范围 */
export function getCurrentScopeAPI() {
  return http<CommonResult<Record<string, any>>>({ url: '/dept/scope/current', method: 'get' })
}

/* ==================== 系统管理-岗位 ==================== */

/** 分页查询岗位 */
export function getPostListAPI(params: Record<string, any>) {
  return http<CommonResult<Record<string, any>>>({ url: '/post/list', method: 'get', params })
}
/** 全部启用岗位（选项） */
export function getPostOptionsAPI() {
  return http<CommonResult<Record<string, any>[]>>({ url: '/post/options', method: 'get' })
}
/** 新增岗位 */
export function createPostAPI(data: Record<string, any>) {
  return http<CommonResult<number>>({ url: '/post/create', method: 'post', params: data })
}
/** 修改岗位 */
export function updatePostAPI(data: Record<string, any>) {
  return http<CommonResult<number>>({ url: '/post/update', method: 'post', params: data })
}
/** 删除岗位 */
export function deletePostAPI(id: number) {
  return http<CommonResult<number>>({ url: '/post/delete', method: 'post', params: { id } })
}

/* ==================== 系统管理-文件中心 ==================== */

/** 分页查询文件 */
export function getFileListAPI(params: Record<string, any>) {
  return http<CommonResult<Record<string, any>>>({ url: '/file/list', method: 'get', params })
}
/** 上传文件（Multipart，落库MinIO） */
export function uploadFileAPI(formData: FormData) {
  return http<CommonResult<Record<string, any>>>({
    url: '/file/upload',
    method: 'post',
    data: formData,
  })
}
/** 删除文件（对象+记录） */
export function deleteFileAPI(id: number) {
  return http<CommonResult<number>>({ url: '/file/delete', method: 'post', params: { id } })
}
