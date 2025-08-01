import { createClient } from '@supabase/supabase-js'

// 从环境变量中获取Supabase配置
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// 创建Supabase客户端实例
let supabaseInstance = null
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * Supabase认证服务
 */
export const authService = {
  /**
   * 用户注册
   * @param {string} email - 用户邮箱
   * @param {string} password - 用户密码
 * @param {Object} metadata - 用户元数据
 * @returns {Promise} 注册结果
 */
async signUp(email, password, metadata = {}) {
    const client = supabase
    return await client.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    })
  },

  /**
   * 用户登录
   * @param {string} email - 用户邮箱
   * @param {string} password - 用户密码
 * @returns {Promise} 登录结果
 */
async signIn(email, password) {
    const client = supabase
    return await client.auth.signInWithPassword({
      email,
      password
    })
  },

  /**
   * 用户登出
 * @returns {Promise} 登出结果
 */
async signOut() {
    const client = supabase
    return await client.auth.signOut()
  },

  /**
   * 获取当前会话
 * @returns {Promise} 当前会话
 */
async getSession() {
    const client = supabase
    return await client.auth.getSession()
  },

  /**
   * 获取当前用户
 * @returns {Promise} 当前用户
 */
async getUser() {
    const client = supabase
    return await client.auth.getUser()
  },

  /**
   * 更新用户信息
   * @param {Object} updates - 更新的用户信息
 * @returns {Promise} 更新结果
 */
async updateUser(updates) {
    const client = supabase
    return await client.auth.updateUser(updates)
  },

  /**
   * 重置密码
   * @param {string} email - 用户邮箱
 * @returns {Promise} 重置结果
 */
async resetPassword(email) {
    const client = supabase
    return await client.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })
  },

  /**
   * 监听认证状态变化
   * @param {Function} callback - 回调函数
 * @returns {Object} 订阅对象
 */
onAuthStateChange(callback) {
    const client = supabase
    return client.auth.onAuthStateChange(callback)
  }
}

/**
 * Supabase数据库服务
 */
export const dbService = {
  /**
   * 获取表引用
   * @param {string} tableName - 表名
 * @returns {Object} 表引用
 */
table(tableName) {
    const client = supabase
    return client.from(tableName)
  },

  /**
   * 查询数据
   * @param {string} tableName - 表名
   * @param {Object} options - 查询选项
   * @returns {Promise} 查询结果
   */
  async select(tableName, options = {}) {
    const { columns = '*', filters = [], limit = null, order = null } = options
    
    let query = this.table(tableName).select(columns)
    
    // 应用过滤器
    filters.forEach(filter => {
      const { column, operator, value } = filter
      if (operator === 'eq') query = query.eq(column, value)
      else if (operator === 'neq') query = query.neq(column, value)
      else if (operator === 'gt') query = query.gt(column, value)
      else if (operator === 'lt') query = query.lt(column, value)
      else if (operator === 'gte') query = query.gte(column, value)
      else if (operator === 'lte') query = query.lte(column, value)
      else if (operator === 'like') query = query.like(column, value)
      else if (operator === 'ilike') query = query.ilike(column, value)
      else if (operator === 'in') query = query.in(column, value)
    })
    
    // 应用排序
    if (order) {
      const { column, ascending = true } = order
      query = query.order(column, { ascending })
    }
    
    // 应用限制
    if (limit) {
      query = query.limit(limit)
    }
    
    return await query
  },

  /**
   * 插入数据
   * @param {string} tableName - 表名
   * @param {Object|Array} data - 插入的数据
   * @param {boolean} returnData - 是否返回插入的数据
   * @returns {Promise} 插入结果
   */
  async insert(tableName, data, returnData = false) {
    let query = this.table(tableName).insert(data)
    
    if (returnData) {
      query = query.select()
    }
    
    return await query
  },

  /**
   * 更新数据
   * @param {string} tableName - 表名
   * @param {Object} data - 更新的数据
   * @param {Object} match - 匹配条件
   * @param {boolean} returnData - 是否返回更新的数据
   * @returns {Promise} 更新结果
   */
  async update(tableName, data, match, returnData = false) {
    let query = this.table(tableName).update(data)
    
    // 应用匹配条件
    Object.entries(match).forEach(([column, value]) => {
      query = query.eq(column, value)
    })
    
    if (returnData) {
      query = query.select()
    }
    
    return await query
  },

  /**
   * 删除数据
   * @param {string} tableName - 表名
   * @param {Object} match - 匹配条件
   * @param {boolean} returnData - 是否返回删除的数据
   * @returns {Promise} 删除结果
   */
  async delete(tableName, match, returnData = false) {
    let query = this.table(tableName).delete()
    
    // 应用匹配条件
    Object.entries(match).forEach(([column, value]) => {
      query = query.eq(column, value)
    })
    
    if (returnData) {
      query = query.select()
    }
    
    return await query
  },

  /**
   * 执行原始SQL查询
   * @param {string} sql - SQL查询语句
   * @param {Array} params - 查询参数
 * @returns {Promise} 查询结果
 */
async rpc(functionName, params = {}) {
    const client = supabase
    return await client.rpc(functionName, params)
  }
}

/**
 * Supabase存储服务
 */
export const storageService = {
  /**
   * 获取存储桶引用
   * @param {string} bucketName - 存储桶名称
 * @returns {Object} 存储桶引用
 */
bucket(bucketName) {
    const client = supabase
    return client.storage.from(bucketName)
  },

  /**
   * 上传文件
   * @param {string} bucketName - 存储桶名称
   * @param {string} path - 文件路径
   * @param {File} file - 文件对象
   * @param {Object} options - 上传选项
   * @returns {Promise} 上传结果
   */
  async upload(bucketName, path, file, options = {}) {
    const bucket = this.bucket(bucketName)
    return await bucket.upload(path, file, options)
  },

  /**
   * 下载文件
   * @param {string} bucketName - 存储桶名称
   * @param {string} path - 文件路径
   * @returns {Promise} 下载结果
   */
  async download(bucketName, path) {
    const bucket = this.bucket(bucketName)
    return await bucket.download(path)
  },

  /**
   * 获取文件公共URL
   * @param {string} bucketName - 存储桶名称
   * @param {string} path - 文件路径
   * @returns {string} 文件公共URL
   */
  getPublicUrl(bucketName, path) {
    const bucket = this.bucket(bucketName)
    return bucket.getPublicUrl(path)
  },

  /**
   * 列出文件
   * @param {string} bucketName - 存储桶名称
   * @param {string} path - 文件路径
   * @param {Object} options - 列表选项
   * @returns {Promise} 文件列表
   */
  async list(bucketName, path, options = {}) {
    const bucket = this.bucket(bucketName)
    return await bucket.list(path, options)
  },

  /**
   * 删除文件
   * @param {string} bucketName - 存储桶名称
   * @param {Array} paths - 文件路径数组
   * @returns {Promise} 删除结果
   */
  async remove(bucketName, paths) {
    const bucket = this.bucket(bucketName)
    return await bucket.remove(paths)
  }
}

export default {
  supabase,
  authService,
  dbService,
  storageService
}