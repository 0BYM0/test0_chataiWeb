/**
 * AI服务工具类
 * 用于处理与AI服务的交互
 */

import { aiAPI } from '../services/api'
import { CHAT_CONFIG } from '../config'

/**
 * 格式化聊天历史记录
 * @param {Array} messages - 消息列表
 * @returns {Array} - 格式化后的历史记录
 */
export const formatChatHistory = (messages) => {
  if (!messages || !Array.isArray(messages)) return []
  
  return messages.map(msg => ({
    role: msg.sender_role || msg.role || 'user',
    content: msg.content,
    sender_type: msg.sender_type || (msg.role === 'user' ? 'user' : 'agent'),
    receiver_type: msg.receiver_type || (msg.role === 'user' ? 'agent' : 'user'),
    receiver_role: msg.receiver_role || (msg.role === 'user' ? 'expert' : 'student')
  }))
}

/**
 * 处理多智能体响应
 * @param {Object} response - AI响应对象
 * @returns {Object} - 处理后的响应消息
 */
export const processMultiAgentResponse = (response) => {
  if (!response || !response.data) return null
  
  const data = response.data
  
  return {
    id: data.id || `ai-${Date.now()}`,
    content: data.content || '无响应内容',
    sender_type: data.sender_type || 'agent',
    sender_role: data.sender_role || 'expert',
    receiver_type: data.receiver_type || 'user',
    receiver_role: data.receiver_role || 'student',
    timestamp: data.timestamp || new Date().toISOString(),
    message_order: data.message_order || 0,
    references: data.references || []
  }
}

/**
 * 根据角色获取智能体名称
 * @param {string} role - 角色
 * @returns {string} - 智能体名称
 */
export const getAgentNameByRole = (role) => {
  return CHAT_CONFIG.AGENT_ROLES[role.toUpperCase()] || '智能体'
}

/**
 * 发送消息到多智能体系统
 * @param {string} conversationId - 对话ID
 * @param {string} message - 消息内容
 * @param {string} targetAgentRole - 目标智能体角色
 * @returns {Promise} - 响应Promise
 */
export const sendMessageToMultiAgent = async (conversationId, message, targetAgentRole = 'expert') => {
  try {
    // 调用AI服务API
    const response = await aiAPI.sendMultiAgentMessage(conversationId, message, targetAgentRole)
    
    // 处理响应
    return processMultiAgentResponse(response)
  } catch (error) {
    console.error('发送消息到多智能体系统失败:', error)
    throw error
  }
}

/**
 * 创建多智能体对话
 * @param {string} userId - 用户ID
 * @param {string} userRole - 用户角色
 * @param {string} initialMessage - 初始消息
 * @returns {Promise} - 响应Promise
 */
export const createMultiAgentConversation = async (userId, userRole, initialMessage = null) => {
  try {
    // 调用AI服务API
    const response = await aiAPI.createMultiAgentConversation(userId, userRole, initialMessage)
    
    return response.data
  } catch (error) {
    console.error('创建多智能体对话失败:', error)
    throw error
  }
}

/**
 * 处理单智能体教案生成响应
 * @param {Object} response - AI响应对象
 * @returns {Object} - 处理后的教案对象
 */
export const processSingleAgentLessonPlanResponse = (response) => {
  if (!response || !response.data) return null
  
  const data = response.data
  
  return {
    id: data.id || `lesson-${Date.now()}`,
    title: data.title || '未命名教案',
    grade: data.grade || '',
    module: data.module || '',
    knowledgePoint: data.knowledge_point || '',
    duration: data.duration || 1,
    preferences: data.preferences || [],
    customRequirements: data.custom_requirements || '',
    content: data.content || '',
    objectives: data.objectives || [],
    keyPoints: data.key_points || [],
    resources: data.resources || [],
    teachingProcess: data.teaching_process || {},
    evaluation: data.evaluation || '',
    extension: data.extension || '',
    references: data.references || [],
    createdAt: data.created_at || new Date().toISOString(),
    updatedAt: data.updated_at || new Date().toISOString(),
    isAIGenerated: true
  }
}

/**
 * 生成教案
 * @param {Object} params - 教案生成参数
 * @returns {Promise} - 响应Promise
 */
export const generateLessonPlan = async (params) => {
  try {
    // 调用AI服务API
    const response = await aiAPI.generateLessonPlan({
      grade: params.grade,
      module: params.module,
      knowledge_point: params.knowledgePoint,
      duration: params.duration,
      preferences: params.preferences,
      custom_requirements: params.customRequirements,
      use_rag: params.useRAG !== false
    })
    
    // 处理响应
    return processSingleAgentLessonPlanResponse(response)
  } catch (error) {
    console.error('生成教案失败:', error)
    throw error
  }
}

/**
 * 处理教学知识问答响应
 * @param {Object} response - AI响应对象
 * @returns {Object} - 处理后的问答对象
 */
export const processTeachingQuestionResponse = (response) => {
  if (!response || !response.data) return null
  
  const data = response.data
  
  return {
    answer: data.answer || '无法回答该问题',
    references: data.references || [],
    conversationId: data.conversation_id || null
  }
}

/**
 * 提问教学知识
 * @param {string} question - 问题内容
 * @param {string} conversationId - 对话ID
 * @returns {Promise} - 响应Promise
 */
export const askTeachingQuestion = async (question, conversationId = null) => {
  try {
    // 调用AI服务API
    const response = await aiAPI.askTeachingQuestion({
      question,
      conversation_id: conversationId,
      use_rag: true
    })
    
    // 处理响应
    return processTeachingQuestionResponse(response)
  } catch (error) {
    console.error('提问教学知识失败:', error)
    throw error
  }
}

/**
 * 上传文档到知识库
 * @param {File} file - 文件对象
 * @param {string} indexName - 索引名称
 * @returns {Promise} - 响应Promise
 */
export const uploadDocumentToKnowledgeBase = async (file, indexName = 'default') => {
  try {
    // 创建FormData对象
    const formData = new FormData()
    formData.append('file', file)
    formData.append('index_name', indexName)
    
    // 调用AI服务API
    const response = await aiAPI.uploadDocumentToKnowledgeBase(formData)
    
    return response.data
  } catch (error) {
    console.error('上传文档到知识库失败:', error)
    throw error
  }
}

/**
 * 获取知识库信息
 * @returns {Promise} - 响应Promise
 */
export const getKnowledgeBaseInfo = async () => {
  try {
    // 调用AI服务API
    const response = await aiAPI.getKnowledgeBaseInfo()
    
    return {
      isLoaded: response.data.is_loaded || false,
      documents: response.data.documents || [],
      lastUpdated: response.data.last_updated || null
    }
  } catch (error) {
    console.error('获取知识库信息失败:', error)
    throw error
  }
}

export default {
  formatChatHistory,
  processMultiAgentResponse,
  getAgentNameByRole,
  sendMessageToMultiAgent,
  createMultiAgentConversation,
  processSingleAgentLessonPlanResponse,
  generateLessonPlan,
  processTeachingQuestionResponse,
  askTeachingQuestion,
  uploadDocumentToKnowledgeBase,
  getKnowledgeBaseInfo
}