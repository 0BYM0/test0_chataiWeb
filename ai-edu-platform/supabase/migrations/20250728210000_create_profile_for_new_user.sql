-- 创建一个函数，该函数将在 auth.users 表中创建新用户时被触发
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- 将新用户的信息插入到 public.users 表中
  -- new.id 和 new.email 来自于 auth.users 表中新创建的行
  -- new.raw_user_meta_data->>'role' 从元数据中提取角色
  insert into public.users (id, email, username, full_name, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'role'
  );
  return new;
end;
$$;

-- 创建一个触发器，在 auth.users 表中每次插入新行（即新用户注册）后，调用上述函数
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();