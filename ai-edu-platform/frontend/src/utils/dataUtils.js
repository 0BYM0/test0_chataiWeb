/**
 * 数据处理工具类
 * 用于处理与后端的数据交互
 */

/**
 * 格式化日期时间
 * @param {string|Date} dateTime - 日期时间字符串或Date对象
 * @param {string} format - 格式化模板，默认为 'YYYY-MM-DD HH:mm:ss'
 * @returns {string} - 格式化后的日期时间字符串
 */
export const formatDateTime = (dateTime, format = 'YYYY-MM-DD HH:mm:ss') => {
  if (!dateTime) return ''
  
  const date = typeof dateTime === 'string' ? new Date(dateTime) : dateTime
  
  if (isNaN(date.getTime())) return ''
  
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  const seconds = date.getSeconds().toString().padStart(2, '0')
  
  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
}

/**
 * 格式化日期
 * @param {string|Date} date - 日期字符串或Date对象
 * @param {string} format - 格式化模板，默认为 'YYYY-MM-DD'
 * @returns {string} - 格式化后的日期字符串
 */
export const formatDate = (date, format = 'YYYY-MM-DD') => {
  return formatDateTime(date, format)
}

/**
 * 格式化时间
 * @param {string|Date} time - 时间字符串或Date对象
 * @param {string} format - 格式化模板，默认为 'HH:mm:ss'
 * @returns {string} - 格式化后的时间字符串
 */
export const formatTime = (time, format = 'HH:mm:ss') => {
  return formatDateTime(time, format)
}

/**
 * 格式化文件大小
 * @param {number} bytes - 文件大小（字节）
 * @param {number} decimals - 小数位数，默认为2
 * @returns {string} - 格式化后的文件大小字符串
 */
export const formatFileSize = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 字节'
  
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['字节', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

/**
 * 深拷贝对象
 * @param {Object} obj - 要拷贝的对象
 * @returns {Object} - 拷贝后的对象
 */
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj
  
  try {
    return JSON.parse(JSON.stringify(obj))
  } catch (error) {
    console.error('深拷贝对象失败:', error)
    return obj
  }
}

/**
 * 将对象转换为查询字符串
 * @param {Object} params - 参数对象
 * @returns {string} - 查询字符串
 */
export const objectToQueryString = (params) => {
  if (!params || typeof params !== 'object') return ''
  
  return Object.keys(params)
    .filter(key => params[key] != null && params[key] !== undefined)
    .map(key => {
      if (Array.isArray(params[key])) {
        return params[key]
          .map(val => `${encodeURIComponent(key)}=${encodeURIComponent(val)}`)
          .join('&')
      }
      return `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`
    })
    .join('&')
}

/**
 * 将查询字符串转换为对象
 * @param {string} queryString - 查询字符串
 * @returns {Object} - 参数对象
 */
export const queryStringToObject = (queryString) => {
  if (!queryString) return {}
  
  const query = queryString.startsWith('?') ? queryString.substring(1) : queryString
  
  return query.split('&').reduce((params, param) => {
    const [key, value] = param.split('=')
    if (key) {
      const decodedKey = decodeURIComponent(key)
      const decodedValue = value ? decodeURIComponent(value) : ''
      
      if (params[decodedKey]) {
        if (Array.isArray(params[decodedKey])) {
          params[decodedKey].push(decodedValue)
        } else {
          params[decodedKey] = [params[decodedKey], decodedValue]
        }
      } else {
        params[decodedKey] = decodedValue
      }
    }
    return params
  }, {})
}

/**
 * 将驼峰命名转换为下划线命名
 * @param {string} str - 驼峰命名字符串
 * @returns {string} - 下划线命名字符串
 */
export const camelToSnake = (str) => {
  return str.replace(/([A-Z])/g, '_$1').toLowerCase()
}

/**
 * 将下划线命名转换为驼峰命名
 * @param {string} str - 下划线命名字符串
 * @returns {string} - 驼峰命名字符串
 */
export const snakeToCamel = (str) => {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

/**
 * 将对象的键从驼峰命名转换为下划线命名
 * @param {Object} obj - 驼峰命名的对象
 * @returns {Object} - 下划线命名的对象
 */
export const objectKeysToCamel = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj
  
  if (Array.isArray(obj)) {
    return obj.map(item => objectKeysToCamel(item))
  }
  
  return Object.keys(obj).reduce((acc, key) => {
    const camelKey = snakeToCamel(key)
    acc[camelKey] = objectKeysToCamel(obj[key])
    return acc
  }, {})
}

/**
 * 将对象的键从下划线命名转换为驼峰命名
 * @param {Object} obj - 下划线命名的对象
 * @returns {Object} - 驼峰命名的对象
 */
export const objectKeysToSnake = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj
  
  if (Array.isArray(obj)) {
    return obj.map(item => objectKeysToSnake(item))
  }
  
  return Object.keys(obj).reduce((acc, key) => {
    const snakeKey = camelToSnake(key)
    acc[snakeKey] = objectKeysToSnake(obj[key])
    return acc
  }, {})
}

export default {
  formatDateTime,
  formatDate,
  formatTime,
  formatFileSize,
  deepClone,
  objectToQueryString,
  queryStringToObject,
  camelToSnake,
  snakeToCamel,
  objectKeysToCamel,
  objectKeysToSnake
}