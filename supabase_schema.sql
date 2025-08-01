-- 1. 创建角色类型枚举 (如果 ERole 是枚举)
-- Supabase/Postgres 中，我们可以创建一个自定义类型来模拟枚举
CREATE TYPE user_role AS ENUM ('ROLE_USER', 'ROLE_MODERATOR', 'ROLE_ADMIN');

-- 2. 创建 roles 表
CREATE TABLE roles (
    id BIGSERIAL PRIMARY KEY,
    name user_role NOT NULL UNIQUE
);

-- 预置角色数据
INSERT INTO roles (name) VALUES ('ROLE_USER'), ('ROLE_MODERATOR'), ('ROLE_ADMIN');

-- 3. 创建 users 表
-- Supabase 自带了 auth.users 表，但为了与原项目解耦，我们创建自己的 public.users 表
-- 注意：密码管理将由 Supabase Auth 完成，这里不存储 password hash
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- 使用 UUID 并引用 Supabase Auth 的用户ID
    username VARCHAR(255) UNIQUE,
    email VARCHAR(255) UNIQUE,
    full_name VARCHAR(255),
    avatar_url TEXT,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 创建 user_roles 连接表 (多对多)
CREATE TABLE user_roles (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id BIGINT REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- 5. 创建 conversations 表
CREATE TABLE conversations (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    conversation_type VARCHAR(255),
    title VARCHAR(255),
    start_time TIMESTAMPTZ DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    agent_roles_involved TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. 创建 messages 表
CREATE TABLE messages (
    id BIGSERIAL PRIMARY KEY,
    conversation_id BIGINT REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
    content TEXT,
    sender VARCHAR(255), -- 'user' 或 'ai'
    sender_type VARCHAR(255), -- 'user' 或 'agent'
    sender_role VARCHAR(255),
    receiver_type VARCHAR(255),
    receiver_role VARCHAR(255),
    "timestamp" TIMESTAMPTZ DEFAULT NOW(),
    message_order INT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. 创建 lesson_plans 表
CREATE TABLE lesson_plans (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(255) NOT NULL,
    grade VARCHAR(255),
    module VARCHAR(255),
    knowledge_point VARCHAR(255),
    duration INT,
    objectives JSONB,
    key_points JSONB,
    difficult_points JSONB,
    resources JSONB,
    teaching_process JSONB,
    evaluation TEXT,
    extension TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 为 updated_at 字段创建自动更新触发器
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 将触发器应用到各个表
CREATE TRIGGER set_timestamp_users BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_conversations BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_messages BEFORE UPDATE ON messages FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_lesson_plans BEFORE UPDATE ON lesson_plans FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

-- 为表添加索引以优化查询性能
CREATE INDEX ON conversations (user_id);
CREATE INDEX ON messages (conversation_id);
CREATE INDEX ON lesson_plans (user_id);
CREATE INDEX ON user_roles (user_id);
CREATE INDEX ON user_roles (role_id);