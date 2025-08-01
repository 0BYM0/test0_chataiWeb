import { defineStore } from 'pinia'
import { lessonPlanAPI, aiAPI } from '../services/api'
import { cacheManager } from '../utils/fileUtils'
import { useUserStore } from './user'
import { v4 as uuidv4 } from 'uuid'

// 教学设计状态管理
export const useLessonPlanStore = defineStore('lessonPlan', {
  state: () => ({
    lessonPlans: [], // 所有教案列表
    currentPlan: null, // 当前教案
    isLoading: false, // 加载状态
    isGenerating: false, // 生成教案状态
    error: null, // 错误信息
    // 教案生成参数
    planParams: {
      grade: '', // 年级
      module: '', // 课程模块
      knowledgePoint: '', // 核心知识点
      duration: 1, // 课时
      preferences: [], // 教学偏好
      customRequirements: '', // 自定义要求
      useRAG: true // 是否使用知识库增强
    },
    // 是否已从缓存加载
    loadedFromCache: false,
    // 是否已从服务器加载
    loadedFromServer: false,
    // 知识库状态
    knowledgeBase: {
      isLoaded: false,
      documents: [],
      lastUpdated: null
    }
  }),
  
  getters: {
    // 获取当前教案
    getCurrentPlan: (state) => state.currentPlan,
    
    // 获取所有教案
    getLessonPlans: (state) => state.lessonPlans,
    
    // 获取教案生成参数
    getPlanParams: (state) => state.planParams,
    
    // 判断是否正在处理
    isProcessing: (state) => state.isLoading || state.isGenerating,
    
    // 获取历史教案
    getHistoryLessonPlans: (state) => {
      const userStore = useUserStore()
      const userId = userStore.user?.id
      
      if (!userId) return []
      
      // 从缓存获取历史教案
      return cacheManager.getLessonPlanHistory(userId) || []
    },
    
    // 获取知识库状态
    getKnowledgeBaseStatus: (state) => state.knowledgeBase
  },
  
  actions: {
    // 初始化教案状态
    async initialize() {
      // 先从缓存加载
      await this.loadFromCache()
      
      // 再从服务器加载
      try {
        await this.getHistoryPlans()
      } catch (error) {
        console.error('从服务器加载教案失败，将使用缓存数据', error)
      }
      
      // 获取知识库状态
      try {
        await this.getKnowledgeBaseInfo()
      } catch (error) {
        console.error('获取知识库状态失败:', error)
      }
    },
    
    // 从缓存加载教案
    async loadFromCache() {
      const userStore = useUserStore()
      const userId = userStore.user?.id
      
      if (!userId) return
      
      try {
        // 从缓存获取教案列表
        const cachedLessonPlans = cacheManager.getLessonPlanHistory(userId) || []
        
        if (cachedLessonPlans.length > 0) {
          this.lessonPlans = cachedLessonPlans
          this.loadedFromCache = true
          
          // 如果有当前教案ID，加载该教案
          const currentPlanId = localStorage.getItem(`current_lesson_plan_${userId}`)
          if (currentPlanId) {
            const currentPlan = cachedLessonPlans.find(p => p.id === currentPlanId)
            if (currentPlan) {
              this.currentPlan = currentPlan
            }
          }
        }
      } catch (error) {
        console.error('从缓存加载教案失败:', error)
      }
    },
    
    // 保存到缓存
    saveToCache() {
      const userStore = useUserStore()
      const userId = userStore.user?.id
      
      if (!userId) return
      
      try {
        // 保存当前教案列表到缓存
        this.lessonPlans.forEach(plan => {
          cacheManager.saveLessonPlanHistory(userId, plan)
        })
        
        // 保存当前教案ID
        if (this.currentPlan) {
          localStorage.setItem(`current_lesson_plan_${userId}`, this.currentPlan.id)
        }
      } catch (error) {
        console.error('保存教案到缓存失败:', error)
      }
    },
    
    // 获取知识库信息
    async getKnowledgeBaseInfo() {
      try {
        this.isLoading = true
        
        // 调用单智能体API获取知识库信息
        const response = await aiAPI.getKnowledgeBaseInfo()
        
        // 更新知识库状态
        this.knowledgeBase = {
          isLoaded: response.data.is_loaded || false,
          documents: response.data.documents || [],
          lastUpdated: response.data.last_updated || null
        }
        
        return this.knowledgeBase
      } catch (error) {
        console.error('获取知识库信息失败:', error)
        this.error = error.response?.data?.message || '获取知识库信息失败'
        throw error
      } finally {
        this.isLoading = false
      }
    },
    
    // 上传文档到知识库
    async uploadDocumentToKnowledgeBase(file, indexName = 'default') {
      try {
        this.isLoading = true
        
        // 创建FormData对象
        const formData = new FormData()
        formData.append('file', file)
        formData.append('index_name', indexName)
        
        // 调用单智能体API上传文档
        const response = await aiAPI.uploadDocumentToKnowledgeBase(formData)
        
        // 更新知识库状态
        await this.getKnowledgeBaseInfo()
        
        return response.data
      } catch (error) {
        console.error('上传文档到知识库失败:', error)
        this.error = error.response?.data?.message || '上传文档到知识库失败'
        throw error
      } finally {
        this.isLoading = false
      }
    },
    
    // 生成教案
    async generateLessonPlan(params) {
      try {
        this.isGenerating = true
        
        // 更新参数
        this.planParams = { ...this.planParams, ...params }
        
        let generatedPlan
        
        try {
          // 调用单智能体API生成教案
          const response = await aiAPI.generateLessonPlan({
            grade: this.planParams.grade,
            module: this.planParams.module,
            knowledge_point: this.planParams.knowledgePoint,
            duration: this.planParams.duration,
            preferences: this.planParams.preferences,
            custom_requirements: this.planParams.customRequirements,
            use_rag: this.planParams.useRAG
          })
          
          // 处理API响应
          generatedPlan = {
            id: response.data.id || uuidv4(),
            title: response.data.title || `${this.planParams.grade} ${this.planParams.knowledgePoint} 教学设计`,
            grade: this.planParams.grade,
            module: this.planParams.module,
            knowledgePoint: this.planParams.knowledgePoint,
            duration: this.planParams.duration,
            preferences: [...this.planParams.preferences],
            customRequirements: this.planParams.customRequirements,
            content: response.data.content,
            objectives: response.data.objectives || [],
            keyPoints: response.data.key_points || [],
            resources: response.data.resources || [],
            teachingProcess: response.data.teaching_process || {},
            references: response.data.references || [],
            createdAt: response.data.created_at || new Date().toISOString(),
            updatedAt: response.data.updated_at || new Date().toISOString(),
            isAIGenerated: true
          }
        } catch (error) {
          console.error('调用AI服务生成教案失败，将创建本地教案:', error)
          
          // 创建本地教案
          generatedPlan = {
            id: uuidv4(),
            title: `${this.planParams.grade} ${this.planParams.knowledgePoint} 教学设计`,
            grade: this.planParams.grade,
            module: this.planParams.module,
            knowledgePoint: this.planParams.knowledgePoint,
            duration: this.planParams.duration,
            preferences: [...this.planParams.preferences],
            customRequirements: this.planParams.customRequirements,
            content: '生成教案失败，请稍后重试。',
            objectives: [],
            keyPoints: [],
            resources: [],
            teachingProcess: {},
            references: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isLocalOnly: true, // 标记为本地教案
            isAIGenerated: true
          }
        }
        
        // 更新当前教案
        this.currentPlan = generatedPlan
        
        // 添加到教案列表
        this.lessonPlans.unshift(generatedPlan)
        
        // 保存到缓存
        this.saveToCache()
        
        return generatedPlan
      } catch (error) {
        console.error('生成教案失败:', error)
        this.error = error.response?.data?.message || '生成教案失败'
        throw error
      } finally {
        this.isGenerating = false
      }
    },
    
    // 提问教学知识
    async askTeachingQuestion(question, conversationId = null) {
      try {
        this.isLoading = true
        
        // 调用单智能体API提问教学知识
        const response = await aiAPI.askTeachingQuestion({
          question,
          conversation_id: conversationId,
          use_rag: true
        })
        
        return {
          answer: response.data.answer,
          references: response.data.references || [],
          conversationId: response.data.conversation_id
        }
      } catch (error) {
        console.error('提问教学知识失败:', error)
        this.error = error.response?.data?.message || '提问教学知识失败'
        throw error
      } finally {
        this.isLoading = false
      }
    },
    
    // 保存教案
    async saveLessonPlan(plan) {
      try {
        this.isLoading = true
        
        const isLocalOnly = plan.isLocalOnly
        let savedPlan
        
        try {
          // 调用后端API保存教案
          const response = await lessonPlanAPI.saveLessonPlan(plan)
          savedPlan = response.data
          
          // 更新本地教案，移除本地标记
          savedPlan = {
            ...savedPlan,
            isLocalOnly: false
          }
        } catch (error) {
          console.error('保存教案到服务器失败，将保存到本地:', error)
          
          // 保存到本地
          savedPlan = {
            ...plan,
            updatedAt: new Date().toISOString(),
            isLocalOnly: true
          }
          
          // 如果没有ID，生成一个
          if (!savedPlan.id) {
            savedPlan.id = uuidv4()
            savedPlan.createdAt = new Date().toISOString()
          }
        }
        
        // 更新状态
        const index = this.lessonPlans.findIndex(p => p.id === savedPlan.id)
        if (index !== -1) {
          this.lessonPlans[index] = savedPlan
        } else {
          this.lessonPlans.unshift(savedPlan)
        }
        
        this.currentPlan = savedPlan
        
        // 保存到缓存
        this.saveToCache()
        
        return savedPlan
      } catch (error) {
        console.error('保存教案失败:', error)
        this.error = error.response?.data?.message || '保存教案失败'
        throw error
      } finally {
        this.isLoading = false
      }
    },
    
    // 获取历史教案列表
    async getHistoryPlans() {
      try {
        this.isLoading = true
        
        // 先检查缓存
        if (!this.loadedFromCache) {
          await this.loadFromCache()
        }
        
        try {
          // 调用后端API获取教案列表
          const response = await lessonPlanAPI.getLessonPlans()
          
          const serverPlans = response.data
          
          // 合并本地和服务器教案
          this.mergeLessonPlans(serverPlans)
          
          this.loadedFromServer = true
        } catch (error) {
          console.error('从服务器获取教案列表失败，将使用缓存数据:', error)
          // 如果服务器请求失败，继续使用缓存数据
        }
        
        return this.lessonPlans
      } catch (error) {
        console.error('获取历史教案失败:', error)
        this.error = error.response?.data?.message || '获取历史教案失败'
        throw error
      } finally {
        this.isLoading = false
      }
    },
    
    // 合并本地和服务器教案
    mergeLessonPlans(serverPlans) {
      const userStore = useUserStore()
      const userId = userStore.user?.id
      
      if (!userId) return
      
      // 获取本地教案
      const localPlans = cacheManager.getLessonPlanHistory(userId) || []
      
      // 合并教案，保留本地更新的内容
      const mergedPlans = []
      
      // 处理服务器上的教案
      serverPlans.forEach(serverPlan => {
        const localPlan = localPlans.find(p => p.id === serverPlan.id)
        
        if (localPlan) {
          // 如果本地和服务器都有，比较更新时间
          const serverUpdatedAt = new Date(serverPlan.updatedAt)
          const localUpdatedAt = new Date(localPlan.updatedAt)
          
          if (localUpdatedAt > serverUpdatedAt) {
            // 本地更新，保留本地版本
            mergedPlans.push({
              ...localPlan,
              syncedAt: new Date().toISOString(),
              isLocalOnly: false
            })
          } else {
            // 服务器更新，使用服务器版本
            mergedPlans.push({
              ...serverPlan,
              syncedAt: new Date().toISOString(),
              isLocalOnly: false
            })
          }
        } else {
          // 只有服务器有，添加到合并列表
          mergedPlans.push({
            ...serverPlan,
            syncedAt: new Date().toISOString(),
            isLocalOnly: false
          })
        }
      })
      
      // 处理只在本地的教案
      localPlans.forEach(localPlan => {
        if (!serverPlans.some(p => p.id === localPlan.id)) {
          mergedPlans.push(localPlan)
        }
      })
      
      // 按更新时间排序
      mergedPlans.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      
      // 更新状态
      this.lessonPlans = mergedPlans
      
      // 保存到缓存
      this.saveToCache()
    },
    
    // 根据ID获取教案
    async getLessonPlanById(planId) {
      try {
        this.isLoading = true
        
        // 先检查是否在本地缓存中
        const userStore = useUserStore()
        const userId = userStore.user?.id
        
        if (userId) {
          const cachedPlans = cacheManager.getLessonPlanHistory(userId) || []
          const cachedPlan = cachedPlans.find(p => p.id === planId)
          
          if (cachedPlan) {
            // 如果缓存中有，直接使用缓存
            this.currentPlan = cachedPlan
            this.isLoading = false
            
            // 保存当前教案ID
            localStorage.setItem(`current_lesson_plan_${userId}`, planId)
            
            return cachedPlan
          }
        }
        
        // 检查是否为本地教案
        const localPlan = this.lessonPlans.find(p => p.id === planId && p.isLocalOnly)
        if (localPlan) {
          this.currentPlan = localPlan
          this.isLoading = false
          
          // 保存当前教案ID
          if (userId) {
            localStorage.setItem(`current_lesson_plan_${userId}`, planId)
          }
          
          return localPlan
        }
        
        // 调用后端API获取教案
        const response = await lessonPlanAPI.getLessonPlanById(planId)
        
        const plan = response.data
        
        // 更新状态
        this.currentPlan = plan
        
        // 保存到缓存
        if (userId) {
          cacheManager.saveLessonPlanHistory(userId, plan)
          localStorage.setItem(`current_lesson_plan_${userId}`, planId)
        }
        
        return plan
      } catch (error) {
        console.error('获取教案详情失败:', error)
        this.error = error.response?.data?.message || '获取教案详情失败'
        throw error
      } finally {
        this.isLoading = false
      }
    },
    
    // 更新教案
    async updateLessonPlan(plan) {
      try {
        this.isLoading = true
        
        const isLocalOnly = plan.isLocalOnly
        let updatedPlan
        
        try {
          // 调用后端API更新教案
          const response = await lessonPlanAPI.updateLessonPlan(plan)
          updatedPlan = response.data
          
          // 更新本地教案，移除本地标记
          updatedPlan = {
            ...updatedPlan,
            isLocalOnly: false
          }
        } catch (error) {
          console.error('更新教案到服务器失败，将更新到本地:', error)
          
          // 更新到本地
          updatedPlan = {
            ...plan,
            updatedAt: new Date().toISOString(),
            isLocalOnly: true
          }
        }
        
        // 更新状态
        if (this.currentPlan && this.currentPlan.id === plan.id) {
          this.currentPlan = updatedPlan
        }
        
        // 更新列表中的教案
        const index = this.lessonPlans.findIndex(p => p.id === plan.id)
        if (index !== -1) {
          this.lessonPlans[index] = updatedPlan
        }
        
        // 保存到缓存
        this.saveToCache()
        
        return updatedPlan
      } catch (error) {
        console.error('更新教案失败:', error)
        this.error = error.response?.data?.message || '更新教案失败'
        throw error
      } finally {
        this.isLoading = false
      }
    },
    
    // 删除教案
    async deleteLessonPlan(planId) {
      try {
        this.isLoading = true
        
        const isLocalOnly = this.lessonPlans.find(p => p.id === planId)?.isLocalOnly
        
        // 如果不是本地教案，调用API删除教案
        if (!isLocalOnly) {
          try {
            await lessonPlanAPI.deleteLessonPlan(planId)
          } catch (error) {
            console.error('从服务器删除教案失败，但将从本地删除:', error)
          }
        }
        
        // 更新状态
        if (this.currentPlan && this.currentPlan.id === planId) {
          this.currentPlan = null
        }
        
        // 从列表中移除
        this.lessonPlans = this.lessonPlans.filter(p => p.id !== planId)
        
        // 从缓存中删除
        const userStore = useUserStore()
        const userId = userStore.user?.id
        
        if (userId) {
          cacheManager.removeLessonPlanHistory(userId, planId)
          
          // 如果删除的是当前教案，清除当前教案ID
          if (localStorage.getItem(`current_lesson_plan_${userId}`) === planId) {
            localStorage.removeItem(`current_lesson_plan_${userId}`)
          }
        }
        
        return { success: true }
      } catch (error) {
        console.error('删除教案失败:', error)
        this.error = error.response?.data?.message || '删除教案失败'
        throw error
      } finally {
        this.isLoading = false
      }
    },
    
    // 导出教案为PDF
    async exportToPDF(planId) {
      try {
        this.isLoading = true
        
        // 获取要导出的教案
        let plan = this.lessonPlans.find(p => p.id === planId)
        
        if (!plan) {
          // 如果在当前列表中没有找到，尝试从缓存中获取
          const userStore = useUserStore()
          const userId = userStore.user?.id
          
          if (userId) {
            const cachedPlans = cacheManager.getLessonPlanHistory(userId) || []
            plan = cachedPlans.find(p => p.id === planId)
          }
          
          if (!plan) {
            throw new Error('找不到要导出的教案')
          }
        }
        
        // 如果是本地教案，使用前端导出
        if (plan.isLocalOnly) {
          // 使用 html2pdf 或其他前端库导出
          // 这里需要引入相关库，例如 html2pdf.js
          
          // 创建一个临时的HTML元素来渲染教案内容
          const container = document.createElement('div')
          container.innerHTML = `
            <h1>${plan.title || '教学设计'}</h1>
            <h2>基本信息</h2>
            <p>年级：${plan.grade || '未指定'}</p>
            <p>课程模块：${plan.module || '未指定'}</p>
            <p>核心知识点：${plan.knowledgePoint || '未指定'}</p>
            <p>课时：${plan.duration || 1}课时</p>
            <p>教学偏好：${(plan.preferences || []).join('、')}</p>
            ${plan.customRequirements ? `<p>自定义要求：${plan.customRequirements}</p>` : ''}
            <hr>
            <div>${plan.content || '无内容'}</div>
          `
          
          // 使用第三方库导出PDF
          // 这里需要实际引入相关库，例如：
          // import html2pdf from 'html2pdf.js'
          // html2pdf().from(container).save(`教案_${planId}.pdf`)
          
          // 由于我们没有实际引入库，这里只是模拟导出过程
          console.log('正在导出本地教案为PDF...')
          
          // 提示用户
          alert('本地教案导出功能需要在浏览器中运行，请在实际环境中使用。')
          
          return { success: true, isLocalExport: true }
        }
        
        // 调用后端API导出教案为PDF
        const response = await lessonPlanAPI.exportToPDF(planId)
        
        // 创建下载链接
        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `教案_${planId}.pdf`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        return { success: true }
      } catch (error) {
        console.error('导出PDF失败:', error)
        this.error = error.response?.data?.message || '导出PDF失败'
        throw error
      } finally {
        this.isLoading = false
      }
    },
    
    // 导出教案为Word
    async exportToWord(planId) {
      try {
        this.isLoading = true
        
        // 获取要导出的教案
        let plan = this.lessonPlans.find(p => p.id === planId)
        
        if (!plan) {
          // 如果在当前列表中没有找到，尝试从缓存中获取
          const userStore = useUserStore()
          const userId = userStore.user?.id
          
          if (userId) {
            const cachedPlans = cacheManager.getLessonPlanHistory(userId) || []
            plan = cachedPlans.find(p => p.id === planId)
          }
          
          if (!plan) {
            throw new Error('找不到要导出的教案')
          }
        }
        
        // 如果是本地教案，使用前端导出
        if (plan.isLocalOnly) {
          // 使用前端库导出Word
          // 这里需要引入相关库，例如 docx.js
          
          // 提示用户
          alert('本地教案导出功能需要在浏览器中运行，请在实际环境中使用。')
          
          return { success: true, isLocalExport: true }
        }
        
        // 调用后端API导出教案为Word
        const response = await lessonPlanAPI.exportToWord(planId)
        
        // 创建下载链接
        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `教案_${planId}.docx`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        return { success: true }
      } catch (error) {
        console.error('导出Word失败:', error)
        this.error = error.response?.data?.message || '导出Word失败'
        throw error
      } finally {
        this.isLoading = false
      }
    },
    
    // 导出所有教案历史
    exportLessonPlanHistory() {
      const userStore = useUserStore()
      const userId = userStore.user?.id
      
      if (!userId) return false
      
      try {
        return cacheManager.exportAllHistory(userId, `ai_edu_lesson_plans_${new Date().toISOString().split('T')[0]}.json`)
      } catch (error) {
        console.error('导出教案历史失败:', error)
        this.error = '导出教案历史失败'
        return false
      }
    },
    
    // 导入教案历史
    async importLessonPlanHistory(file) {
      const userStore = useUserStore()
      const userId = userStore.user?.id
      
      if (!userId) return false
      
      try {
        const result = await cacheManager.importHistory(file, userId)
        
        if (result) {
          // 重新加载教案列表
          await this.loadFromCache()
          return true
        }
        
        return false
      } catch (error) {
        console.error('导入教案历史失败:', error)
        this.error = '导入教案历史失败'
        return false
      }
    },
    
    // 同步教案历史到服务器
    async syncHistoryToServer() {
      const userStore = useUserStore()
      const userId = userStore.user?.id
      
      if (!userId) return false
      
      try {
        // 获取所有本地教案
        const localLessonPlans = cacheManager.getLessonPlanHistory(userId) || []
        
        // 过滤出需要同步的教案（本地教案或有更新的教案）
        const plansToSync = localLessonPlans.filter(plan => 
          plan.isLocalOnly || !plan.syncedAt || new Date(plan.updatedAt) > new Date(plan.syncedAt)
        )
        
        if (plansToSync.length === 0) {
          return { success: true, message: '没有需要同步的教案' }
        }
        
        // 调用API同步教案
        const response = await lessonPlanAPI.syncLessonPlans(plansToSync)
        
        // 更新同步状态
        if (response.data.success) {
          const syncedIds = response.data.syncedIds || []
          
          // 更新本地教案的同步状态
          const updatedPlans = localLessonPlans.map(plan => {
            if (syncedIds.includes(plan.id)) {
              return {
                ...plan,
                isLocalOnly: false,
                syncedAt: new Date().toISOString()
              }
            }
            return plan
          })
          
          // 更新缓存
          updatedPlans.forEach(plan => {
            cacheManager.saveLessonPlanHistory(userId, plan)
          })
          
          // 更新状态
          this.lessonPlans = updatedPlans
          
          // 如果当前教案在同步列表中，更新当前教案
          if (this.currentPlan && syncedIds.includes(this.currentPlan.id)) {
            const updatedCurrentPlan = updatedPlans.find(p => p.id === this.currentPlan.id)
            if (updatedCurrentPlan) {
              this.currentPlan = updatedCurrentPlan
            }
          }
        }
        
        return response.data
      } catch (error) {
        console.error('同步教案历史到服务器失败:', error)
        this.error = error.response?.data?.message || '同步教案历史到服务器失败'
        throw error
      }
    },
    
    // 从服务器同步教案历史
    async syncHistoryFromServer() {
      const userStore = useUserStore()
      const userId = userStore.user?.id
      
      if (!userId) return false
      
      try {
        // 调用API获取服务器上的教案
        const response = await lessonPlanAPI.getLessonPlans()
        
        const serverPlans = response.data || []
        
        // 合并教案
        this.mergeLessonPlans(serverPlans)
        
        return { success: true, count: this.lessonPlans.length }
      } catch (error) {
        console.error('从服务器同步教案历史失败:', error)
        this.error = error.response?.data?.message || '从服务器同步教案历史失败'
        throw error
      }
    },
    
    // 清空错误信息
    clearError() {
      this.error = null
    }
  }
})
