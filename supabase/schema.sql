-- Run this in Supabase: SQL Editor > New query > Run. Safe to run again.
create table if not exists action_categories (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  sort int not null default 0,
  actions text[] not null default '{}',
  created_at timestamptz default now()
);
create table if not exists rcas (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  created_at timestamptz default now()
);
create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  created_by uuid default auth.uid(),
  location text, report_date date, work_order text, reported_by text,
  reported_fault text, finding text, actions text[], rca text,
  status text, remarks text, report_text text
);

alter table action_categories enable row level security;
alter table rcas enable row level security;
alter table reports enable row level security;

-- No login: anyone with the app link can use the data
drop policy if exists "cats all" on action_categories;
drop policy if exists "rcas all" on rcas;
drop policy if exists "reports read" on reports;
drop policy if exists "reports insert" on reports;
create policy "cats all" on action_categories for all to anon, authenticated using (true) with check (true);
create policy "rcas all" on rcas for all to anon, authenticated using (true) with check (true);
create policy "reports read" on reports for select to anon, authenticated using (true);
create policy "reports insert" on reports for insert to anon, authenticated with check (true);

insert into action_categories (name, sort, actions) values
('AESYS', 1, '{}'),
('TELEGRA', 2, array[
'Check the message currently displayed onsite',
'Check DMS controller communication and alarm status',
'Test network connectivity/communication to the device',
'Check switch port status and link/activity LEDs',
'Check LED module status',
'Check CAN Interface status',
'Check and test block terminal',
'Reterminate CAT6 cable from CAN interface',
'Reterminate CAT6 cable from Block Terminal',
'Replace defective LED module and install new unit',
'Replace defective CAN Interface and install new unit',
'Replace defective LED Module power cable and install new unit',
'Replace defective OVPS Modular sign and install new unit',
'Replace defective LCS Controller sign and install new unit',
'Replace defective DMS Controller sign and install new unit',
'Replace defective LCD Screen Controller and install new unit',
'Replace defective photocell sensor and install new unit',
'Replace defective LAN cable and install new unit',
'Reseat/reconnect the cable or restart the affected equipment if required',
'Confirm the asset returns online and remains stable',
'Identify the affected LED module/section from the display or controller diagnostics',
'Check module power cable supply and voltage',
'Inspect module power/data cables and connectors',
'Check controller/data output to the module',
'Reseat the module and connectors',
'Test with a known-good cable/module where available to isolate the faulty component',
'Run display test and verify module operation',
'Reconfigure DMS and controller',
'Inspect LED modules, power connections, and data/ribbon cables',
'Inspect equipment status, power supply and physical condition',
'Check relevant cables, connectors and communication/network links',
'Review alarms, logs or diagnostic indications for the reported fault',
'Perform a controlled restart/reboot or reseat connection where applicable',
'Test the equipment after corrective action and confirm normal operation',
'Check ventilation and cabinet temperature',
'Check RGB/data output and LED module configuration',
'Inspect connectors for loose, damaged or oxidized contacts',
're-terminate and re-punch the power cable from the OVPS modular sign from junction box of DMS',
're-terminate and re-punch the CAT6 cable wire from the OVPS modular sign from junction box of DMS'
]),
('CCTV', 3, '{}')
on conflict (name) do nothing;
insert into rcas (name) values ('Communication Issue'),('RGB Issue'),('POE Not Working') on conflict (name) do nothing;
