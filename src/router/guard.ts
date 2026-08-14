import router from '@/router/index'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import { useUserStore } from '@/stores/user'
import usePermissionStore from '@/stores/permission'

// 无需登陆的白名单路径
const whiteList = ['/login']
// 配置路由前置守卫函数（每次路由跳转都会执行）
router.beforeEach(async (to, from, next) => {
  NProgress.start()
  const userStore = useUserStore()
  const permissionStore = usePermissionStore()
  if (userStore.userInfo.token) {
    if (to.path === '/login') {
      // 登录状态下访问login直接跳转到首页
      next({ path: '/' })
      NProgress.done()
    } else {
      if (permissionStore.addRouters.length === 0) {
        try {
          // 每次进入应用重新拉取用户信息与菜单（后端以数据库为准），
          // 避免持久化的旧菜单导致新增模块（系统管理/统计/日志等）不显示
          await userStore.getUserInfo()
        } catch (e) {
          // token 失效或用户异常：清空本地登录态并回到登录页
          userStore.fedLogout()
          next('/login')
          NProgress.done()
          return
        }
        // 登录状态下无动态路由时根据menus生成动态路由
        permissionStore.generateRoutes({
          menus: userStore.userInfo.menus,
          username: userStore.userInfo.username,
        })
        permissionStore.addRouters.forEach(route => {
          router.addRoute(route)
        })
        next({ ...to, replace: true })
      } else {
        next()
      }
    }
  } else {
    if (whiteList.indexOf(to.path) !== -1) {
      // 未登录状态下白名单路径放行
      next()
    } else {
      // 未登录状态下非白名单路径跳转到登录页
      next('/login')
      NProgress.done()
    }
  }
})

// 配置路由后置函数守卫函数
router.afterEach(() => {
  NProgress.done()
})
