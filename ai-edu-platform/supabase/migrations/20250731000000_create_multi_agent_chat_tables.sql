-- 步骤 0: 安全地删除可能存在的旧表，以确保全新创建
-- CASCADE 会一并删除相关的索引和约束
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.conversations CASCADE;

-- 步骤 1: 创建对话表 (conversations)
-- 这张表用于跟踪每一个独立的多智能体对话会话
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  -- 对话类型，例如 'student_self_study'，用于决定使用哪组智能体
  conversation_type text not null,
  -- 参与本次对话的智能体角色列表
  agent_roles_involved text[],
  -- 对话的标题，可以由AI生成或用户自定义
  title text,
  -- 存储一些额外的元数据
  metadata jsonb
);

-- 为新表添加注释，方便理解
comment on table public.conversations is '存储多智能体对话的会话信息';
comment on column public.conversations.user_id is '发起对话的用户';

-- 步骤 2: 创建消息表 (messages)
-- 这张表用于存储每一次对话中的所有消息记录
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  created_at timestamptz not null default now(),
  -- 消息发送者的角色 (例如 'user', 'expert', 'assistant', 'peer')
  role text not null,
  -- 消息的具体内容
  content text not null,
  -- 存储引用的知识库文档或其他元数据
  metadata jsonb
);

-- 为新表添加注释
comment on table public.messages is '存储多智能体对话中的每一条消息';
comment on column public.messages.conversation_id is '消息所属的对话';
comment on column public.messages.role is '消息发送者的角色';

-- 步骤 3: 为外键创建索引以优化查询性能
create index idx_messages_conversation_id on public.messages(conversation_id);
create index idx_conversations_user_id on public.conversations(user_id);