<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <!--<img src="../assets/logo.png" alt="智能教育平台" class="logo" />-->
        <h1 class="title">智能教育应用平台</h1>
        <p class="subtitle">辅助人工智能教学与学习的智能平台</p>
      </div>
      
      <t-tabs v-model="activeTab" class="login-tabs">
        <t-tab-panel value="login" label="登录">
          <t-form ref="loginForm" :data="loginData" :rules="loginRules" @submit="onLoginSubmit" class="login-form">
            <!-- 用户名 -->
            <t-form-item name="username" label="用户名">
              <t-input
                v-model="loginData.username"
                placeholder="请输入用户名"
                :maxlength="20"
              />
            </t-form-item>
            
            <!-- 密码 -->
            <t-form-item name="password" label="密码">
              <t-input
                v-model="loginData.password"
                type="password"
                placeholder="请输入密码"
                :maxlength="20"
              />
            </t-form-item>
            
            <!-- 记住我 -->
            <t-form-item>
              <t-checkbox v-model="loginData.remember">记住我</t-checkbox>
              <t-link theme="primary" hover="color" class="forget-pwd">忘记密码？</t-link>
            </t-form-item>
            
            <!-- 提交按钮 -->
            <t-form-item>
              <t-button theme="primary" type="submit" block :loading="loading">登录</t-button>
            </t-form-item>
          </t-form>
        </t-tab-panel>
        
        <t-tab-panel value="register" label="注册">
          <t-form ref="registerForm" :data="registerData" :rules="registerRules" @submit="onRegisterSubmit" class="login-form">
            <!-- 用户名 -->
            <t-form-item name="username" label="用户名">
              <t-input
                v-model="registerData.username"
                placeholder="请输入用户名（3-20个字符）"
                :maxlength="20"
              />
            </t-form-item>
            
            <!-- 邮箱 -->
            <t-form-item name="email" label="邮箱">
              <t-input
                v-model="registerData.email"
                placeholder="请输入邮箱"
                :maxlength="50"
              />
            </t-form-item>
            
            <!-- 密码 -->
            <t-form-item name="password" label="密码">
              <t-input
                v-model="registerData.password"
                type="password"
                placeholder="请输入密码（至少6个字符）"
                :maxlength="20"
              />
            </t-form-item>
            
            <!-- 确认密码 -->
            <t-form-item name="confirmPassword" label="确认密码">
              <t-input
                v-model="registerData.confirmPassword"
                type="password"
                placeholder="请再次输入密码"
                :maxlength="20"
              />
            </t-form-item>
            
            <!-- 角色选择 -->
            <t-form-item name="role" label="注册角色">
              <t-radio-group v-model="registerData.role">
                <t-radio value="student">学生</t-radio>
                <t-radio value="teacher">教师</t-radio>
              </t-radio-group>
            </t-form-item>
            
            <!-- 提交按钮 -->
            <t-form-item>
              <t-button theme="primary" type="submit" block :loading="loading">注册</t-button>
            </t-form-item>
          </t-form>
        </t-tab-panel>
      </t-tabs>
    </div>
    
    <!-- 右侧插图 -->
    <div class="login-illustration">
      <div class="illustration-content">
        <h2>探索人工智能教育的未来</h2>
        <p>基于广东省义务教育阶段人工智能素养框架，为学生和教师提供智能化学习与教学体验。</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '../stores/user'
import { MessagePlugin } from 'tdesign-vue-next'
import { supabase } from '../services/supabase'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const loading = ref(false)
const activeTab = ref('login')

// 登录表单数据
const loginData = reactive({
  username: '', // 用于兼容旧系统，实际上使用email
  password: '',
  remember: false
})

// 注册表单数据
const registerData = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: 'student'
})

// 登录表单验证规则
const loginRules = {
  username: [
    { required: true, message: '请输入用户名', type: 'error' },
    { min: 3, message: '用户名不能少于3个字符', type: 'error' }
  ],
  password: [
    { required: true, message: '请输入密码', type: 'error' },
    { min: 6, message: '密码不能少于6个字符', type: 'error' }
  ]
}

