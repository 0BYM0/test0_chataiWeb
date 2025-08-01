/**
 * 文件处理工具类
 * 用于处理文件上传和下载以及缓存管理
 */

/**
 * 下载文件
 * @param {Blob} blob - 文件Blob对象
 * @param {string} fileName - 文件名
 */
export const downloadFile = (blob, fileName) => {
  // 创建下载链接
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', fileName)
  
  // 添加到文档中并触发点击
  document.body.appendChild(link)
  link.click()
  
  // 清理
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

/**
 * 下载文本为文件
 * @param {string} text - 文本内容
 * @param {string} fileName - 文件名
 * @param {string} mimeType - MIME类型，默认为'text/plain'
 */
export const downloadTextAsFile = (text, fileName, mimeType = 'text/plain') => {
  const blob = new Blob([text], { type: mimeType })
  downloadFile(blob, fileName)
}

/**
 * 下载JSON为文件
 * @param {Object} data - JSON数据
 * @param {string} fileName - 文件名
 */
export const downloadJsonAsFile = (data, fileName) => {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  downloadFile(blob, fileName)
}

/**
 * 读取文件为文本
 * @param {File} file - 文件对象
 * @returns {Promise<string>} - 文件内容
 */
export const readFileAsText = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (event) => {
      resolve(event.target.result)
    }
    
    reader.onerror = (error) => {
      reject(error)
    }
    
    reader.readAsText(file)
  })
}

/**
 * 读取文件为DataURL
 * @param {File} file - 文件对象
 * @returns {Promise<string>} - DataURL
 */
export const readFileAsDataURL = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (event) => {
      resolve(event.target.result)
    }
    
    reader.onerror = (error) => {
      reject(error)
    }
    
    reader.readAsDataURL(file)
  })
}

/**
 * 获取文件扩展名
 * @param {string} fileName - 文件名
 * @returns {string} - 文件扩展名
 */
export const getFileExtension = (fileName) => {
  return fileName.slice((fileName.lastIndexOf('.') - 1 >>> 0) + 2)
}

/**
 * 检查文件类型是否为图片
 * @param {File} file - 文件对象
 * @returns {boolean} - 是否为图片
 */
export const isImageFile = (file) => {
  const imageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp']
  return imageTypes.includes(file.type)
}

/**
 * 检查文件类型是否为文档
 * @param {File} file - 文件对象
 * @returns {boolean} - 是否为文档
 */
export const isDocumentFile = (file) => {
  const documentTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain'
  ]
  return documentTypes.includes(file.type)
}

/**
 * 检查文件大小是否超过限制
 * @param {File} file - 文件对象
 * @param {number} maxSize - 最大大小（字节）
 * @returns {boolean} - 是否超过限制
 */
export const isFileSizeExceeded = (file, maxSize) => {
  return file.size > maxSize
}

/**
 * 压缩图片
 * @param {File} file - 图片文件
 * @param {Object} options - 压缩选项
 * @param {number} options.maxWidth - 最大宽度
 * @param {number} options.maxHeight - 最大高度
 * @param {number} options.quality - 图片质量（0-1）
 * @returns {Promise<Blob>} - 压缩后的图片Blob
 */
export const compressImage = (file, { maxWidth = 1024, maxHeight = 1024, quality = 0.8 } = {}) => {
  return new Promise((resolve, reject) => {
    if (!isImageFile(file)) {
      reject(new Error('文件不是图片'))
      return
    }
    
    const reader = new FileReader()
    
    reader.onload = (event) => {
      const img = new Image()
      
      img.onload = () => {
        // 计算缩放比例
        let width = img.width
        let height = img.height
        
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width)
          width = maxWidth
        }
        
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height)
          height = maxHeight
        }
        
        // 创建Canvas并绘制图片
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        
        // 转换为Blob
        canvas.toBlob(
          (blob) => {
            resolve(blob)
          },
          file.type,
          quality
        )
      }
      
      img.onerror = () => {
        reject(new Error('图片加载失败'))
      }
      
      img.src = event.target.result
    }
    
    reader.onerror = () => {
      reject(new Error('文件读取失败'))
    }
    
    reader.readAsDataURL(file)
  })
}

