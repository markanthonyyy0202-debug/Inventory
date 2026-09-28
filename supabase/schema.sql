-- Run this whole file once in Supabase > SQL Editor.
-- (The first block clears any earlier version of this project's tables.)
drop trigger if exists on_auth_user on auth.users;
drop function if exists handle_new_user(), my_role() cascade;
drop view if exists stock_balances;
drop table if exists audit_logs, inventory_transactions, materials, locations, profiles cascade;

create table locations(id serial primary key,location_name text unique not null,type text not null default 'Other' check(type in('Site','Office','Warehouse','Other')),active boolean default true);
create table materials(id serial primary key,material_name text unique not null,category text,unit text default 'pcs',description text,active boolean default true,created_at timestamptz default now());
create table inventory_transactions(
 id bigserial primary key,transaction_date date not null default current_date,
 material_id int not null references materials,quantity numeric not null,
 movement text not null check(movement in('Site → Office','Office → Site','Site → Site','Office → Office','Received','Issued','Returned','Adjustment')),
 from_location int references locations,to_location int references locations,
 current_location int generated always as (coalesce(to_location,from_location)) stored,
 remarks text,created_by_name text,updated_by_name text,
 created_at timestamptz default now(),updated_at timestamptz default now(),
 check((movement='Adjustment' and quantity<>0) or quantity>0),
 check((movement in('Received','Returned','Adjustment') and to_location is not null and from_location is null)
  or (movement='Issued' and from_location is not null and to_location is null)
  or (movement like '%→%' and from_location is not null and to_location is not null and from_location<>to_location)));
create table audit_logs(id bigserial primary key,user_name text,action text,record_id bigint,details text,created_at timestamptz default now());
create index on inventory_transactions(material_id);create index on inventory_transactions(transaction_date);
create index on inventory_transactions(from_location);create index on inventory_transactions(to_location);create index on audit_logs(created_at);

create view stock_balances with(security_invoker=true) as
select material_id,location_id,sum(q) qty from(
 select material_id,to_location location_id,quantity q from inventory_transactions where to_location is not null
 union all select material_id,from_location,-quantity from inventory_transactions where from_location is not null)t group by 1,2;

create function tx_before() returns trigger language plpgsql as $$
begin if tg_op='UPDATE' then new.created_by_name:=old.created_by_name;new.created_at:=old.created_at;new.updated_at:=now();end if;return new;end$$;
create trigger tx_b before insert or update on inventory_transactions for each row execute function tx_before();

create function tx_audit() returns trigger language plpgsql security definer as $$
declare n text;m text;r inventory_transactions;
begin r:=case when tg_op='DELETE' then old else new end;
 select material_name into m from materials where id=r.material_id;
 n:=coalesce(case tg_op when 'INSERT' then new.created_by_name when 'UPDATE' then new.updated_by_name else current_setting('app.user',true) end,'Unknown');
 insert into audit_logs(user_name,action,record_id,details) values(n,tg_op,r.id,
  case tg_op when 'INSERT' then format('%s added %s × %s (%s)',n,r.quantity,m,r.movement)
   when 'UPDATE' then format('%s changed #%s: quantity %s to %s, movement %s to %s',n,r.id,old.quantity,new.quantity,old.movement,new.movement)
   else format('%s deleted transaction #%s (%s × %s)',n,r.id,r.quantity,m) end);
 return r;end$$;
create trigger tx_a after insert or update or delete on inventory_transactions for each row execute function tx_audit();

create function delete_tx(tx_id bigint,who text) returns void language plpgsql security definer as $$
begin perform set_config('app.user',coalesce(who,'Unknown'),true);delete from inventory_transactions where id=tx_id;end$$;
grant execute on function delete_tx to anon,authenticated;

alter table locations enable row level security;alter table materials enable row level security;
alter table inventory_transactions enable row level security;alter table audit_logs enable row level security;
create policy l_all on locations for all to anon,authenticated using(true) with check(true);
create policy m_all on materials for all to anon,authenticated using(true) with check(true);
create policy t_sel on inventory_transactions for select to anon,authenticated using(true);
create policy t_ins on inventory_transactions for insert to anon,authenticated with check(true);
create policy t_upd on inventory_transactions for update to anon,authenticated using(true);
create policy a_sel on audit_logs for select to anon,authenticated using(true);
-- deletes only happen through delete_tx() so they are always logged

alter publication supabase_realtime add table inventory_transactions,materials,locations;

-- Demo data
insert into locations(location_name,type) values('Site','Site'),('Office','Office'),('Warehouse','Warehouse'),('Other','Other');
insert into materials(material_name,category) values('CCTV Camera','Cameras'),('LPR Camera','Cameras'),('Network Switch','Network'),('Power Supply','Electrical'),('Cable','Cable'),('LED Module','Signs'),('DMS','Signs'),('Fiber Optic Cable','Cable');
insert into inventory_transactions(material_id,quantity,movement,from_location,to_location,remarks,created_by_name,transaction_date)
select m.id,v.q,v.mv,f.id,t.id,v.r,'Demo',current_date-v.d from(values
('CCTV Camera',20,'Received',null,'Office','Initial stock',12),('LPR Camera',10,'Received',null,'Office','Initial stock',12),
('Network Switch',5,'Received',null,'Office','Initial stock',12),('Power Supply',15,'Received',null,'Office','Initial stock',12),
('Cable',500,'Received',null,'Warehouse','Initial stock',12),('LED Module',50,'Received',null,'Office','Initial stock',12),
('CCTV Camera',5,'Office → Site','Office','Site','Installation',5),('Network Switch',2,'Office → Site','Office','Site','Cabinet 3',4),
('Cable',100,'Issued','Warehouse',null,'Issued to site crew',3),('Network Switch',1,'Site → Office','Site','Office','Faulty unit',1),
('CCTV Camera',2,'Site → Office','Site','Office','Returned from site',1))v(mat,q,mv,fl,tl,r,d)
join materials m on m.material_name=v.mat left join locations f on f.location_name=v.fl left join locations t on t.location_name=v.tl;
