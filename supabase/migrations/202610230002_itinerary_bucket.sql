create table public.travel_currencies (
  code text primary key check (code ~ '^[A-Z]{3}$'),
  digits integer not null check (digits between 0 and 3)
);
revoke all on public.travel_currencies from anon, authenticated;
grant select on public.travel_currencies to authenticated;
alter table public.travel_currencies enable row level security;
create policy currencies_read on public.travel_currencies for select to authenticated using ((select public.is_pair_member()));

-- Amounts are decimal strings at the API boundary to avoid JSON float rounding.
create function public.valid_travel_amount(amount text, currency text) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(amount ~ '^[0-9]{1,12}(\.[0-9]{1,3})?$'
    and case when amount ~ '^[0-9]{1,12}(\.[0-9]{1,3})?$' then amount::numeric > 0 else false end
    and exists (select 1 from public.travel_currencies c where c.code = currency
      and length(coalesce(split_part(amount, '.', 2), '')) <= c.digits), false);
$$;
revoke all on function public.valid_travel_amount(text,text) from public, anon;
grant execute on function public.valid_travel_amount(text,text) to authenticated;

create table public.trip_activities (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  date date not null check (date between '1900-01-01' and '2200-12-31'),
  start_time time,
  title text not null check (length(trim(title)) between 1 and 120),
  location text not null default '' check (length(location) <= 200),
  description text not null default '' check (length(description) <= 3000),
  notes text not null default '' check (length(notes) <= 3000),
  estimated_cost text,
  currency text references public.travel_currencies(code),
  completed boolean not null default false,
  sort_order integer not null default 0,
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  revision integer not null default 0 check (revision >= 0),
  check ((estimated_cost is null and currency is null) or
    (estimated_cost is not null and currency is not null and public.valid_travel_amount(estimated_cost,currency))),
  check (start_time is null or extract(second from start_time) = 0)
);
create index activities_chronological on public.trip_activities(trip_id,date,start_time,sort_order,id);

create table public.travel_bucket_items (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) between 1 and 120),
  description text not null default '' check (length(description) <= 3000),
  destination text not null default '' check (length(destination) <= 160),
  status text not null default 'wishlist' check (status in ('wishlist','planned','completed')),
  trip_id uuid references public.trips(id) on delete set null,
  activity_id uuid unique references public.trip_activities(id) on delete set null,
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  revision integer not null default 0 check (revision >= 0)
);
create index bucket_trip on public.travel_bucket_items(trip_id);

do $$ declare table_name text; begin
  foreach table_name in array array['trip_activities','travel_bucket_items'] loop
    execute format('alter table public.%I enable row level security',table_name);
    execute format('revoke all on public.%I from anon, authenticated',table_name);
    execute format('grant select, insert, update, delete on public.%I to authenticated',table_name);
    execute format('create policy shared_read on public.%I for select to authenticated using ((select public.is_pair_member()))',table_name);
    execute format('create policy shared_add on public.%I for insert to authenticated with check ((select public.is_pair_member()) and created_by = (select auth.uid()) and revision = 0)',table_name);
    execute format('create policy shared_edit on public.%I for update to authenticated using ((select public.is_pair_member())) with check ((select public.is_pair_member()))',table_name);
    execute format('create policy shared_remove on public.%I for delete to authenticated using ((select public.is_pair_member()))',table_name);
    execute format('create trigger shared_version before update on public.%I for each row execute function public.protect_shared_row()',table_name);
  end loop;
end $$;

create function public.convert_bucket_item(item_id uuid, target_trip uuid, target_date date, expected_revision integer) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare item public.travel_bucket_items; new_id uuid;
begin
  if not public.is_pair_member() then raise exception 'Not authorized.'; end if;
  select * into item from public.travel_bucket_items where id = item_id for update;
  if not found then raise exception 'Item not found.'; end if;
  if item.activity_id is not null then return item.activity_id; end if;
  if item.revision <> expected_revision then raise exception 'This item changed. Reload before saving.'; end if;
  insert into public.trip_activities(trip_id,date,title,description,location)
    values(target_trip,target_date,item.title,item.description,item.destination) returning id into new_id;
  update public.travel_bucket_items set status = 'planned', trip_id = target_trip, activity_id = new_id where id = item_id;
  return new_id;
end;
$$;
revoke all on function public.convert_bucket_item(uuid,uuid,date,integer) from public, anon;
grant execute on function public.convert_bucket_item(uuid,uuid,date,integer) to authenticated;

create function public.move_activity(activity_id uuid, direction integer, expected_revision integer) returns void
language plpgsql security invoker set search_path = '' as $$
declare item public.trip_activities; neighbor public.trip_activities; ids uuid[]; pos integer; trip uuid;
begin
  if not public.is_pair_member() or direction not in (-1,1) then raise exception 'Not authorized or invalid direction.'; end if;
  select trip_id into trip from public.trip_activities where id = activity_id;
  -- Serialize all reorders for a trip before locking activities, avoiding deadlocks.
  perform 1 from public.trips where id = trip for update;
  select * into item from public.trip_activities where id = activity_id for update;
  if not found or item.revision <> expected_revision then raise exception 'This activity changed. Reload before moving.'; end if;
  select array_agg(id order by sort_order,created_at,id) into ids from public.trip_activities
    where trip_id = trip and date = item.date and start_time is not distinct from item.start_time;
  pos = array_position(ids,activity_id);
  if pos + direction < 1 or pos + direction > array_length(ids,1) then return; end if;
  select * into neighbor from public.trip_activities where id = ids[pos + direction];
  -- Normalize duplicate initial positions as part of the same atomic operation.
  update public.trip_activities a set sort_order = u.ordinality::integer
    from unnest(ids) with ordinality u(id,ordinality) where a.id = u.id;
  update public.trip_activities set sort_order = pos + direction where id = item.id;
  update public.trip_activities set sort_order = pos where id = neighbor.id;
end;
$$;
revoke all on function public.move_activity(uuid,integer,integer) from public, anon;
grant execute on function public.move_activity(uuid,integer,integer) to authenticated;
