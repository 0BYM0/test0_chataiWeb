-- 步骤 1: 启用 pgvector 扩展
-- Supabase 默认可能已经启用，此命令确保其存在
create extension if not exists vector;

-- 步骤 2: 创建用于存储文档和其向量表示的表
-- 这张表将作为我们新的、持久化的知识库
create table public.documents (
  id bigserial primary key,
  content text, -- 存储文档的文本块
  metadata jsonb, -- 存储元数据，例如来源文件名
  embedding vector(1536) -- 存储文本块的向量。维度1536与OpenAI的text-embedding-ada-002模型匹配
);

-- 步骤 3: 创建一个函数来执行向量相似度搜索
-- 在数据库层面进行搜索，比在应用代码中更高效
create or replace function public.match_documents (
  query_embedding vector(1536), -- 我们要搜索的查询向量
  match_threshold float, -- 相似度阈值，用于过滤不相关的结果
  match_count int -- 返回最相似结果的数量
)
returns table (
  id bigint,
  content text,
  metadata jsonb,
  similarity float
)
language sql stable
as $$
  select
    documents.id,
    documents.content,
    documents.metadata,
    1 - (documents.embedding <=> query_embedding) as similarity
  from documents
  where 1 - (documents.embedding <=> query_embedding) > match_threshold
  order by documents.embedding <=> query_embedding
  limit match_count;
$$;

-- 步骤 4 (可选，建议): 为向量列创建IVFFlat索引，以加速大规模数据下的查询
-- 当您的知识库文档数量超过几千条时，这个索引会显著提升查询速度。
-- 我们先将其注释掉，您可以在未来数据量增大后，通过新的迁移文件来添加它。
-- create index on documents using ivfflat (embedding vector_cosine_ops)
-- with (lists = 100);