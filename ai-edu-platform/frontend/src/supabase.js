// 导入 Supabase 客户端库
import { createClient } from '@supabase/supabase-js'

// 从环境变量中获取您的 Supabase URL 和 anon 密钥
// 这种方式比直接硬编码更安全、更灵活
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// 创建并导出 Supabase 客户端实例
export const supabase = createClient(supabaseUrl, supabaseAnonKey)