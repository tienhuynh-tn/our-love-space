-- Run against a disposable database with the migrations applied. All fixtures roll back.
begin;
insert into auth.users(id) values ('00000000-0000-0000-0000-000000000001'),('00000000-0000-0000-0000-000000000002'),('00000000-0000-0000-0000-000000000003');
insert into public.private_pair(person_one,person_two,name_one,name_two) values ('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000002','Test A','Test B');
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',true);
insert into public.trips(id,title,destination,timezone) values ('10000000-0000-0000-0000-000000000001','Our test trip','Test destination','Asia/Tokyo');
insert into public.trip_activities(id,trip_id,date,title) values
  ('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','2026-12-01','First'),
  ('20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','2026-12-01','Second');
insert into public.travel_bucket_items(id,title) values ('30000000-0000-0000-0000-000000000001','A little wish');
select public.convert_bucket_item('30000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','2026-12-01',0);
select public.convert_bucket_item('30000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','2026-12-01',0);
update public.trip_activities set sort_order=2 where title='A little wish';
do $$ begin
  if (select count(*) from public.trip_activities where title = 'A little wish') <> 1 then raise exception 'Duplicate bucket conversion'; end if;
end $$;
select public.move_activity('20000000-0000-0000-0000-000000000001',1,0);
do $$ begin
  if (select sort_order from public.trip_activities where id='20000000-0000-0000-0000-000000000001') <> 2 then raise exception 'Reorder failed'; end if;
  begin
    perform public.move_activity('20000000-0000-0000-0000-000000000001',-1,0);
    raise exception 'Stale reorder was accepted';
  exception when raise_exception then if sqlerrm = 'Stale reorder was accepted' then raise; end if; end;
end $$;
-- The second partner can edit data created by the first.
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',true);
update public.trips set title='Our shared test trip' where id='10000000-0000-0000-0000-000000000001' and revision=0;
do $$ begin
  if (select revision from public.trips limit 1) <> 1 then raise exception 'Partner edit failed'; end if;
  update public.trips set title='Stale overwrite' where id='10000000-0000-0000-0000-000000000001' and revision=0;
  if found then raise exception 'Stale update succeeded'; end if;
  begin
    update public.private_pair set name_one='Changed';
    raise exception 'Membership modification succeeded';
  exception when insufficient_privilege then null; end;
  begin
    update public.trips set created_by=auth.uid();
    raise exception 'Creator modification succeeded';
  exception when raise_exception then if sqlerrm='Creator modification succeeded' then raise; end if; end;
  begin
    insert into public.trips(title,destination,timezone,status) values('Bad','Bad','UTC','upcoming');
    raise exception 'Missing dates accepted';
  exception when check_violation then null; end;
  begin
    insert into public.trips(title,destination,timezone,created_by) values('Bad','Bad','UTC','00000000-0000-0000-0000-000000000001');
    raise exception 'Spoofed creator accepted';
  exception when insufficient_privilege then null; end;
end $$;
insert into public.travel_expenses(id,trip_id,description,amount,currency,paid_by,category,date) values
 ('40000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','Lunch','12.30','USD','00000000-0000-0000-0000-000000000001','food','2026-12-01');
do $$ begin
  begin
    insert into public.travel_expenses(trip_id,description,amount,currency,paid_by,category,date) values('10000000-0000-0000-0000-000000000001','Invalid precision','1.12','JPY',auth.uid(),'food','2026-12-01');
    raise exception 'Currency precision accepted';
  exception when check_violation then null; end;
  begin
    update public.travel_expenses set paid_by='00000000-0000-0000-0000-000000000003';
    raise exception 'Outsider payer accepted';
  exception when raise_exception then if sqlerrm='Outsider payer accepted' then raise; end if; end;
end $$;
insert into public.travel_memories(id,trip_id,date,caption) values('50000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','2026-12-01','Test memory');
insert into public.travel_photos(id,trip_id,memory_id,storage_path,mime_type,byte_size) values('60000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001/00000000-0000-0000-0000-000000000002/60000000-0000-0000-0000-000000000001','image/jpeg',100);
insert into storage.objects(bucket_id,name) values('travel-photos','10000000-0000-0000-0000-000000000001/00000000-0000-0000-0000-000000000002/60000000-0000-0000-0000-000000000001');
update public.trips set cover_photo_id='60000000-0000-0000-0000-000000000001';
select set_config('realtime.topic','our-adventures',true);
do $$ begin
  if not exists(select 1 from realtime.messages) then raise exception 'Partner cannot receive private updates'; end if;
  if exists(select 1 from realtime.messages where payload <> '{}'::jsonb or not private) then raise exception 'Private data in broadcast'; end if;
end $$;
-- An authenticated outsider sees no shared rows or photo objects and cannot insert.
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000003',true);
do $$ declare t text; n integer; begin
  foreach t in array array['private_pair','trips','trip_activities','travel_bucket_items','travel_expenses','travel_memories','travel_photos','photo_cleanup'] loop
    execute format('select count(*) from public.%I',t) into n;
    if n <> 0 then raise exception 'Outsider read allowed on %',t; end if;
  end loop;
  if exists(select 1 from storage.objects) then raise exception 'Outsider photo read allowed'; end if;
  if exists(select 1 from realtime.messages) then raise exception 'Outsider realtime access allowed'; end if;
  begin
    insert into public.trips(title,destination,timezone) values('Outsider','Bad','UTC');
    raise exception 'Outsider insert accepted';
  exception when insufficient_privilege then null; end;
end $$;
-- Missing identity is denied even under the authenticated role.
select set_config('request.jwt.claim.sub','',true);
do $$ begin if exists(select 1 from public.trips) then raise exception 'Anonymous read allowed'; end if; end $$;
set local role anon;
do $$ begin
  begin
    perform 1 from public.trips;
    raise exception 'Anonymous role can query trips';
  exception when insufficient_privilege then null; end;
end $$;
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',true);
do $$ begin
  if (select count(*) from storage.objects) <> 1 then raise exception 'Partner photo read failed'; end if;
  begin
    insert into storage.objects(bucket_id,name) values('travel-photos','unowned/path');
    raise exception 'Unowned storage upload accepted';
  exception when insufficient_privilege then null; end;
end $$;
delete from public.trips where id='10000000-0000-0000-0000-000000000001';
do $$ begin
  if exists(select 1 from public.travel_memories) or exists(select 1 from public.travel_expenses) then raise exception 'Trip cascade failed'; end if;
  if (select count(*) from public.photo_cleanup) <> 1 then raise exception 'Cleanup queue failed'; end if;
  if (select trip_id from public.travel_bucket_items limit 1) is not null then raise exception 'Bucket retained deleted trip'; end if;
end $$;
do $$ begin
  delete from storage.objects where bucket_id='travel-photos';
  if not found then raise exception 'Cleanup storage delete denied'; end if;
end $$;
set constraints all immediate;
rollback;
