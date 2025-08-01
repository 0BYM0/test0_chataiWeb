-- 将 lesson_plans 表中的 duration 字段修改为允许 NULL 值
ALTER TABLE public.lesson_plans
  ALTER COLUMN duration DROP NOT NULL;