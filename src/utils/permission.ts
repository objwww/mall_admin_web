import { useUserStore } from '@/stores/user'

/** 后端资源仍负责安全拦截；这里仅用于隐藏无权限按钮。 */
export const hasPermission = (code: string) =>
  useUserStore().userInfo.permissions.includes(code)
