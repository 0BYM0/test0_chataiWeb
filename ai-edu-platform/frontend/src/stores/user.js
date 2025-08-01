import { defineStore } from 'pinia'
// 导入我们创建的 Supabase 客户端实例
import { supabase } from '../supabase'

// 用户状态管理 (Pinia Store)
export const useUserStore = defineStore('user', {
  // 状态：定义所有需要跟踪的数据
  state: () => ({
    user: null, // 当前登录的用户对象
    isLoggedIn: false, // 是否已登录的标志
    role: null, // 用户角色 (例如 'student', 'teacher')
    loading: false, // 是否正在加载中 (例如，在登录或注册时)
    error: null, // 存储发生的错误信息
  }),

  // Getters: 类似于计算属性，用于从 state 派生出新的状态
  getters: {
    // 获取用户角色，提供一个默认值
    getUserRole: (state) => state.role || 'student',
    // 判断是否是学生
    isStudent: (state) => state.role === 'student',
    // 判断是否是教师
    isTeacher: (state) => state.role === 'teacher',
    // 获取用户头像，如果没有则提供一个默认头像
    getUserAvatar: (state) => {
      if (!state.user) return '/avatars/default.png'
      return state.user.avatar_url || `/avatars/${state.role}.png`
    },
    // 获取用户显示名称，优先用 full_name，其次是 username
    getUserDisplayName: (state) => {
      if (!state.user) return '游客'
      return state.user.full_name || state.user.username
    },
  },

  // Actions: 定义可以修改 state 的方法
  actions: {
    // 登录方法
    async login(email, password) {
      this.loading = true
      this.error = null
      try {
        // 调用我们部署的 'auth' 云函数的 'signin' 路由
        const { data: functionData, error: functionError } = await supabase.functions.invoke('auth', {
          body: { email, password },
          method: 'POST',
          headers: { 'x-function-route': 'signin' }
        })

        if (functionError) throw functionError;
        if (functionData.error) throw new Error(functionData.error);

        // 使用从函数返回的 session 来设置 Supabase Auth 的当前会话
        const { data: sessionData, error: sessionError } = await supabase.auth.setSession(functionData.session)
        if (sessionError) throw sessionError;

        // 确保使用 setSession 返回的 user 对象来更新状态，
        // 因为这个对象是 Supabase Auth 权威的用户实例。
        // onAuthStateChange 监听器也会被触发，但为了确保 login 方法返回前状态已更新，
        // 我们在这里手动调用 setUser。
        if (sessionData.session && sessionData.session.user) {
          await this.setUser(sessionData.session.user)
        } else {
          // 如果 session 无效，则尝试从 Supabase 获取当前用户
          await this.fetchUser();
        }

        return { success: true }
      } catch (err) {
        this.error = err.message
        return { success: false, message: err.message }
      } finally {
        this.loading = false
      }
    },

    // 注册方法
    async register(email, password, username, role) {
      this.loading = true
      this.error = null
      try {
        // 调用我们部署的 'auth' 云函数的 'signup' 路由
        const { data, error } = await supabase.functions.invoke('auth', {
            body: { email, password, username, role },
            method: 'POST',
            headers: { 'x-function-route': 'signup' }
        });

        if (error) throw error;
        if (data.error) throw new Error(data.error);

        // Supabase 默认需要邮箱验证，这里我们提示用户
        return { success: true, message: '注册成功！请检查您的邮箱以完成验证。' }
      } catch (err) {
        this.error = err.message
        return { success: false, message: err.message }
      } finally {
        this.loading = false
      }
    },

    // 登出方法
    async logout() {
      this.loading = true
      await supabase.auth.signOut()
      // 清空本地状态
      this.user = null
      this.isLoggedIn = false
      this.role = null
      this.loading = false
    },

    // 从 Supabase 获取当前用户并设置状态
    async fetchUser() {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            await this.setUser(user)
        } else {
            await this.logout()
        }
    },
    
    // 统一设置用户状态的内部方法
    async setUser(authUser) {
        if (!authUser) {
            this.user = null
            this.isLoggedIn = false
            this.role = null
            return
        }
        // 从我们自己的 public.users 表中获取更详细的用户信息
        const { data: profile, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', authUser.id)
            .single()

        if (error) {
            console.error("获取用户资料失败:", error)
            // 即使获取资料失败，也设置基本信息
            this.user = { id: authUser.id, email: authUser.email, ...authUser.user_metadata }
        } else {
            this.user = profile
        }
        
        this.isLoggedIn = true
        // 从 user_metadata 中获取角色信息
        this.role = authUser.user_metadata.role || 'student'
    },

    // 监听 Supabase 认证状态的变化
    setupAuthListener() {
      supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN') {
          this.setUser(session.user)
        } else if (event === 'SIGNED_OUT') {
          this.setUser(null)
        } else if (event === 'USER_UPDATED') {
          this.setUser(session.user)
        }
      })
    },
  },
})