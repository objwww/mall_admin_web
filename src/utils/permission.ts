import { useUserStore } from '@/stores/user'

/**
 * 后端资源仍负责安全拦截；这里仅用于隐藏无权限按钮。
 * 支持两种格式：
 * 1. 精确权限码：caselab:manage
 * 2. ID:名称格式：40:caselab:manage（匹配名称部分）
 */
export const hasPermission = (code: string) => {
  const permissions = useUserStore().userInfo.permissions || []
  return permissions.some((p: string) => {
    if (p === code) return true
    // 支持 ID:name 格式，匹配冒号后的名称部分
    const parts = p.split(':')
    if (parts.length >= 2) {
      const namePart = parts.slice(1).join(':')
      if (namePart === code) return true
    }
    return false
  })
}