/**
 * 将Base64转换为Blob
 * @param {string} base64 - Base64字符串
 * @param {string} mimeType - MIME类型
 * @returns {Blob} - Blob对象
 */
export const base64ToBlob = (base64, mimeType) => {
  // 去除Base64前缀
  const base64Data = base64.split(',')[1]
  
  // 解码Base64
  const byteString = atob(base64Data)
  
  // 创建ArrayBuffer
  const arrayBuffer = new ArrayBuffer(byteString.length)
  const uint8Array = new Uint8Array(arrayBuffer)
  
  for (let i = 0; i < byteString.length; i++) {
    uint8Array[i] = byteString.charCodeAt(i)
  }
  
  // 创建Blob
  return new Blob([arrayBuffer], { type: mimeType })
}

/**
 * 将Blob转换为Base64
 * @param {Blob} blob - Blob对象
 * @returns {Promise<string>} - Base64字符串
 */
export const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (event) => {
      resolve(event.target.result)
    }
    
    reader.onerror = (error) => {
      reject(error)
    }
    
    reader.readAsDataURL(blob)
  })
}

/**
 * 缓存管理类
 * 用于管理本地缓存，支持对话历史记录的保存和查看
 */
export const cacheManager = {
  /**
   * 保存数据到本地存储
   * @param {string} key - 缓存键名
   * @param {any} data - 要缓存的数据
   * @param {number} expireTime - 过期时间（毫秒），默认为7天
   */
  saveToCache(key, data, expireTime = 7 * 24 * 60 * 60 * 1000) {
    try {
      const cacheItem = {
        data,
        timestamp: Date.now(),
        expireTime
      }
      localStorage.setItem(key, JSON.stringify(cacheItem))
      return true
    } catch (error) {
      console.error('保存缓存失败:', error)
      return false
    }
  },

  /**
   * 从本地存储获取数据
   * @param {string} key - 缓存键名
   * @returns {any|null} - 缓存的数据，如果不存在或已过期则返回null
   */
  getFromCache(key) {
    try {
      const cacheItemStr = localStorage.getItem(key)
      if (!cacheItemStr) return null

      const cacheItem = JSON.parse(cacheItemStr)
      const now = Date.now()
      
      // 检查是否过期
      if (cacheItem.expireTime && now - cacheItem.timestamp > cacheItem.expireTime) {
        localStorage.removeItem(key)
        return null
      }
      
      return cacheItem.data
    } catch (error) {
      console.error('获取缓存失败:', error)
      return null
    }
  },

  /**
   * 删除指定的缓存
   * @param {string} key - 缓存键名
   */
  removeFromCache(key) {
    try {
      localStorage.removeItem(key)
      return true
    } catch (error) {
      console.error('删除缓存失败:', error)
      return false
    }
  },

  /**
   * 清除所有缓存
   */
  clearAllCache() {
    try {
      localStorage.clear()
      return true
    } catch (error) {
      console.error('清除所有缓存失败:', error)
      return false
    }
  },

  /**
   * 获取所有缓存的键名
   * @returns {string[]} - 所有缓存的键名数组
   */
  getAllCacheKeys() {
    try {
      const keys = []
      for (let i = 0; i < localStorage.length; i++) {
        keys.push(localStorage.key(i))
      }
      return keys
    } catch (error) {
      console.error('获取所有缓存键名失败:', error)
      return []
    }
  },

  /**
   * 保存对话历史记录
   * @param {string} userId - 用户ID
   * @param {Object} conversation - 对话数据
   */
  saveConversationHistory(userId, conversation) {
    try {
      // 获取现有的对话历史记录
      const key = `conversation_history_${userId}`
      let histories = this.getFromCache(key) || []
      
      // 检查是否已存在相同ID的对话，如果存在则更新
      const existingIndex = histories.findIndex(h => h.id === conversation.id)
      if (existingIndex >= 0) {
        histories[existingIndex] = conversation
      } else {
        // 添加新对话，限制最大保存数量为50条
        histories.unshift(conversation)
        if (histories.length > 50) {
          histories = histories.slice(0, 50)
        }
      }
      
      // 保存更新后的历史记录
      return this.saveToCache(key, histories)
    } catch (error) {
      console.error('保存对话历史记录失败:', error)
      return false
    }
  },

  /**
   * 获取对话历史记录
   * @param {string} userId - 用户ID
   * @returns {Array} - 对话历史记录数组
   */
  getConversationHistory(userId) {
    try {
      const key = `conversation_history_${userId}`
      return this.getFromCache(key) || []
    } catch (error) {
      console.error('获取对话历史记录失败:', error)
      return []
    }
  },

  /**
   * 删除指定的对话历史记录
   * @param {string} userId - 用户ID
   * @param {string} conversationId - 对话ID
   */
  removeConversationHistory(userId, conversationId) {
    try {
      const key = `conversation_history_${userId}`
      let histories = this.getFromCache(key) || []
      
      // 过滤掉要删除的对话
      histories = histories.filter(h => h.id !== conversationId)
      
      // 保存更新后的历史记录
      return this.saveToCache(key, histories)
    } catch (error) {
      console.error('删除对话历史记录失败:', error)
      return false
    }
  },

  /**
   * 清除用户的所有对话历史记录
   * @param {string} userId - 用户ID
   */
  clearAllConversationHistory(userId) {
    try {
      const key = `conversation_history_${userId}`
      return this.removeFromCache(key)
    } catch (error) {
      console.error('清除所有对话历史记录失败:', error)
      return false
    }
  },

  /**
   * 保存教案历史记录
   * @param {string} userId - 用户ID
   * @param {Object} lessonPlan - 教案数据
   */
  saveLessonPlanHistory(userId, lessonPlan) {
    try {
      // 获取现有的教案历史记录
      const key = `lesson_plan_history_${userId}`
      let histories = this.getFromCache(key) || []
      
      // 检查是否已存在相同ID的教案，如果存在则更新
      const existingIndex = histories.findIndex(h => h.id === lessonPlan.id)
      if (existingIndex >= 0) {
        histories[existingIndex] = lessonPlan
      } else {
        // 添加新教案，限制最大保存数量为30条
        histories.unshift(lessonPlan)
        if (histories.length > 30) {
          histories = histories.slice(0, 30)
        }
      }
      
      // 保存更新后的历史记录
      return this.saveToCache(key, histories)
    } catch (error) {
      console.error('保存教案历史记录失败:', error)
      return false
    }
  },

  /**
   * 获取教案历史记录
   * @param {string} userId - 用户ID
   * @returns {Array} - 教案历史记录数组
   */
  getLessonPlanHistory(userId) {
    try {
      const key = `lesson_plan_history_${userId}`
      return this.getFromCache(key) || []
    } catch (error) {
      console.error('获取教案历史记录失败:', error)
      return []
    }
  },

  /**
   * 删除指定的教案历史记录
   * @param {string} userId - 用户ID
   * @param {string} lessonPlanId - 教案ID
   */
  removeLessonPlanHistory(userId, lessonPlanId) {
    try {
      const key = `lesson_plan_history_${userId}`
      let histories = this.getFromCache(key) || []
      
      // 过滤掉要删除的教案
      histories = histories.filter(h => h.id !== lessonPlanId)
      
      // 保存更新后的历史记录
      return this.saveToCache(key, histories)
    } catch (error) {
      console.error('删除教案历史记录失败:', error)
      return false
    }
  },

  /**
   * 清除用户的所有教案历史记录
   * @param {string} userId - 用户ID
   */
  clearAllLessonPlanHistory(userId) {
    try {
      const key = `lesson_plan_history_${userId}`
      return this.removeFromCache(key)
    } catch (error) {
      console.error('清除所有教案历史记录失败:', error)
      return false
    }
  },

  /**
   * 导出所有历史记录为JSON文件
   * @param {string} userId - 用户ID
   * @param {string} fileName - 导出的文件名
   */
  exportAllHistory(userId, fileName = 'ai_edu_history.json') {
    try {
      const conversations = this.getConversationHistory(userId) || []
      const lessonPlans = this.getLessonPlanHistory(userId) || []
      
      const exportData = {
        userId,
        exportDate: new Date().toISOString(),
        conversations,
        lessonPlans
      }
      
      downloadJsonAsFile(exportData, fileName)
      return true
    } catch (error) {
      console.error('导出历史记录失败:', error)
      return false
    }
  },

  /**
   * 导入历史记录
   * @param {File} file - JSON文件
   * @param {string} userId - 用户ID
   * @returns {Promise<boolean>} - 是否导入成功
   */
  async importHistory(file, userId) {
    try {
      const content = await readFileAsText(file)
      const importData = JSON.parse(content)
      
      if (!importData || !importData.conversations || !importData.lessonPlans) {
        throw new Error('导入的文件格式不正确')
      }
      
      // 导入对话历史记录
      if (importData.conversations.length > 0) {
        const conversationKey = `conversation_history_${userId}`
        const currentConversations = this.getFromCache(conversationKey) || []
        
        // 合并历史记录，避免重复
        const mergedConversations = [...currentConversations]
        importData.conversations.forEach(importConv => {
          if (!mergedConversations.some(conv => conv.id === importConv.id)) {
            mergedConversations.push(importConv)
          }
        })
        
        // 按时间排序并限制数量
        mergedConversations.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        const limitedConversations = mergedConversations.slice(0, 50)
        
        this.saveToCache(conversationKey, limitedConversations)
      }
      
      // 导入教案历史记录
      if (importData.lessonPlans.length > 0) {
        const lessonPlanKey = `lesson_plan_history_${userId}`
        const currentLessonPlans = this.getFromCache(lessonPlanKey) || []
        
        // 合并历史记录，避免重复
        const mergedLessonPlans = [...currentLessonPlans]
        importData.lessonPlans.forEach(importPlan => {
          if (!mergedLessonPlans.some(plan => plan.id === importPlan.id)) {
            mergedLessonPlans.push(importPlan)
          }
        })
        
        // 按时间排序并限制数量
        mergedLessonPlans.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        const limitedLessonPlans = mergedLessonPlans.slice(0, 30)
        
        this.saveToCache(lessonPlanKey, limitedLessonPlans)
      }
      
      return true
    } catch (error) {
      console.error('导入历史记录失败:', error)
      return false
    }
  },

  /**
   * 同步历史记录到服务器
   * @param {string} userId - 用户ID
   * @param {Function} apiFunction - API调用函数
   * @returns {Promise<boolean>} - 是否同步成功
   */
  async syncHistoryToServer(userId, apiFunction) {
    try {
      const conversations = this.getConversationHistory(userId) || []
      const lessonPlans = this.getLessonPlanHistory(userId) || []
      
      const syncData = {
        userId,
        conversations,
        lessonPlans
      }
      
      // 调用API将数据同步到服务器
      await apiFunction(syncData)
      return true
    } catch (error) {
      console.error('同步历史记录到服务器失败:', error)
      return false
    }
  },

  /**
   * 从服务器同步历史记录
   * @param {string} userId - 用户ID
   * @param {Function} apiFunction - API调用函数
   * @returns {Promise<boolean>} - 是否同步成功
   */
  async syncHistoryFromServer(userId, apiFunction) {
    try {
      // 调用API从服务器获取数据
      const response = await apiFunction(userId)
      
      if (response && response.data) {
        const { conversations, lessonPlans } = response.data
        
        // 更新对话历史记录
        if (conversations && conversations.length > 0) {
          this.saveToCache(`conversation_history_${userId}`, conversations)
        }
        
        // 更新教案历史记录
        if (lessonPlans && lessonPlans.length > 0) {
          this.saveToCache(`lesson_plan_history_${userId}`, lessonPlans)
        }
        
        return true
      }
      
      return false
    } catch (error) {
      console.error('从服务器同步历史记录失败:', error)
      return false
    }
  }
}

export default {
  downloadFile,
  downloadTextAsFile,
  downloadJsonAsFile,
  readFileAsText,
  readFileAsDataURL,
  getFileExtension,
  isImageFile,
  isDocumentFile,
  isFileSizeExceeded,
  compressImage,
  base64ToBlob,
  blobToBase64,
  cacheManager
}