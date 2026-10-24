-- Send only an invalidation signal. Private records never enter broadcast payloads.
create policy adventure_updates on realtime.messages for select to authenticated
using ((select public.is_pair_member()) and (select realtime.topic()) = 'our-adventures'
  and topic = 'our-adventures' and extension = 'broadcast');
create function public.notify_adventure_change() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform realtime.send('{}'::jsonb,'changed','our-adventures',true);
  return null;
end;
$$;
revoke all on function public.notify_adventure_change() from public;
do $$ declare table_name text; begin
  foreach table_name in array array['trips','trip_activities','travel_bucket_items','travel_memories','travel_photos','travel_expenses'] loop
    execute format('create trigger adventure_change after insert or update or delete on public.%I for each row execute function public.notify_adventure_change()',table_name);
  end loop;
end $$;

-- Converted wishes cannot silently point at an activity in another trip.
create function public.check_bucket_activity() returns trigger language plpgsql set search_path = '' as $$
declare item public.travel_bucket_items;
begin
  select * into item from public.travel_bucket_items where id = new.id;
  if found and item.activity_id is not null and not exists (
    select 1 from public.trip_activities where id = item.activity_id and trip_id = item.trip_id
  ) then raise exception 'Converted activity must belong to the related trip.'; end if;
  return null;
end;
$$;
revoke all on function public.check_bucket_activity() from public;
create constraint trigger bucket_activity_trip after insert or update on public.travel_bucket_items
deferrable initially deferred for each row execute function public.check_bucket_activity();
