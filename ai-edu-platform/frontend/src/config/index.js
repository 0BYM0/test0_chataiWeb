/**
 * 全局配置文件
 */

// API基础URL配置
export const API_CONFIG = {
  // 后端API基础URL (如果您的项目有非AI的后端，可以在此配置)
  // VITE_APP_BASE_API_URL 是您需要在Vercel前端项目中设置的环境变量
  BASE_URL: import.meta.env.VITE_APP_BASE_API_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:8080/api'),
  
  // 多智能体服务API基础URL
  // VITE_MULTI_AGENT_API_URL 是您需要在Vercel前端项目中设置的环境变量
  MULTI_AGENT_URL: import.meta.env.VITE_MULTI_AGENT_API_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:8000'),

  // 单智能体服务API基础URL
  // VITE_SINGLE_AGENT_API_URL 是您需要在Vercel前端项目中设置的环境变量
  SINGLE_AGENT_URL: import.meta.env.VITE_SINGLE_AGENT_API_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:8001'),
  
  // 请求超时时间（毫秒）
  TIMEOUT: 30000
}

// 本地存储键名配置
export const STORAGE_KEYS = {
  TOKEN: 'ai_edu_token',
  USER_INFO: 'ai_edu_user_info',
  REMEMBER_ME: 'ai_edu_remember_me'
}

// 路由配置
export const ROUTE_CONFIG = {
  // 默认路由
  DEFAULT_ROUTE: '/',
  
  // 登录页路由
  LOGIN_ROUTE: '/login',
  
  // 根据角色的首页路由
  HOME_ROUTES: {
    student: '/student/home',
    teacher: '/teacher/home'
  }
}

// 系统配置
export const SYSTEM_CONFIG = {
  // 系统名称
  APP_NAME: '智能教育应用平台',
  
  // 系统版本
  APP_VERSION: '1.0.0',
  
  // 系统描述
  APP_DESCRIPTION: '辅助人工智能教学与学习的智能平台',
  
  // 系统作者
  APP_AUTHOR: '智能教育应用开发者',
  
  // 系统主题色
  PRIMARY_COLOR: '#0052d9'
}

// 聊天配置
export const CHAT_CONFIG = {
  // 最大消息长度
  MAX_MESSAGE_LENGTH: 2000,
  
  // 最大历史消息数
  MAX_HISTORY_MESSAGES: 50,
  
  // 智能体角色
  AGENT_ROLES: {
    USER_PROXY: '学习者',
    EXPERT: '专家智能体',
    ASSISTANT: '助教智能体',
    PEER: '同伴智能体',
    MANAGER: '群聊管理器'
  }
}

// 教案配置
export const LESSON_PLAN_CONFIG = {
  // 年级选项
  GRADE_OPTIONS: [
    { value: 'grade1_2', label: '小学1-2年级' },
    { value: 'grade3_4', label: '小学3-4年级' },
    { value: 'grade5_6', label: '小学5-6年级' },
    { value: 'grade7_9', label: '初中7-9年级' }
  ],
  
  // 课程模块选项
  MODULE_OPTIONS: [
    { value: 'ai_life', label: '人工智能与生活' },
    { value: 'ai_tech', label: '人工智能技术' },
    { value: 'ai_ethics', label: '人工智能伦理' },
    { value: 'ai_future', label: '人工智能与未来' }
  ],
  
  // 核心知识点选项
  KNOWLEDGE_POINT_OPTIONS: [
    { value: 'data_coding', label: '数据与编码' },
    { value: 'algorithm', label: '身边的算法' },
    { value: 'machine_learning', label: '机器学习基础' },
    { value: 'neural_network', label: '神经网络入门' },
    { value: 'computer_vision', label: '计算机视觉' },
    { value: 'nlp', label: '自然语言处理' },
    { value: 'ai_ethics', label: '人工智能伦理与责任' },
    { value: 'ai_application', label: '人工智能应用案例' }
  ],
  
  // 教学偏好选项
  PREFERENCE_OPTIONS: [
    { value: 'project', label: '项目式学习' },
    { value: 'inquiry', label: '探究式学习' },
    { value: 'unplugged', label: '不插电活动优先' },
    { value: 'cooperative', label: '合作学习' },
    { value: 'gamification', label: '游戏化教学' }
  ],
  
  // 素养维度选项
  DIMENSION_OPTIONS: [
    { value: 'concept', label: '人智观念' },
    { value: 'tech', label: '技术实现' },
    { value: 'thinking', label: '智能思维' },
    { value: 'ethics', label: '伦理责任' }
  ]
}

export default {
  API_CONFIG,
  STORAGE_KEYS,
  ROUTE_CONFIG,
  SYSTEM_CONFIG,
  CHAT_CONFIG,
  LESSON_PLAN_CONFIG
}