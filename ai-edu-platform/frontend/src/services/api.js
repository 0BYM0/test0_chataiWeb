import axios from 'axios'
import { API_CONFIG } from '../config'
import { useUserStore } from '../stores/user'
import router from '../router'
import { supabase } from '../supabase' // 导入 Supabase 客户端

// 创建axios实例
const apiClient = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 创建AI服务的axios实例
const aiClient = axios.create({
  baseURL: API_CONFIG.aiServiceURL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 统一的请求拦截器，用于自动附加认证令牌
const authInterceptor = async (config) => {
  // 从 Supabase 获取当前会话
  // 这是获取令牌最可靠的方式，因为它直接来自 Supabase Auth 模块
  const { data: { session } } = await supabase.auth.getSession();

  if (session?.access_token) {
    // 如果会话和访问令牌存在，则将其添加到 Authorization 请求头中
    config.headers['Authorization'] = `Bearer ${session.access_token}`;
  }
  
  return config;
};

// 将拦截器应用到两个 axios 实例上
aiClient.interceptors.request.use(authInterceptor, error => Promise.reject(error));
apiClient.interceptors.request.use(authInterceptor, error => Promise.reject(error));

// 响应拦截器
apiClient.interceptors.response.use(
  response => {
    return response
  },
  error => {
    if (error.response) {
      // 处理401错误
      if (error.response.status === 401) {
        const userStore = useUserStore()
        userStore.logout()
        router.push('/login')
      }
    }
    return Promise.reject(error)
  }
)

// 用户相关API
export const userAPI = {
  // 登录
  login(credentials) {
    return apiClient.post('/api/auth/signin', credentials)
  },
  
  // 注册
  register(userData) {
    return apiClient.post('/api/auth/signup', userData)
  },
  
  // 获取用户信息
  getUserInfo() {
    return apiClient.get('/api/user/info')
  },
  
  // 更新用户信息
  updateUserInfo(userData) {
    return apiClient.put('/api/user/info', userData)
  },
  
  // 更改密码
  changePassword(passwordData) {
    return apiClient.post('/api/user/change-password', passwordData)
  }
}

// 聊天相关API
export const chatAPI = {
  // 获取对话列表
  getConversations() {
    return apiClient.get('/api/chat/conversations')
  },
  
  // 获取对话详情
  getConversation(conversationId) {
    return apiClient.get(`/api/chat/conversations/${conversationId}`)
  },
  
  // 创建新对话
  createConversation(title) {
    return apiClient.post('/api/chat/conversations', { title })
  },
  
  // 发送消息
  sendMessage(conversationId, content) {
    return apiClient.post(`/api/chat/conversations/${conversationId}/messages`, { content })
  },
  
  // 删除对话
  deleteConversation(conversationId) {
    return apiClient.delete(`/api/chat/conversations/${conversationId}`)
  },
  
  // 同步对话
  syncConversations(conversations) {
    return apiClient.post('/api/chat/sync', { conversations })
  }
}

// 教案相关API
export const lessonPlanAPI = {
  // 获取教案列表
  getLessonPlans() {
    return apiClient.get('/api/lesson-plans')
  },
  
  // 获取教案详情
  getLessonPlanById(planId) {
    return apiClient.get(`/api/lesson-plans/${planId}`)
  },
  
  // 保存教案
  saveLessonPlan(plan) {
    return apiClient.post('/api/lesson-plans', plan)
  },
  
  // 更新教案
  updateLessonPlan(plan) {
    return apiClient.put(`/api/lesson-plans/${plan.id}`, plan)
  },
  
  // 删除教案
  deleteLessonPlan(planId) {
    return apiClient.delete(`/api/lesson-plans/${planId}`)
  },
  
  // 导出教案为PDF
  exportToPDF(planId) {
    return apiClient.get(`/api/lesson-plans/${planId}/export/pdf`, {
      responseType: 'blob'
    })
  },
  
  // 导出教案为Word
  exportToWord(planId) {
    return apiClient.get(`/api/lesson-plans/${planId}/export/word`, {
      responseType: 'blob'
    })
  },
  
  // 同步教案
  syncLessonPlans(plans) {
    return apiClient.post('/api/lesson-plans/sync', { plans })
  }
}

// 班级管理相关API
export const classroomAPI = {
  // 获取所有班级
  getClassrooms() {
    return apiClient.get('/api/classrooms')
  },
  // 获取单个班级详情
  getClassroom(id) {
    return apiClient.get(`/api/classrooms/${id}`)
  },
  // 创建新班级
  createClassroom(data) {
    return apiClient.post('/api/classrooms', data)
  },
  // 更新班级信息
  updateClassroom(id, data) {
    return apiClient.put(`/api/classrooms/${id}`, data)
  },
  // 删除班级
  deleteClassroom(id) {
    return apiClient.delete(`/api/classrooms/${id}`)
  },
  // 向班级中添加学生
  addStudentToClassroom(classroomId, studentId) {
    return apiClient.post(`/api/classrooms/${classroomId}/students`, { studentId })
  },
  // 从班级中移除学生
  removeStudentFromClassroom(classroomId, studentId) {
    return apiClient.delete(`/api/classrooms/${classroomId}/students/${studentId}`)
  }
}

// AI服务相关API
export const aiAPI = {
  // 多智能体系统API
  
  // 创建多智能体对话
  createMultiAgentConversation(userId, userRole, initialMessage) {
    return aiClient.post('/multi-agent/conversations', {
      user_id: userId,
      user_role: userRole,
      initial_message: initialMessage
    })
  },
  
  // 获取多智能体对话列表
  getMultiAgentConversations(userId) {
    return aiClient.get(`/multi-agent/conversations?user_id=${userId}`)
  },
  
  // 获取多智能体对话详情
  getMultiAgentConversation(conversationId) {
    return aiClient.get(`/multi-agent/conversations/${conversationId}`)
  },
  
  // 获取多智能体对话消息
  getMultiAgentMessages(conversationId) {
    return aiClient.get(`/multi-agent/conversations/${conversationId}/messages`)
  },
  
  // 发送多智能体消息
  sendMultiAgentMessage(conversationId, content, targetAgentRole = 'expert') {
    return aiClient.post(`/multi-agent/conversations/${conversationId}/messages`, {
      content,
      target_agent_role: targetAgentRole
    })
  },
  
  // 删除多智能体对话
  deleteMultiAgentConversation(conversationId) {
    return aiClient.delete(`/multi-agent/conversations/${conversationId}`)
  },
  
  // 单智能体系统API
  
  // 生成教案
  generateLessonPlan(params) {
    return aiClient.post('/single-agent/generate-lesson-plan', params)
  },
  
  // 提问教学知识
  askTeachingQuestion(params) {
    return aiClient.post('/single-agent/ask-teaching-question', params)
  },
  
  // 获取知识库信息
  getKnowledgeBaseInfo() {
    return aiClient.get('/single-agent/knowledge-base/info')
  },
  
  // 上传文档到知识库
  uploadDocumentToKnowledgeBase(formData) {
    return aiClient.post('/single-agent/knowledge-base/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },
  
  // 从知识库中删除文档
  deleteDocumentFromKnowledgeBase(documentId, indexName = 'default') {
    return aiClient.delete(`/single-agent/knowledge-base/documents/${documentId}?index_name=${indexName}`)
  },
  
  // 搜索知识库
  searchKnowledgeBase(query, indexName = 'default', limit = 5) {
    return aiClient.get(`/single-agent/knowledge-base/search?query=${encodeURIComponent(query)}&index_name=${indexName}&limit=${limit}`)
  }
}