-- Test-only Supabase interfaces. Never apply this file to a Supabase project.
do $$ begin
  if not exists(select 1 from pg_roles where rolname='anon') then create role anon nologin; end if;
  if not exists(select 1 from pg_roles where rolname='authenticated') then create role authenticated nologin; end if;
end $$;
create schema auth;
create table auth.users (id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid;
$$;
grant usage on schema auth, public to anon, authenticated;
grant execute on function auth.uid() to anon, authenticated;
create schema storage;
create table storage.buckets (id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
create table storage.objects (id uuid primary key default gen_random_uuid(),bucket_id text references storage.buckets(id),name text);
alter table storage.objects enable row level security;
grant usage on schema storage to authenticated;
grant select, insert, delete on storage.objects to authenticated;
create schema realtime;
create table realtime.messages (topic text,extension text,payload jsonb,private boolean);
alter table realtime.messages enable row level security;
grant usage on schema realtime to authenticated;
grant select on realtime.messages to authenticated;
create function realtime.topic() returns text language sql stable as $$
  select current_setting('realtime.topic',true);
$$;
create function realtime.send(payload jsonb,event text,topic text,private boolean) returns void language sql as $$
  insert into realtime.messages(topic,extension,payload,private) values(topic,'broadcast',payload,private);
$$;
