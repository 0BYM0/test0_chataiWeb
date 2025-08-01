// 导入必要的模块
// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS 头，允许来自任何源的请求，这在开发中很方便
// 在生产环境中，您应该将其限制为您的前端域名
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-function-route',
}

console.log(`Function "auth" up and running!`);

// 启动服务
Deno.serve(async (req) => {
  // 处理 CORS 预检请求 (Preflight)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 创建 Supabase 客户端
    // Deno.env.get() 会自动从环境变量中读取 Supabase 的 URL 和 ANON_KEY
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      // 将客户端请求头中的 Authorization 传递给 Supabase 客户端
      // 这样 Supabase RLS 才能正确识别用户
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // 从请求头中获取路由信息，这是前端实际发送数据的方式
    const route = req.headers.get('x-function-route')

    // 注册逻辑: POST /auth/signup
    if (route === 'signup' && req.method === 'POST') {
      const body = await req.json()
      // 打印接收到的请求体，用于调试
      console.log('Signup request body:', JSON.stringify(body, null, 2))

      const { email, password, username, role } = body
      if (!email || !password || !username || !role) {
        // 如果验证失败，也打印错误日志
        console.error('Validation failed! Missing required fields.', { email, password, username, role })
        throw new Error("必须提供邮箱、密码、用户名和角色。")
      }

      // 使用 Supabase Auth 进行用户注册
      const { data: authData, error: authError } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username,
            full_name: username, // 默认将 username 设为 full_name
            role: role, // 保存用户角色
          },
        },
      })

      if (authError) {
        // 打印来自 Supabase Auth 的具体错误信息
        console.error('Supabase signUp error:', authError.message)
        throw authError
      }
      if (!authData.user) throw new Error("注册失败，未能创建用户。")

      // 数据库触发器 `on_auth_user_created` 会自动处理用户资料的创建，
      // 所以我们不再需要在这里手动插入 `public.users` 表。
      // 代码变得更简洁了！

      return new Response(JSON.stringify(authData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // 登录逻辑: POST /auth/signin
    if (route === 'signin' && req.method === 'POST') {
      const { email, password } = await req.json()
      if (!email || !password) {
        throw new Error("必须提供邮箱和密码。")
      }
      
      // 使用 Supabase Auth 进行用户登录
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // 如果没有匹配的路由，返回 404
    const url = new URL(req.url)
    const data = {
      error: `未找到路由: ${req.method} ${url.pathname}`,
    }
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 404,
    })

  } catch (error) {
    // 统一的错误处理，同时在服务端打印错误日志
    console.error('Error caught in auth function:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400, // Bad Request
    })
  }
})
