import http from '@/utils/http'

/* ==================== 会员-标签/分组 ==================== */

/** 标签列表（含会员数） */
export function getMemberTagListAPI() {
  return http<Record<string, any>[]>({ url: '/memberTag/list', method: 'get' })
}
/** 新增标签 */
export function createMemberTagAPI(data: Record<string, any>) {
  return http<number>({ url: '/memberTag/create', method: 'post', params: data })
}
/** 修改标签 */
export function updateMemberTagAPI(data: Record<string, any>) {
  return http<number>({ url: '/memberTag/update', method: 'post', params: data })
}
/** 删除标签 */
export function deleteMemberTagAPI(id: number) {
  return http<number>({ url: '/memberTag/delete', method: 'post', params: { id } })
}
/** 给会员打标签（覆盖式） */
export function assignMemberTagAPI(data: Record<string, any>) {
  return http<number>({ url: '/memberTag/assign', method: 'post', params: data })
}
/** 查询会员标签 */
export function getMemberTagsAPI(memberId: number) {
  return http<Record<string, any>[]>({ url: '/memberTag/memberTags', method: 'get', params: { memberId } })
}
/** 按标签/关键字分页查询会员 */
export function getMemberPageAPI(params: Record<string, any>) {
  return http<Record<string, any>>({ url: '/memberTag/memberPage', method: 'get', params })
}
/** 按阈值自动打标签 */
export function autoMemberTagAPI() {
  return http<number>({ url: '/memberTag/autoTag', method: 'post' })
}

/* ==================== 会员-等级升级 ==================== */

/** 按成长值自动升级会员等级 */
export function upgradeMemberLevelAPI(memberId: number) {
  return http<Record<string, any>>({ url: '/memberLevelUpgrade/upgrade', method: 'post', params: { memberId } })
}
/** 分页查询等级变更记录 */
export function getLevelUpgradeHistoryAPI(params: Record<string, any>) {
  return http<Record<string, any>>({ url: '/memberLevelUpgrade/history', method: 'get', params })
}

/* ==================== 会员-成长值/积分调整 ==================== */

/** 调整会员成长值 */
export function adjustGrowthAPI(data: Record<string, any>) {
  return http<number>({ url: '/memberAsset/adjustGrowth', method: 'post', params: data })
}
/** 调整会员积分 */
export function adjustIntegrationAPI(data: Record<string, any>) {
  return http<number>({ url: '/memberAsset/adjustIntegration', method: 'post', params: data })
}
/** 查询会员成长值流水 */
export function getGrowthHistoryAPI(params: Record<string, any>) {
  return http<Record<string, any>>({ url: '/memberAsset/growthHistory', method: 'get', params })
}
/** 查询会员积分流水 */
export function getIntegrationHistoryAPI(params: Record<string, any>) {
  return http<Record<string, any>>({ url: '/memberAsset/integrationHistory', method: 'get', params })
}
