import { createApp } from 'vue'
import { createPinia } from 'pinia'
import TDesign from 'tdesign-vue-next'
import App from './App.vue'
import router from './router'
// 我们改造后的 userStore 完全依赖 Supabase，不再需要 axios
// import { setupAxios } from './utils/httpInterceptor' 
import { useUserStore } from './stores/user'
import { ROUTE_CONFIG } from './config'
// supabase 实例只在 store 中使用，这里不再需要导入
// import { supabase } from './services/supabase'

// 导入TDesign样式
import 'tdesign-vue-next/es/style/index.css'

// 导入全局样式
import './style.css'


// --- 重构后的应用初始化流程 ---

// 创建一个异步函数来初始化整个应用
// 这样做可以确保在应用挂载和路由开始工作前，我们已经完成了异步的认证状态检查
async function initializeApp() {
  // 1. 创建 Vue 和 Pinia 实例
  const app = createApp(App)
  const pinia = createPinia()
  app.use(pinia)

  // 2. 获取用户状态管理器
  // 必须在 app.use(pinia) 之后调用
  const userStore = useUserStore()

  // 3. 激活认证状态监听器
  // 这会像一个哨兵一样，持续监听登录、登出等事件
  userStore.setupAuthListener()

  // 4. 关键步骤：尝试从 Supabase 同步当前用户的登录状态
  // await 确保了这个异步操作完成后，再继续执行后面的代码
  // 这可以防止页面刷新时，因状态未恢复而被错误地重定向到登录页
  await userStore.fetchUser()

  // 5. 配置路由守卫
  // 此时，userStore.isLoggedIn 已经是最新的状态了
  router.beforeEach((to, from, next) => {
    const isLoggedIn = userStore.isLoggedIn
    const userRole = userStore.role
    const requiredAuth = to.meta.requiresAuth
    const requiredRole = to.meta.role

    if (requiredAuth && !isLoggedIn) {
      // 如果路由需要认证，但用户未登录，则重定向到登录页
      next({ path: ROUTE_CONFIG.LOGIN_ROUTE, query: { redirect: to.fullPath } })
    } else if (requiredRole && isLoggedIn && requiredRole !== userRole) {
      // 如果用户已登录，但角色不匹配，则重定向到该角色对应的主页
      next({ path: ROUTE_CONFIG.HOME_ROUTES[userRole] || ROUTE_CONFIG.DEFAULT_ROUTE })
    } else {
      // 其他所有情况（无需认证、已登录且角色匹配等）都直接放行
      next()
    }
  })

  // 6. 注册插件和组件库
  app.use(router)
  app.use(TDesign)

  // 7. 配置全局错误处理器
  app.config.errorHandler = (err, vm, info) => {
    console.error('全局错误:', err, info)
    // 可以在这里添加错误上报逻辑
  }

  // 8. 挂载应用
  app.mount('#app')
}

// 执行异步初始化函数
initializeApp()