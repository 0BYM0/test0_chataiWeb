<template>
  <div class="student-layout">
    <!-- 顶部导航栏 -->
    <t-layout>
      <t-header class="header">
        <div class="header-left">
          <!--<img src="../assets/logo.png" alt="智能教育平台" class="logo" />-->
          <h1 class="site-title">智能教育平台</h1>
        </div>
        
        <t-menu mode="horizontal" :value="activeMenu" class="main-menu">
          <t-menu-item value="home" to="/student/home">
            <template #icon><t-icon name="home" /></template>
            学习中心
          </t-menu-item>
          <t-menu-item value="chat" to="/student/chat">
            <template #icon><t-icon name="chat" /></template>
            智能对话
          </t-menu-item>
          <t-menu-item value="profile" to="/student/profile">
            <template #icon><t-icon name="user-circle" /></template>
            个人进度
          </t-menu-item>
        </t-menu>
        
        <div class="header-right">
          <t-badge count="2" dot>
            <t-button variant="text" shape="circle">
              <t-icon name="notification" />
            </t-button>
          </t-badge>
          
          <t-dropdown :options="userMenuOptions" @click="handleUserMenuClick">
            <t-avatar size="small" :image="userAvatar">{{ userInitials }}</t-avatar>
          </t-dropdown>
        </div>
      </t-header>
      
      <t-content class="content">
        <!-- 路由视图 -->
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </t-content>
      
      <t-footer class="footer">
        <p>© {{ currentYear }} 智能教育应用平台 - 广东省义务教育阶段人工智能教育</p>
      </t-footer>
    </t-layout>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// 当前年份
const currentYear = new Date().getFullYear()

// 当前激活的菜单项
const activeMenu = computed(() => {
  const path = route.path
  if (path.includes('/home')) return 'home'
  if (path.includes('/chat')) return 'chat'
  if (path.includes('/profile')) return 'profile'
  return ''
})

// 用户头像
const userAvatar = computed(() => {
  return userStore.getUserInfo?.avatar || ''
})

// 用户名首字母（用于没有头像时显示）
const userInitials = computed(() => {
  const username = userStore.getUserInfo?.username || ''
  return username.substring(0, 1).toUpperCase()
})

// 用户菜单选项
const userMenuOptions = [
  {
    content: '个人信息',
    value: 'profile'
  },
  {
    content: '设置',
    value: 'settings'
  },
  {
    content: '退出登录',
    value: 'logout'
  }
]

// 处理用户菜单点击
const handleUserMenuClick = (data) => {
  const { value } = data
  
  if (value === 'profile') {
    router.push({ name: 'StudentProfile' })
  } else if (value === 'settings') {
    // 打开设置对话框
  } else if (value === 'logout') {
    userStore.logout()
    router.push({ name: 'Login' })
  }
}
</script>

<style scoped>
.student-layout {
  min-height: 100vh;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--spacing-lg);
  background-color: white;
  box-shadow: var(--shadow-sm);
  height: 64px;
}

.header-left {
  display: flex;
  align-items: center;
}

.logo {
  width: 32px;
  height: 32px;
  margin-right: var(--spacing-sm);
}

.site-title {
  font-size: var(--font-size-large);
  color: var(--primary-color);
  margin: 0;
}

.main-menu {
  flex: 1;
  margin: 0 var(--spacing-xl);
}

.header-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.content {
  padding: var(--spacing-lg);
  background-color: var(--background-color);
  min-height: calc(100vh - 64px - 60px); /* 减去头部和底部的高度 */
}

.footer {
  text-align: center;
  padding: var(--spacing-md);
  background-color: white;
  color: var(--light-text);
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .header {
    flex-direction: column;
    height: auto;
    padding: var(--spacing-sm);
  }
  
  .header-left {
    margin-bottom: var(--spacing-sm);
  }
  
  .main-menu {
    margin: var(--spacing-sm) 0;
  }
  
  .content {
    min-height: calc(100vh - 120px - 60px); /* 调整头部高度 */
  }
}
</style>