import { defineStore } from 'pinia'
import { chatAPI, aiAPI } from '../services/api'
import { CHAT_CONFIG } from '../config'
import { cacheManager } from '../utils/fileUtils'
import { useUserStore } from './user'
import { v4 as uuidv4 } from 'uuid'

// 聊天状态管理
export const useChatStore = defineStore('chat', {
  state: () => ({
    // 对话列表
    conversations: [],
    // 当前对话
    currentConversation: null,
    // 当前对话的消息列表
    messages: [],
    // 是否正在加载
    isLoading: false,
    // 是否正在发送消息
    isSending: false,
    // 错误信息
    error: null,
    // 是否已从缓存加载
    loadedFromCache: false,
    // 是否已从服务器加载
    loadedFromServer: false
  }),
  
  getters: {
    // 获取对话列表
    getConversations: (state) => state.conversations,
    
    // 获取当前对话
    getCurrentConversation: (state) => state.currentConversation,
    
    // 获取当前对话的消息列表
    getMessages: (state) => state.messages,
    
    // 判断是否正在处理
    isProcessing: (state) => state.isLoading || state.isSending,
    
    // 获取历史对话
    getHistoryConversations: (state) => {
      const userStore = useUserStore()
      const userId = userStore.user?.id
      
      if (!userId) return []
      
      // 从缓存获取历史对话
      return cacheManager.getConversationHistory(userId) || []
    }
  },
  
  actions: {
    // 初始化聊天状态
    async initialize() {
      // 先从缓存加载
      await this.loadFromCache()
      
      // 再从服务器加载
      try {
        await this.fetchConversations()
      } catch (error) {
        console.error('从服务器加载对话失败，将使用缓存数据', error)
      }
    },
    
    // 从缓存加载对话
    async loadFromCache() {
      const userStore = useUserStore()
      const userId = userStore.user?.id
      
      if (!userId) return
      
      try {
        // 从缓存获取对话列表
        const cachedConversations = cacheManager.getConversationHistory(userId) || []
        
        if (cachedConversations.length > 0) {
          this.conversations = cachedConversations
          this.loadedFromCache = true
          
          // 如果有当前对话ID，加载该对话
          const currentConvId = localStorage.getItem(`current_conversation_${userId}`)
          if (currentConvId) {
            const currentConv = cachedConversations.find(c => c.id === currentConvId)
            if (currentConv) {
              this.currentConversation = currentConv
              this.messages = currentConv.messages || []
            }
          }
        }
      } catch (error) {
        console.error('从缓存加载对话失败:', error)
      }
    },
    
    // 保存到缓存
    saveToCache() {
      const userStore = useUserStore()
      const userId = userStore.user?.id
      
      if (!userId) return
      
      try {
        // 保存当前对话列表到缓存
        this.conversations.forEach(conv => {
          // 确保每个对话都有完整的消息
          if (this.currentConversation && conv.id === this.currentConversation.id) {
            conv.messages = [...this.messages]
          }
          
          // 保存到缓存
          cacheManager.saveConversationHistory(userId, conv)
        })
        
        // 保存当前对话ID
        if (this.currentConversation) {
          localStorage.setItem(`current_conversation_${userId}`, this.currentConversation.id)
        }
      } catch (error) {
        console.error('保存对话到缓存失败:', error)
      }
    },
    
    // 获取对话列表
    async fetchConversations() {
      try {
        this.isLoading = true
        
        // 获取用户信息
        const userStore = useUserStore()
        const userId = userStore.user?.id
        
        if (!userId) {
          throw new Error('用户未登录')
        }
        
        // 尝试从多智能体系统获取对话列表
        let aiConversations = []
        try {
          const aiResponse = await aiAPI.getMultiAgentConversations(userId)
          aiConversations = aiResponse.data.map(conv => ({
            id: conv.id,
            title: conv.title || '人工智能对话',
            createdAt: conv.start_time,
            updatedAt: conv.start_time,
            agentRoles: conv.agent_roles_involved,
            conversationType: conv.conversation_type,
            isAIConversation: true
          }))
        } catch (error) {
          console.error('从多智能体系统获取对话列表失败:', error)
        }
        
        // 我们现在只从一个来源（多智能体服务）获取对话，所以直接赋值
        this.conversations = aiConversations
        this.loadedFromServer = true
        
        // 保存到缓存
        this.saveToCache()
        
        return this.conversations
      } catch (error) {
        console.error('获取对话列表失败:', error)
        this.error = error.response?.data?.message || '获取对话列表失败'
        throw error
      } finally {
        this.isLoading = false
      }
    },
    
    // 创建新对话
    async createConversation(title = '新对话') {
      try {
        this.isLoading = true
        
        let newConversation
        
        try {
          // 获取用户信息
          const userStore = useUserStore()
          const userId = userStore.user?.id
          
          if (!userId) {
            throw new Error('用户未登录')
          }
          
          // 调用多智能体API创建新对话
          const response = await aiAPI.createMultiAgentConversation(
            userId,
            userStore.user?.role || 'student',
            null // 初始消息为空
          )
          
          newConversation = {
            id: response.data.id,
            title: title || '新对话',
            createdAt: response.data.start_time,
            updatedAt: response.data.start_time,
            messages: [],
            agentRoles: response.data.agent_roles_involved,
            conversationType: response.data.conversation_type,
            isAIConversation: true // 标记为AI对话
          }
        } catch (error) {
          console.error('创建对话API调用失败，将创建本地对话:', error)
          
          // 创建本地对话
          newConversation = {
            id: uuidv4(),
            title,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            messages: [],
            isLocalOnly: true // 标记为本地对话
          }
        }
        
        // 更新状态
        this.conversations.unshift(newConversation)
        this.currentConversation = newConversation
        this.messages = []
        
        // 保存到缓存
        this.saveToCache()
        
        return newConversation
      } catch (error) {
        console.error('创建对话失败:', error)
        this.error = error.response?.data?.message || '创建对话失败'
        throw error
      } finally {
        this.isLoading = false
      }
    },
    
    // 获取对话详情
    async fetchConversation(conversationId) {
      try {
        this.isLoading = true
        
        // 先检查是否在本地缓存中
        const userStore = useUserStore()
        const userId = userStore.user?.id
        
        if (userId) {
          const cachedConversations = cacheManager.getConversationHistory(userId) || []
          const cachedConv = cachedConversations.find(c => c.id === conversationId)
          
          if (cachedConv && cachedConv.messages && cachedConv.messages.length > 0) {
            // 如果缓存中有完整的对话，直接使用缓存
            this.currentConversation = cachedConv
            this.messages = cachedConv.messages
            this.isLoading = false
            return cachedConv
          }
        }
        
        // 检查是否为本地对话
        const localConv = this.conversations.find(c => c.id === conversationId && c.isLocalOnly)
        if (localConv) {
          this.currentConversation = localConv
          this.messages = localConv.messages || []
          this.isLoading = false
          return localConv
        }
        
        // 检查是否为AI对话
        const aiConv = this.conversations.find(c => c.id === conversationId && c.isAIConversation)
        if (aiConv) {
          try {
            // 获取对话详情
            const convResponse = await aiAPI.getMultiAgentConversation(conversationId)
            
            // 获取对话消息
            const messagesResponse = await aiAPI.getMultiAgentMessages(conversationId)
            
            // 更新对话信息
            const conversation = {
              ...aiConv,
              messages: messagesResponse.data || []
            }
            
            // 更新状态
            this.currentConversation = conversation
            this.messages = conversation.messages
            
            // 保存到缓存
            if (userId) {
              cacheManager.saveConversationHistory(userId, conversation)
              localStorage.setItem(`current_conversation_${userId}`, conversationId)
            }
            
            return conversation
          } catch (error) {
            console.error('获取AI对话详情失败:', error)
            
            // 如果API调用失败，使用本地对话
            this.currentConversation = aiConv
            this.messages = aiConv.messages || []
            return aiConv
          }
        }
        
        // 调用普通API获取对话详情
        const response = await chatAPI.getConversation(conversationId)
        
        const conversation = response.data
        
        // 更新状态
        this.currentConversation = conversation
        this.messages = conversation.messages || []
        
        // 保存到缓存
        if (userId) {
          conversation.messages = this.messages
          cacheManager.saveConversationHistory(userId, conversation)
          localStorage.setItem(`current_conversation_${userId}`, conversationId)
        }
        
        return conversation
      } catch (error) {
        console.error('获取对话详情失败:', error)
        this.error = error.response?.data?.message || '获取对话详情失败'
        throw error
      } finally {
        this.isLoading = false
      }
    },
    
    // 发送消息
    async sendMessage(content, agentRole = 'expert') {
      try {
        this.isSending = true
        
        if (!this.currentConversation) {
          // 如果没有当前对话，创建一个新对话
          await this.createConversation()
        }
        
        const conversationId = this.currentConversation.id
        const isLocalOnly = this.currentConversation.isLocalOnly
        const isAIConversation = this.currentConversation.isAIConversation
        
        // 创建用户消息
        const userMessage = {
          id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          conversationId,
          content,
          sender_type: 'user',
          sender_role: 'student',
          receiver_type: 'agent',
          receiver_role: agentRole,
          timestamp: new Date().toISOString(),
          message_order: this.messages.length + 1
        }
        
        // 添加到消息列表
        this.messages.push(userMessage)
        
        let aiMessage = null
        
        if (isAIConversation && !isLocalOnly) {
          try {
            // 调用多智能体API发送消息
            const response = await aiAPI.sendMultiAgentMessage(conversationId, content, agentRole)
            
            // 处理AI响应
            aiMessage = {
              id: response.data.id,
              conversationId,
              content: response.data.content,
              sender_type: response.data.sender_type,
              sender_role: response.data.sender_role,
              receiver_type: response.data.receiver_type,
              receiver_role: response.data.receiver_role,
              timestamp: response.data.timestamp,
              message_order: response.data.message_order,
              references: response.data.references || []
            }
            
            // 添加到消息列表
            this.messages.push(aiMessage)
          } catch (error) {
            console.error('调用多智能体API发送消息失败:', error)
            
            // 创建一个错误消息
            aiMessage = {
              id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              conversationId,
              content: '抱歉，AI服务暂时不可用，请稍后再试。',
              sender_type: 'system',
              sender_role: 'error',
              receiver_type: 'user',
              receiver_role: 'student',
              timestamp: new Date().toISOString(),
              message_order: this.messages.length + 1
            }
            
            this.messages.push(aiMessage)
          }
        } else {
          // 本地对话或非AI对话，创建一个模拟的AI响应
          aiMessage = {
            id: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            conversationId,
            content: '这是一个本地对话，AI服务未连接。请确保您已连接到AI服务。',
            sender_type: 'agent',
            sender_role: agentRole,
            receiver_type: 'user',
            receiver_role: 'student',
            timestamp: new Date().toISOString(),
            message_order: this.messages.length + 1
          }
          
          this.messages.push(aiMessage)
        }
        
        // 更新当前对话
        if (this.currentConversation) {
          this.currentConversation.updatedAt = new Date().toISOString()
          
          // 如果是第一条消息，更新对话标题
          if (this.messages.length <= 2) {
            // 使用用户消息的前20个字符作为标题
            const newTitle = content.length > 20 ? content.substring(0, 20) + '...' : content
            this.currentConversation.title = newTitle
            
            // 更新对话列表中的标题
            const index = this.conversations.findIndex(c => c.id === conversationId)
            if (index !== -1) {
              this.conversations[index].title = newTitle
            }
          }
          
          // 更新对话的消息
          this.currentConversation.messages = [...this.messages]
        }
        
        // 保存到缓存
        this.saveToCache()
        
        // 如果不是本地对话，调用后端API保存消息
        if (!isLocalOnly && !isAIConversation) {
          try {
            await chatAPI.sendMessage(conversationId, content)
          } catch (error) {
            console.error('保存消息到服务器失败，但已保存到本地缓存:', error)
          }
        }
        
        return aiMessage
      } catch (error) {
        console.error('发送消息失败:', error)
        this.error = error.response?.data?.message || '发送消息失败'
        
        // 添加错误消息
        this.messages.push({
          id: `error-${Date.now()}`,
          conversationId: this.currentConversation?.id,
          content: '消息发送失败，请稍后再试。',
          sender_type: 'system',
          sender_role: 'error',
          receiver_type: 'user',
          receiver_role: 'student',
          timestamp: new Date().toISOString(),
          message_order: this.messages.length + 1
        })
        
        // 即使失败也保存到缓存
        this.saveToCache()
        
        throw error
      } finally {
        this.isSending = false
      }
    },
    
    // 删除对话
    async deleteConversation(conversationId) {
      try {
        this.isLoading = true
        
        const conversation = this.conversations.find(c => c.id === conversationId)
        if (!conversation) {
          throw new Error('对话不存在')
        }
        
        const isLocalOnly = conversation.isLocalOnly
        const isAIConversation = conversation.isAIConversation
        
        // 如果是AI对话，尝试从AI服务删除
        if (isAIConversation && !isLocalOnly) {
          try {
            // 这里应该有删除AI对话的API调用
            // 目前多智能体系统API中没有删除对话的接口，所以只能从本地删除
            console.log('从AI服务删除对话:', conversationId)
          } catch (error) {
            console.error('从AI服务删除对话失败，但将从本地删除:', error)
          }
        }
        
        // 如果是普通对话且不是本地对话，调用API删除对话
        if (!isAIConversation && !isLocalOnly) {
          try {
            await chatAPI.deleteConversation(conversationId)
          } catch (error) {
            console.error('从服务器删除对话失败，但将从本地删除:', error)
          }
        }
        
        // 更新状态
        this.conversations = this.conversations.filter(c => c.id !== conversationId)
        
        if (this.currentConversation && this.currentConversation.id === conversationId) {
          this.currentConversation = null
          this.messages = []
        }
        
        // 从缓存中删除
        const userStore = useUserStore()
        const userId = userStore.user?.id
        
        if (userId) {
          cacheManager.removeConversationHistory(userId, conversationId)
          
          // 如果删除的是当前对话，清除当前对话ID
          if (localStorage.getItem(`current_conversation_${userId}`) === conversationId) {
            localStorage.removeItem(`current_conversation_${userId}`)
          }
        }
        
        return { success: true }
      } catch (error) {
        console.error('删除对话失败:', error)
        this.error = error.response?.data?.message || '删除对话失败'
        throw error
      } finally {
        this.isLoading = false
      }
    },
    
    // 清空当前对话
    clearCurrentConversation() {
      this.currentConversation = null
      this.messages = []
      
      // 清除当前对话ID
      const userStore = useUserStore()
      const userId = userStore.user?.id
      
      if (userId) {
        localStorage.removeItem(`current_conversation_${userId}`)
      }
    },
    
    // 导出对话历史
    exportConversationHistory() {
      const userStore = useUserStore()
      const userId = userStore.user?.id
      
      if (!userId) return false
      
      try {
        return cacheManager.exportAllHistory(userId, `ai_edu_conversations_${new Date().toISOString().split('T')[0]}.json`)
      } catch (error) {
        console.error('导出对话历史失败:', error)
        this.error = '导出对话历史失败'
        return false
      }
    },
    
    // 导入对话历史
    async importConversationHistory(file) {
      const userStore = useUserStore()
      const userId = userStore.user?.id
      
      if (!userId) return false
      
      try {
        const result = await cacheManager.importHistory(file, userId)
        
        if (result) {
          // 重新加载对话列表
          await this.loadFromCache()
          return true
        }
        
        return false
      } catch (error) {
        console.error('导入对话历史失败:', error)
        this.error = '导入对话历史失败'
        return false
      }
    },
    
    // 同步对话历史到服务器
    async syncHistoryToServer() {
      const userStore = useUserStore()
      const userId = userStore.user?.id
      
      if (!userId) return false
      
      try {
        // 获取所有本地对话
        const localConversations = cacheManager.getConversationHistory(userId) || []
        
        // 过滤出需要同步的对话（本地对话或有更新的对话）
        const conversationsToSync = localConversations.filter(conv => 
          conv.isLocalOnly || !conv.syncedAt || new Date(conv.updatedAt) > new Date(conv.syncedAt)
        )
        
        if (conversationsToSync.length === 0) {
          return { success: true, message: '没有需要同步的对话' }
        }
        
        // 调用API同步对话
        const response = await chatAPI.syncConversations(conversationsToSync)
        
        // 更新同步状态
        if (response.data.success) {
          const syncedIds = response.data.syncedIds || []
          
          // 更新本地对话的同步状态
          const updatedConversations = localConversations.map(conv => {
            if (syncedIds.includes(conv.id)) {
              return {
                ...conv,
                isLocalOnly: false,
                syncedAt: new Date().toISOString()
              }
            }
            return conv
          })
          
          // 更新缓存
          updatedConversations.forEach(conv => {
            cacheManager.saveConversationHistory(userId, conv)
          })
          
          // 更新状态
          this.conversations = updatedConversations
          
          // 如果当前对话在同步列表中，更新当前对话
          if (this.currentConversation && syncedIds.includes(this.currentConversation.id)) {
            const updatedCurrentConv = updatedConversations.find(c => c.id === this.currentConversation.id)
            if (updatedCurrentConv) {
              this.currentConversation = updatedCurrentConv
            }
          }
        }
        
        return response.data
      } catch (error) {
        console.error('同步对话历史到服务器失败:', error)
        this.error = error.response?.data?.message || '同步对话历史到服务器失败'
        throw error
      }
    },
    
    // 从服务器同步对话历史
    async syncHistoryFromServer() {
      const userStore = useUserStore()
      const userId = userStore.user?.id
      
      if (!userId) return false
      
      try {
        // 调用API获取服务器上的对话
        const response = await chatAPI.getConversations()
        
        const serverConversations = response.data || []
        
        // 获取本地对话
        const localConversations = cacheManager.getConversationHistory(userId) || []
        
        // 合并对话，保留本地更新的内容
        const mergedConversations = []
        
        // 处理服务器上的对话
        serverConversations.forEach(serverConv => {
          const localConv = localConversations.find(c => c.id === serverConv.id)
          
          if (localConv) {
            // 如果本地和服务器都有，比较更新时间
            const serverUpdatedAt = new Date(serverConv.updatedAt)
            const localUpdatedAt = new Date(localConv.updatedAt)
            
            if (localUpdatedAt > serverUpdatedAt) {
              // 本地更新，保留本地版本
              mergedConversations.push({
                ...localConv,
                syncedAt: new Date().toISOString()
              })
            } else {
              // 服务器更新，使用服务器版本
              mergedConversations.push({
                ...serverConv,
                messages: serverConv.messages || localConv.messages || [],
                syncedAt: new Date().toISOString()
              })
            }
          } else {
            // 只有服务器有，添加到合并列表
            mergedConversations.push({
              ...serverConv,
              messages: serverConv.messages || [],
              syncedAt: new Date().toISOString()
            })
          }
        })
        
        // 处理只在本地的对话
        localConversations.forEach(localConv => {
          if (!serverConversations.some(c => c.id === localConv.id)) {
            mergedConversations.push(localConv)
          }
        })
        
        // 按更新时间排序
        mergedConversations.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        
        // 更新缓存
        mergedConversations.forEach(conv => {
          cacheManager.saveConversationHistory(userId, conv)
        })
        
        // 更新状态
        this.conversations = mergedConversations
        
        // 如果当前对话在列表中，更新当前对话
        if (this.currentConversation) {
          const updatedCurrentConv = mergedConversations.find(c => c.id === this.currentConversation.id)
          if (updatedCurrentConv) {
            this.currentConversation = updatedCurrentConv
            this.messages = updatedCurrentConv.messages || []
          }
        }
        
        return { success: true, count: mergedConversations.length }
      } catch (error) {
        console.error('从服务器同步对话历史失败:', error)
        this.error = error.response?.data?.message || '从服务器同步对话历史失败'
        throw error
      }
    },
    
    // 清空错误信息
    clearError() {
      this.error = null
    }
  }
})