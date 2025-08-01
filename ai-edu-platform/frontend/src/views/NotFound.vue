<template>
  <div class="not-found-container">
    <div class="not-found-content">
      <t-icon name="error-circle" class="error-icon" />
      <h1>404</h1>
      <h2>页面未找到</h2>
      <p>抱歉，您访问的页面不存在或已被移除</p>
      <t-button theme="primary" @click="goHome">返回首页</t-button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'

const router = useRouter()
const userStore = useUserStore()

// 返回首页
const goHome = () => {
  const userRole = userStore.getUserRole
  
  if (userRole === 'student') {
    router.push({ name: 'StudentHome' })
  } else if (userRole === 'teacher') {
    router.push({ name: 'TeacherHome' })
  } else {
    router.push({ name: 'Login' })
  }
}
</script>

<style scoped>
.not-found-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: var(--background-color);
}

.not-found-content {
  text-align: center;
  padding: var(--spacing-xl);
  max-width: 500px;
}

.error-icon {
  font-size: 80px;
  color: var(--error-color);
  margin-bottom: var(--spacing-md);
}

h1 {
  font-size: 72px;
  color: var(--primary-color);
  margin: 0;
  line-height: 1;
}

h2 {
  font-size: var(--font-size-xlarge);
  margin-bottom: var(--spacing-md);
}

p {
  color: var(--light-text);
  margin-bottom: var(--spacing-lg);
}
</style>