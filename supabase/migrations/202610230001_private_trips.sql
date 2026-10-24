-- Membership is provisioned by an administrator, never by the application.
create table public.private_pair (
  id boolean primary key default true check (id),
  person_one uuid not null references auth.users(id) on delete restrict,
  person_two uuid not null references auth.users(id) on delete restrict,
  name_one text not null check (length(trim(name_one)) between 1 and 80),
  name_two text not null check (length(trim(name_two)) between 1 and 80),
  check (person_one <> person_two)
);
alter table public.private_pair enable row level security;
revoke all on public.private_pair from anon, authenticated;
grant select on public.private_pair to authenticated;

create function public.is_pair_member() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.private_pair
    where id and (select auth.uid()) in (person_one, person_two));
$$;
revoke all on function public.is_pair_member() from public, anon;
grant execute on function public.is_pair_member() to authenticated;
create policy pair_read on public.private_pair for select to authenticated
using ((select public.is_pair_member()));

create function public.protect_shared_row() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.id <> old.id or new.created_by <> old.created_by or new.created_at <> old.created_at then
    raise exception 'Creator attribution cannot be changed.';
  end if;
  if to_jsonb(new) ? 'trip_id' and to_jsonb(new)->>'trip_id' is distinct from to_jsonb(old)->>'trip_id'
     and tg_table_name <> 'travel_bucket_items' then
    raise exception 'Move content by recreating it in the destination trip.';
  end if;
  new.updated_at = now();
  new.revision = old.revision + 1;
  return new;
end;
$$;
revoke all on function public.protect_shared_row() from public;

create function public.valid_trip_timezone() returns trigger
language plpgsql set search_path = '' as $$
begin
  if not exists (select 1 from pg_timezone_names where name = new.timezone) then
    raise exception 'Invalid destination timezone.';
  end if;
  return new;
end;
$$;
revoke all on function public.valid_trip_timezone() from public;

create table public.trips (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) between 1 and 120),
  destination text not null check (length(trim(destination)) between 1 and 160),
  start_date date check (start_date between '1900-01-01' and '2200-12-31'),
  end_date date check (end_date between '1900-01-01' and '2200-12-31'),
  timezone text not null check (length(timezone) between 1 and 100),
  description text not null default '' check (length(description) <= 5000),
  status text not null default 'dreaming' check (status in ('dreaming','upcoming','memories')),
  cover_photo_id uuid,
  created_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  revision integer not null default 0 check (revision >= 0),
  check ((start_date is null and end_date is null and status = 'dreaming')
    or (start_date is not null and end_date is not null and end_date >= start_date))
);
create index trips_status_date on public.trips(status, start_date, id);
create trigger trips_version before update on public.trips for each row execute function public.protect_shared_row();
create trigger trips_timezone before insert or update on public.trips for each row execute function public.valid_trip_timezone();
alter table public.trips enable row level security;
revoke all on public.trips from anon, authenticated;
grant select, insert, update, delete on public.trips to authenticated;
create policy trips_read on public.trips for select to authenticated using ((select public.is_pair_member()));
create policy trips_add on public.trips for insert to authenticated with check ((select public.is_pair_member()) and created_by = (select auth.uid()) and revision = 0);
create policy trips_edit on public.trips for update to authenticated using ((select public.is_pair_member())) with check ((select public.is_pair_member()));
create policy trips_remove on public.trips for delete to authenticated using ((select public.is_pair_member()));
