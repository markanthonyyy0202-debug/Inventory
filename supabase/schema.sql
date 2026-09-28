-- Run this whole file in Supabase > SQL Editor. It rebuilds the tables (old records are deleted).
drop trigger if exists on_auth_user on auth.users;
drop function if exists handle_new_user(), my_role() cascade;
drop view if exists stock_balances;
drop table if exists audit_logs, inventory_transactions, materials, locations, profiles cascade;

create table materials(id serial primary key,material_name text unique not null,active boolean default true);
create table inventory_transactions(
 id bigserial primary key,transaction_date date not null default current_date,
 material_id int not null references materials,quantity numeric not null check(quantity>0),
 work_order text,location text,status text not null default 'Released' check(status in('Released','Defective')),
 remarks text,created_by_name text,updated_by_name text,
 created_at timestamptz default now(),updated_at timestamptz default now());
create table audit_logs(id bigserial primary key,user_name text,action text,record_id bigint,details text,created_at timestamptz default now());
create index on inventory_transactions(material_id);create index on inventory_transactions(transaction_date);create index on audit_logs(created_at);

create function tx_before() returns trigger language plpgsql as $$
begin if tg_op='UPDATE' then new.created_by_name:=old.created_by_name;new.created_at:=old.created_at;new.updated_at:=now();end if;return new;end$$;
create trigger tx_b before insert or update on inventory_transactions for each row execute function tx_before();

create function tx_audit() returns trigger language plpgsql security definer as $$
declare n text;m text;r inventory_transactions;
begin r:=case when tg_op='DELETE' then old else new end;
 select material_name into m from materials where id=r.material_id;
 n:=coalesce(case tg_op when 'INSERT' then new.created_by_name when 'UPDATE' then new.updated_by_name else current_setting('app.user',true) end,'Unknown');
 insert into audit_logs(user_name,action,record_id,details) values(n,tg_op,r.id,
  case tg_op when 'INSERT' then format('%s added %s × %s (WO %s, %s)',n,r.quantity,m,coalesce(r.work_order,'-'),r.status)
   when 'UPDATE' then format('%s changed #%s: quantity %s to %s, status %s to %s',n,r.id,old.quantity,new.quantity,old.status,new.status)
   else format('%s deleted #%s (%s × %s)',n,r.id,r.quantity,m) end);
 return r;end$$;
create trigger tx_a after insert or update or delete on inventory_transactions for each row execute function tx_audit();

create function delete_tx(tx_id bigint,who text) returns void language plpgsql security definer as $$
begin perform set_config('app.user',coalesce(who,'Unknown'),true);delete from inventory_transactions where id=tx_id;end$$;
grant execute on function delete_tx to anon,authenticated;

alter table materials enable row level security;alter table inventory_transactions enable row level security;alter table audit_logs enable row level security;
create policy m_all on materials for all to anon,authenticated using(true) with check(true);
create policy t_sel on inventory_transactions for select to anon,authenticated using(true);
create policy t_ins on inventory_transactions for insert to anon,authenticated with check(true);
create policy t_upd on inventory_transactions for update to anon,authenticated using(true);
create policy a_sel on audit_logs for select to anon,authenticated using(true);

alter publication supabase_realtime add table inventory_transactions,materials;

insert into materials(material_name) values('CCTV CAMERA'),('LPR CAMERA'),('LCS'),('MDS'),('AGD/RVD/WIM'),('OVDS'),('OTHERS');
