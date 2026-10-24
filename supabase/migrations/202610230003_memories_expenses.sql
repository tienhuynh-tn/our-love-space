create table public.travel_memories (
  id uuid primary key default gen_random_uuid(), trip_id uuid not null references public.trips(id) on delete cascade,
  caption text not null default '' check (length(caption) <= 3000),
  date date not null check (date between '1900-01-01' and '2200-12-31'),
  location text not null default '' check (length(location) <= 200),
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  revision integer not null default 0 check (revision >= 0)
);
create index memories_chronological on public.travel_memories(trip_id,date,created_at,id);
create table public.travel_photos (
  id uuid primary key default gen_random_uuid(), trip_id uuid not null references public.trips(id) on delete cascade,
  memory_id uuid references public.travel_memories(id) on delete cascade,
  storage_path text unique not null,
  mime_type text not null check (mime_type in ('image/jpeg','image/png','image/webp')),
  byte_size integer not null check (byte_size between 1 and 3145728),
  ready boolean not null default false,
  created_by uuid not null default auth.uid() references auth.users(id), created_at timestamptz not null default now(),
  unique (trip_id,id),
  check (storage_path = trip_id::text || '/' || created_by::text || '/' || id::text)
);
create index photos_memory on public.travel_photos(memory_id);
alter table public.trips add constraint cover_belongs_to_trip foreign key (id,cover_photo_id)
  references public.travel_photos(trip_id,id) deferrable initially deferred;

create function public.check_photo_trip() returns trigger language plpgsql set search_path = '' as $$
begin
  if new.memory_id is not null and not exists (select 1 from public.travel_memories where id = new.memory_id and trip_id = new.trip_id) then
    raise exception 'Photo must belong to the same trip as its memory.';
  end if;
  return new;
end;
$$;
create trigger photo_trip before insert on public.travel_photos for each row execute function public.check_photo_trip();
revoke all on function public.check_photo_trip() from public;

create table public.travel_expenses (
  id uuid primary key default gen_random_uuid(), trip_id uuid not null references public.trips(id) on delete cascade,
  description text not null check (length(trim(description)) between 1 and 200),
  amount text not null,
  currency text not null references public.travel_currencies(code),
  paid_by uuid not null references auth.users(id),
  category text not null check (category in ('transport','stay','food','activities','shopping','other')),
  date date not null check (date between '1900-01-01' and '2200-12-31'),
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  revision integer not null default 0 check (revision >= 0),
  check (public.valid_travel_amount(amount,currency))
);
create index expenses_chronological on public.travel_expenses(trip_id,date,id);
create function public.check_payer() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.private_pair where new.paid_by in (person_one,person_two)) then
    raise exception 'Payer must belong to the private pair.';
  end if;
  return new;
end;
$$;
create trigger expense_payer before insert or update on public.travel_expenses for each row execute function public.check_payer();
revoke all on function public.check_payer() from public;

do $$ declare table_name text; begin
  foreach table_name in array array['travel_memories','travel_expenses','travel_photos'] loop
    execute format('alter table public.%I enable row level security',table_name);
    execute format('revoke all on public.%I from anon, authenticated',table_name);
    execute format('grant select, insert, delete on public.%I to authenticated',table_name);
    execute format('create policy shared_read on public.%I for select to authenticated using ((select public.is_pair_member()))',table_name);
    execute format('create policy shared_add on public.%I for insert to authenticated with check ((select public.is_pair_member()) and created_by = (select auth.uid()))',table_name);
    execute format('create policy shared_remove on public.%I for delete to authenticated using ((select public.is_pair_member()))',table_name);
    if table_name <> 'travel_photos' then
      execute format('grant update on public.%I to authenticated',table_name);
      execute format('create policy shared_edit on public.%I for update to authenticated using ((select public.is_pair_member())) with check ((select public.is_pair_member()))',table_name);
      execute format('create trigger shared_version before update on public.%I for each row execute function public.protect_shared_row()',table_name);
    end if;
  end loop;
end $$;

grant update(ready) on public.travel_photos to authenticated;
create policy photo_finalize on public.travel_photos for update to authenticated
  using ((select public.is_pair_member()) and created_by = (select auth.uid()))
  with check ((select public.is_pair_member()) and created_by = (select auth.uid()));

-- A durable deletion queue survives failed storage API calls and trip cascades.
create table public.photo_cleanup (storage_path text primary key, created_at timestamptz not null default now());
alter table public.photo_cleanup enable row level security;
revoke all on public.photo_cleanup from anon, authenticated;
grant select, delete on public.photo_cleanup to authenticated;
create policy cleanup_read on public.photo_cleanup for select to authenticated using ((select public.is_pair_member()));
create policy cleanup_remove on public.photo_cleanup for delete to authenticated using ((select public.is_pair_member()));
create function public.enqueue_photo_cleanup() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.photo_cleanup(storage_path) values(old.storage_path) on conflict do nothing;
  return old;
end;
$$;
revoke all on function public.enqueue_photo_cleanup() from public;
create trigger photo_cleanup after delete on public.travel_photos for each row execute function public.enqueue_photo_cleanup();

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('travel-photos','travel-photos',false,3145728,array['image/jpeg','image/png','image/webp']);
create policy travel_photo_read on storage.objects for select to authenticated using (
  bucket_id = 'travel-photos' and (select public.is_pair_member())
  and (exists (select 1 from public.travel_photos p where p.storage_path = name)
    or exists (select 1 from public.photo_cleanup q where q.storage_path = name))
);
create policy travel_photo_upload on storage.objects for insert to authenticated with check (
  bucket_id = 'travel-photos' and (select public.is_pair_member())
  and exists (select 1 from public.travel_photos p where p.storage_path = name and p.created_by = (select auth.uid()))
);
create policy travel_photo_delete on storage.objects for delete to authenticated using (
  bucket_id = 'travel-photos' and (select public.is_pair_member())
  and (exists (select 1 from public.travel_photos p where p.storage_path = name)
    or exists (select 1 from public.photo_cleanup q where q.storage_path = name))
);
