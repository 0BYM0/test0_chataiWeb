-- 为 public.users 表添加 full_name 字段，以修复自动创建用户资料的触发器
ALTER TABLE public.users ADD COLUMN full_name TEXT;