import { createRouter, createWebHistory } from 'vue-router'

// 路由配置
const routes = [
  {
    path: '/',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/student',
    name: 'StudentLayout',
    component: () => import('../layouts/StudentLayout.vue'),
    meta: { requiresAuth: true, role: 'student' },
    children: [
      {
        path: 'home',
        name: 'StudentHome',
        component: () => import('../views/student/Home.vue')
      },
      {
        path: 'chat',
        name: 'StudentChat',
        component: () => import('../views/student/Chat.vue')
      },
      {
        path: 'profile',
        name: 'StudentProfile',
        component: () => import('../views/student/Profile.vue')
      }
    ]
  },
  {
    path: '/teacher',
    name: 'TeacherLayout',
    component: () => import('../layouts/TeacherLayout.vue'),
    meta: { requiresAuth: true, role: 'teacher' },
    children: [
      {
        path: 'home',
        name: 'TeacherHome',
        component: () => import('../views/teacher/Home.vue')
      },
      {
        path: 'lesson-plan',
        name: 'LessonPlan',
        component: () => import('../views/teacher/LessonPlan.vue')
      },
      {
        path: 'classroom',
        name: 'Classroom',
        component: () => import('../views/teacher/Classroom.vue')
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/NotFound.vue')
  }
]

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
