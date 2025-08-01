-- 根据真实的数据库结构，将 lesson_plans 表中的必填字段修改为允许 NULL 值
-- 这样在创建教案时，可以只提供部分信息

ALTER TABLE public.lesson_plans
  ALTER COLUMN knowledge_points DROP NOT NULL,
  ALTER COLUMN teaching_objectives DROP NOT NULL,
  ALTER COLUMN key_points DROP NOT NULL,
  ALTER COLUMN teaching_process DROP NOT NULL;