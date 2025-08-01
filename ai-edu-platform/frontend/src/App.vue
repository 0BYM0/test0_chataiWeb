<template>
  <div class="app-container">
    <!-- 路由视图 -->
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from './stores/user'

const router = useRouter()
const userStore = useUserStore()

onMounted(() => {
  // 检查用户认证状态
  if (userStore.isLoggedIn) {
    console.log('用户已登录，角色:', userStore.getUserRole)
  } else {
    console.log('用户未登录')
    // 如果不在登录页，重定向到登录页
    if (router.currentRoute.value.name !== 'Login') {
      router.push({ name: 'Login' })
    }
  }
})
</script>

<style>
/* 全局样式 */
.app-container {
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* 页面过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>