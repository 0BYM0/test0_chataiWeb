// 导入必要的模块
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS 头，允许跨域请求
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-function-route',
}

console.log(`Function "lesson-plans" up and running!`);

// 启动服务
Deno.serve(async (req) => {
  // 处理 CORS 预检请求
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 创建 Supabase 客户端，并确保用户已认证
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // 从 Authorization 头中获取用户信息
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      throw new Error('用户未认证，禁止访问。')
    }

    // 解析 URL 以获取路径中的 ID
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    const lessonPlanId = pathParts[pathParts.length - 1]

    // 根据请求方法执行不同的操作
    switch (req.method) {
      // 获取教案列表 (GET /lesson-plans)
      case 'GET': {
        // 如果路径末尾是 'lesson-plans'，则获取列表
        if (lessonPlanId === 'lesson-plans') {
          const { data, error } = await supabaseClient
            .from('lesson_plans')
            .select('*')
            // RLS 策略会自动过滤，确保只返回当前用户的教案
            .order('created_at', { ascending: false });

          if (error) throw error;
          return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          });
        }
        // 否则，获取单个教案 (GET /lesson-plans/:id)
        else {
          const { data, error } = await supabaseClient
            .from('lesson_plans')
            .select('*')
            .eq('id', lessonPlanId)
            .single(); // .single() 确保只返回一条记录

          if (error) throw error;
          return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          });
        }
      }

      // 创建新教案 (POST /lesson-plans)
      case 'POST': {
        const lessonPlanData = await req.json();
        const { data, error } = await supabaseClient
          .from('lesson_plans')
          .insert({ ...lessonPlanData, user_id: user.id }) // 确保 user_id 是当前用户
          .select()
          .single();

        if (error) throw error;
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 201, // 201 Created
        });
      }

      // 更新教案 (PUT /lesson-plans/:id)
      case 'PUT': {
        const lessonPlanData = await req.json();
        const { data, error } = await supabaseClient
          .from('lesson_plans')
          .update(lessonPlanData)
          .eq('id', lessonPlanId) // RLS 策略会再次确认该记录属于当前用户
          .select()
          .single();

        if (error) throw error;
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }

      // 删除教案 (DELETE /lesson-plans/:id)
      case 'DELETE': {
        const { error } = await supabaseClient
          .from('lesson_plans')
          .delete()
          .eq('id', lessonPlanId); // RLS 策略会确保只能删除自己的教案

        if (error) throw error;
        return new Response(JSON.stringify({ message: '教案已成功删除' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }

      default: {
        return new Response(JSON.stringify({ error: `不支持的方法: ${req.method}` }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 405, // Method Not Allowed
        });
      }
    }
  } catch (error) {
    // 统一的错误处理
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});