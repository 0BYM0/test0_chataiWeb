-- 1. 为所有需要保护的表启用行级安全 (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_plans ENABLE ROW LEVEL SECURITY;

-- 2. 创建 'users' 表的策略
-- 允许用户读取自己的信息
CREATE POLICY "Users can read their own user record"
ON public.users FOR SELECT
USING (auth.uid() = id);

-- 允许用户更新自己的信息
CREATE POLICY "Users can update their own user record"
ON public.users FOR UPDATE
USING (auth.uid() = id);

-- 允许新注册的用户为自己创建一条记录
-- 这是为了解决 auth 函数中 insert 操作的权限问题
CREATE POLICY "Users can insert their own user record"
ON public.users FOR INSERT
WITH CHECK (auth.uid() = id);


-- 3. 创建 'conversations' 表的策略
-- 允许用户对自己的对话进行所有操作 (CRUD)
CREATE POLICY "Users can CRUD their own conversations"
ON public.conversations FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);


-- 4. 创建 'messages' 表的策略
-- 允许用户对属于自己对话的消息进行所有操作
-- 这是一个更复杂的策略，需要检查消息所属的对话是否属于当前用户
CREATE POLICY "Users can CRUD messages in their own conversations"
ON public.messages FOR ALL
USING (
  (SELECT user_id FROM public.conversations WHERE id = messages.conversation_id) = auth.uid()
);


-- 5. 创建 'lesson_plans' 表的策略
-- 允许用户对自己的教案进行所有操作 (CRUD)
CREATE POLICY "Users can CRUD their own lesson plans"
ON public.lesson_plans FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);