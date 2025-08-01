-- 启用 RLS 并为关键表添加安全策略

-- 1. 为 public.documents 表启用 RLS
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- 2. 为 documents 表创建策略
-- 描述：允许所有已登录认证的用户进行读、写、改、删操作。
-- 这适用于一个共享的知识库。
DROP POLICY IF EXISTS "Allow all access for authenticated users on documents" ON public.documents;
CREATE POLICY "Allow all access for authenticated users on documents"
ON public.documents
FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');


-- 3. 为 public.conversations 表启用 RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- 4. 为 conversations 表创建策略
-- 描述：用户只能对自己的对话进行操作。
DROP POLICY IF EXISTS "Allow own access on conversations" ON public.conversations;
CREATE POLICY "Allow own access on conversations"
ON public.conversations
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);


-- 5. 为 public.messages 表启用 RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 6. 为 messages 表创建策略
-- 描述：用户只能对属于自己对话中的消息进行操作。
DROP POLICY IF EXISTS "Allow access to messages in own conversations" ON public.messages;
CREATE POLICY "Allow access to messages in own conversations"
ON public.messages
FOR ALL
-- 使用一个子查询来检查消息是否属于用户拥有的对话
USING (
  EXISTS (
    SELECT 1
    FROM public.conversations
    WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
  )
)
-- 确保插入消息时，该对话也属于当前用户
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.conversations
    WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
  )
);