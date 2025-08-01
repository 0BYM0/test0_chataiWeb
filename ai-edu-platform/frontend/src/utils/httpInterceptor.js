/**
 * HTTP请求拦截器
 * 用于处理全局的HTTP请求和响应
 */

import axios from 'axios'
import { MessagePlugin } from 'tdesign-vue-next'
import { STORAGE_KEYS, API_CONFIG } from '../config'
import router from '../router'

// 创建axios实例
const createAxiosInstance = (baseURL, timeout = 30000) => {
  const instance = axios.create({
    baseURL,
    timeout,
    headers: {
      'Content-Type': 'application/json'
    }
  })
  
  // 请求拦截器
  instance.interceptors.request.use(
    config => {
      // 从localStorage获取token
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
      if (token) {
        // 为请求头添加token
        config.headers['Authorization'] = `Bearer ${token}`
      }
      return config
    },
    error => {
      return Promise.reject(error)
    }
  )
  
  // 响应拦截器
  instance.interceptors.response.use(
    response => {
      return response
    },
    error => {
      // 处理错误响应
      handleErrorResponse(error)
      return Promise.reject(error)
    }
  )
  
  return instance
}

/**
 * 处理错误响应
 * @param {Object} error - 错误对象
 */
const handleErrorResponse = (error) => {
  if (!error.response) {
    // 网络错误
    MessagePlugin.error('网络错误，请检查您的网络连接')
    return
  }
  
  const { status, data } = error.response
  
  switch (status) {
    case 400:
      // 请求错误
      MessagePlugin.error(data.message || '请求参数错误')
      break
    case 401:
      // 未授权
      MessagePlugin.error('登录已过期，请重新登录')
      // 清除token
      localStorage.removeItem(STORAGE_KEYS.TOKEN)
      localStorage.removeItem(STORAGE_KEYS.USER_INFO)
      // 重定向到登录页
      router.push('/login')
      break
    case 403:
      // 禁止访问
      MessagePlugin.error('您没有权限访问该资源')
      break
    case 404:
      // 资源不存在
      MessagePlugin.error('请求的资源不存在')
      break
    case 500:
      // 服务器错误
      MessagePlugin.error(data.message || '服务器错误，请稍后再试')
      break
    default:
      // 其他错误
      MessagePlugin.error(data.message || `请求失败(${status})`)
  }
}

/**
 * 配置全局axios默认值
 */
export const setupAxios = () => {
  // 配置全局默认值
  axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest'
  
  // 全局请求拦截器
  axios.interceptors.request.use(
    config => {
      // 从localStorage获取token
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
      if (token) {
        // 为请求头添加token
        config.headers['Authorization'] = `Bearer ${token}`
      }
      return config
    },
    error => {
      return Promise.reject(error)
    }
  )
  
  // 全局响应拦截器
  axios.interceptors.response.use(
    response => {
      return response
    },
    error => {
      // 处理错误响应
      handleErrorResponse(error)
      return Promise.reject(error)
    }
  )
}

// 创建后端API实例
export const apiClient = createAxiosInstance(API_CONFIG.baseURL, API_CONFIG.TIMEOUT)

// 创建AI服务API实例
export const aiClient = createAxiosInstance(API_CONFIG.aiServiceURL, API_CONFIG.TIMEOUT)

// 创建多智能体服务API实例
export const multiAgentClient = createAxiosInstance(API_CONFIG.MULTI_AGENT_URL, API_CONFIG.TIMEOUT)

// 创建单智能体服务API实例
export const singleAgentClient = createAxiosInstance(API_CONFIG.SINGLE_AGENT_URL, API_CONFIG.TIMEOUT)

// 导出创建axios实例的函数
export { createAxiosInstance }

// 导出默认的axios实例
export default apiClient