// 注册表单验证规则
const registerRules = {
  username: [
    { required: true, message: '请输入用户名', type: 'error' },
    { min: 3, message: '用户名不能少于3个字符', type: 'error' }
  ],
  email: [
    { required: true, message: '请输入邮箱', type: 'error' },
    { validator: validateEmail, message: '请输入有效的邮箱地址', type: 'error' }
  ],
  password: [
    { required: true, message: '请输入密码', type: 'error' },
    { min: 6, message: '密码不能少于6个字符', type: 'error' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', type: 'error' },
    { validator: validateConfirmPassword, message: '两次输入的密码不一致', type: 'error' }
  ],
  role: [
    { required: true, message: '请选择角色', type: 'error' }
  ]
}

// 邮箱验证函数
function validateEmail(val) {
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/
  return emailRegex.test(val)
}

// 确认密码验证函数
function validateConfirmPassword(val) {
  return val === registerData.password
}

// 登录提交
const onLoginSubmit = async ({ validateResult }) => {
  if (validateResult === true) {
    try {
      loading.value = true
      
      // 判断输入的是邮箱还是用户名
      const isEmail = validateEmail(loginData.username)
      let email = loginData.username
      
      // 如果不是邮箱格式，则假设是用户名，添加默认域名后缀
      if (!isEmail) {
        email = `${loginData.username}@example.com`
      }
      
      // 调用登录接口（已更新为使用email）
      const result = await userStore.login(email, loginData.password)
      
      if (result.success) {
        MessagePlugin.success('登录成功')
        
        // 如果有重定向地址，则跳转到重定向地址
        const redirectPath = route.query.redirect || getHomeRouteByRole(userStore.role)
        router.push(redirectPath)
      } else {
        MessagePlugin.error(result.message || '登录失败')
      }
    } catch (error) {
      console.error('登录错误:', error)
      MessagePlugin.error(error.message || '登录失败，请稍后再试')
    } finally {
      loading.value = false
    }
  }
}

// 注册提交
const onRegisterSubmit = async ({ validateResult }) => {
  if (validateResult === true) {
    try {
      loading.value = true
      
      // 使用Supabase注册
      const result = await userStore.register(
        registerData.email,
        registerData.password,
        registerData.username,
        registerData.role
      )
      
      if (result.success) {
        MessagePlugin.success(result.message || '注册成功，请登录')
        
        // 清空注册表单
        Object.assign(registerData, {
          username: '',
          email: '',
          password: '',
          confirmPassword: '',
          role: 'student'
        })
        
        // 切换到登录标签
        activeTab.value = 'login'
      } else {
        MessagePlugin.error(result.message || '注册失败')
      }
    } catch (error) {
      console.error('注册错误:', error)
      MessagePlugin.error(error.message || '注册失败，请稍后再试')
    } finally {
      loading.value = false
    }
  }
}

// 根据角色获取首页路由
const getHomeRouteByRole = (role) => {
  switch (role) {
    case 'student':
      return { name: 'StudentHome' }
    case 'teacher':
      return { name: 'TeacherHome' }
    default:
      return { path: '/' }
  }
}

// 监听Supabase认证状态变化
onMounted(() => {
  // 检查URL中是否有密码重置或邮箱确认的哈希
  const hash = window.location.hash
  
  if (hash && hash.includes('#access_token=')) {
    // 处理密码重置或邮箱确认
    const { data, error } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        // 处理密码重置
        MessagePlugin.info('请输入新密码')
        // 这里可以跳转到密码重置页面或显示密码重置表单
      } else if (event === 'SIGNED_IN') {
        // 用户已登录
        MessagePlugin.success('登录成功')
        router.push(getHomeRouteByRole(userStore.role))
      }
    })
    
    return () => {
      data.subscription.unsubscribe()
    }
  }
})
</script>

<style scoped>
.login-container {
  display: flex;
  min-height: 100vh;
  background-color: var(--background-color);
}

.login-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: var(--spacing-xl);
  max-width: 500px;
  background-color: white;
}

.login-header {
  text-align: center;
  margin-bottom: var(--spacing-xl);
}

.logo {
  width: 80px;
  height: 80px;
  margin-bottom: var(--spacing-md);
}

.title {
  font-size: var(--font-size-xxlarge);
  color: var(--primary-color);
  margin-bottom: var(--spacing-xs);
}

.subtitle {
  color: var(--light-text);
  margin-bottom: var(--spacing-lg);
}

.login-tabs {
  width: 100%;
}

.login-form {
  width: 100%;
  margin-top: var(--spacing-md);
}

.forget-pwd {
  float: right;
}

.login-illustration {
  flex: 1;
  background: linear-gradient(135deg, var(--primary-color), #1a5cbf);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  padding: var(--spacing-xl);
}

.illustration-content {
  max-width: 400px;
}

.illustration-content h2 {
  font-size: var(--font-size-xlarge);
  margin-bottom: var(--spacing-md);
}

/* 响应式调整 */
@media (max-width: 768px) {
  .login-container {
    flex-direction: column;
  }
  
  .login-card {
    max-width: 100%;
    order: 2;
  }
  
  .login-illustration {
    min-height: 200px;
    order: 1;
  }
}
</style>