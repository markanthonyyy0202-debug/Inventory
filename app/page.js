'use client';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { Home, Boxes, Plus, History, Package, BarChart3, Users, Settings, ScrollText, Menu, LogOut, Share2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { sb } from '../lib/supabase';

const MOVES = ['Site → Store', 'Store → Site', 'Site → Warehouse', 'Warehouse → Site', 'Office → Site', 'Site → Office', 'Received', 'Issued', 'Returned', 'Adjustment'];
const NOFROM = ['Received', 'Returned', 'Adjustment'];
const today = () => new Date().toISOString().slice(0, 10);
const fmt = d => new Date(d + 'T00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');
const tm = s => new Date(s).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

function save(kind, name, head, body) {
  if (kind === 'pdf') { const d = new jsPDF({ orientation: 'landscape' }); d.text(name, 14, 12); autoTable(d, { head: [head], body, startY: 18, styles: { fontSize: 8 } }); return d.save(name + '.pdf'); }
  const ws = XLSX.utils.aoa_to_sheet([head, ...body]);
  if (kind === 'csv') { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([XLSX.utils.sheet_to_csv(ws)], { type: 'text/csv' })); a.download = name + '.csv'; return a.click(); }
  const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Data'); XLSX.writeFile(wb, name + '.xlsx');
}
const Exp = ({ name, head, body }) => (
  <div className="row">{['xlsx', 'csv', 'pdf'].map(k => <button key={k} className="btn sm alt" onClick={() => save(k, name, head, body)}>{k.toUpperCase()}</button>)}
    <button className="btn sm alt" onClick={() => window.print()}>Print</button></div>);
const Modal = ({ children }) => <div className="modal"><div className="card">{children}</div></div>;

export default function App() {
  const [name, setName] = useState(null);
  useEffect(() => { setName(localStorage.getItem('inv_name') || ''); }, []);
  const set = n => { localStorage.setItem('inv_name', n); setName(n); };
  if (name === null) return <div className="center">Loading…</div>;
  if (!name) return <NameForm onSet={set} />;
  return <Main name={name} setName={set} />;
}
function NameForm({ onSet }) {
  const [n, setN] = useState('');
  return <div className="center"><form className="card login" onSubmit={e => { e.preventDefault(); onSet(n.trim()); }}><h1>📦 Site Inventory</h1>
    <p>Enter your name so each entry shows who added it.</p><input placeholder="Your name" value={n} onChange={e => setN(e.target.value)} required /><button className="btn big">Continue</button></form></div>;
}

function Main({ name, setName }) {
  const [d, setD] = useState({ t: [], m: [], l: [], b: [] }), [v, setV] = useState('dash'), [open, setOpen] = useState(false), [form, setForm] = useState(null), [toast, setToast] = useState('');
  const load = useCallback(async () => {
    const [t, m, l, b] = await Promise.all([
      sb.from('inventory_transactions').select('*').order('transaction_date', { ascending: false }).order('id', { ascending: false }),
      sb.from('materials').select('*').order('material_name'), sb.from('locations').select('*').order('id'),
      sb.from('stock_balances').select('*')]);
    setD({ t: t.data || [], m: m.data || [], l: l.data || [], b: b.data || [] });
  }, []);
  useEffect(() => {
    load();
    const ch = sb.channel('live').on('postgres_changes', { event: '*', schema: 'public' }, () => load()).subscribe();
    return () => { sb.removeChannel(ch); };
  }, [load]);
  const admin = true;
  const M = useMemo(() => Object.fromEntries(d.m.map(x => [x.id, x])), [d.m]);
  const L = useMemo(() => Object.fromEntries(d.l.map(x => [x.id, x])), [d.l]);
  const rows = useMemo(() => d.t.map(r => ({ ...r, mat: M[r.material_id]?.material_name || '?', from: L[r.from_location]?.location_name || '—', to: L[r.to_location]?.location_name || '—', user: r.created_by_name || '—' })), [d.t, M, L]);
  const stock = useMemo(() => d.m.map(m => {
    const g = t => d.b.filter(x => x.material_id === m.id && (t === 'Other' ? !['Site', 'Office', 'Warehouse', 'Store'].includes(L[x.location_id]?.type) : L[x.location_id]?.type === t)).reduce((a, x) => a + Number(x.qty), 0);
    const o = { name: m.material_name, Site: g('Site'), Office: g('Office'), Warehouse: g('Warehouse'), Store: g('Store'), Other: g('Other') };
    return { ...o, total: o.Site + o.Office + o.Warehouse + o.Store + o.Other };
  }), [d.m, d.b, L]);
  const notify = t => { setToast(t); setTimeout(() => setToast(''), 3000); };
  const del = async r => { if (!confirm(`Delete transaction #${r.id} (${r.quantity} × ${r.mat})? This cannot be undone.`)) return; const { error } = await sb.rpc('delete_tx', { tx_id: r.id, who: name }); error ? alert(error.message) : notify('Record deleted.'); load(); };
  const nav = [['dash', 'Dashboard', Home], ['inv', 'Inventory', Boxes], ['add', 'Add Inventory', Plus], ['tx', 'Transactions', History], ['mat', 'Materials', Package], ['rep', 'Reports', BarChart3],
    ...(admin ? [['aud', 'Audit Log', ScrollText], ['set', 'Settings', Settings]] : [])];
  const share = () => { navigator.clipboard?.writeText(location.origin); notify('System link copied.'); };
  const P = { name, d, L, M, rows, stock, admin, onEdit: r => setForm(r), onDel: del, notify, load };
  return <>
    <div className="top"><button onClick={() => setOpen(!open)}><Menu /></button><b>Site Inventory</b>
      {admin && <button onClick={share} title="Share"><Share2 /></button>}<span style={{ fontSize: 13, cursor: 'pointer' }} title="Change name" onClick={() => { const n = prompt('Your name', name); if (n && n.trim()) setName(n.trim()); }}>{name}</span></div>
    <div className={'side' + (open ? ' open' : '')}>{nav.map(([k, n, I]) => <a key={k} className={v === k ? 'on' : ''} onClick={() => { k === 'add' ? setForm({}) : setV(k); setOpen(false); }}><I size={20} />{n}</a>)}</div>
    <main>
      {v === 'dash' && <Dash {...P} />}
      {v === 'inv' && <Tbl {...P} name="Inventory" />}
      {v === 'tx' && <Tbl {...P} hist name="Transactions" />}
      {v === 'mat' && <Mat {...P} />}
      {v === 'rep' && <Rep {...P} />}
      {v === 'aud' && admin && <Aud />}
      {v === 'set' && admin && <Set {...P} />}
    </main>
    <button className="btn big fab" onClick={() => setForm({})}>+ ADD INVENTORY</button>
    {form && <Form init={form} {...P} done={() => { setForm(null); load(); }} cancel={() => setForm(null)} />}
    {toast && <div className="toast">{toast}</div>}
  </>;
}

function Dash({ stock, rows }) {
  const S = k => stock.reduce((a, x) => a + x[k], 0);
  const cards = [['Total Inventory', S('total')], ['Site Inventory', S('Site')], ['Office Inventory', S('Office')], ['Warehouse Inventory', S('Warehouse')], ['Store Inventory', S('Store')]];
  return <>
    <div className="grid">{cards.map(([n, q]) => <div className="card" key={n}><small>{n}</small><h2>{q}</h2></div>)}</div>
    <div className="card"><h3>Recent Transactions</h3>
      <table><thead><tr><th>Date</th><th>Material</th><th>Qty</th><th>Movement</th><th>Location</th><th>Added By</th></tr></thead><tbody>
        {rows.slice(0, 8).map(r => <tr key={r.id}><td data-l="Date">{fmt(r.transaction_date)}</td><td data-l="Material">{r.mat}</td><td data-l="Qty">{r.quantity}</td><td data-l="Movement">{r.movement}</td><td data-l="Location">{r.to !== '—' ? r.to : r.from}</td><td data-l="By">{r.user}</td></tr>)}</tbody></table></div>
    <div className="card"><h3>Stock by Location</h3><StockTbl stock={stock} /></div></>;
}
const StockTbl = ({ stock }) => <table><thead><tr><th>Material</th><th>Site</th><th>Office</th><th>Warehouse</th><th>Store</th><th>Other</th><th>Total</th></tr></thead><tbody>
  {stock.map(s => <tr key={s.name}><td data-l="Material">{s.name}</td><td data-l="Site">{s.Site}</td><td data-l="Office">{s.Office}</td><td data-l="Warehouse">{s.Warehouse}</td><td data-l="Store">{s.Store}</td><td data-l="Other">{s.Other}</td><td data-l="Total"><b>{s.total}</b></td></tr>)}</tbody></table>;

function Tbl({ rows, hist, admin, onEdit, onDel, d, name }) {
  const [q, setQ] = useState(''), [f, setF] = useState({ mat: '', loc: '', user: '', mv: '', a: '', b: '' }), [so, setSo] = useState({ k: 'transaction_date', dir: -1 }), [pg, setPg] = useState(0), [sel, setSel] = useState(null);
  const cols = hist
    ? [['transaction_date', 'Date', r => fmt(r.transaction_date)], ['mat', 'Material'], ['quantity', 'Quantity'], ['from', 'From'], ['to', 'To'], ['user', 'User'], ['remarks', 'Remarks']]
    : [['transaction_date', 'Date', r => fmt(r.transaction_date)], ['mat', 'Material/Device'], ['quantity', 'Quantity'], ['movement', 'Movement'], ['to', 'Location', r => r.to !== '—' ? r.to : r.from], ['remarks', 'Remarks'], ['user', 'Added By'], ['created_at', 'Time', r => tm(r.created_at)]];
  const list = useMemo(() => {
    const t = q.toLowerCase();
    return rows.filter(r => (!t || [fmt(r.transaction_date), r.mat, r.from, r.to, r.user, r.remarks, r.movement].join(' ').toLowerCase().includes(t))
      && (!f.mat || r.mat === f.mat) && (!f.loc || r.from === f.loc || r.to === f.loc) && (!f.user || r.user === f.user) && (!f.mv || r.movement === f.mv)
      && (!f.a || r.transaction_date >= f.a) && (!f.b || r.transaction_date <= f.b))
      .sort((x, y) => (x[so.k] > y[so.k] ? 1 : x[so.k] < y[so.k] ? -1 : 0) * so.dir);
  }, [rows, q, f, so]);
  const pages = Math.max(1, Math.ceil(list.length / 10)), cur = list.slice(pg * 10, pg * 10 + 10);
  const sf = (k, v) => { setF({ ...f, [k]: v }); setPg(0); };
  const users = [...new Set(rows.map(r => r.user))];
  return <div className="card"><h3>{name}</h3>
    <input placeholder="🔍 Search material, date, location, user, remarks…" value={q} onChange={e => { setQ(e.target.value); setPg(0); }} />
    <div className="row" style={{ marginTop: 8 }}>
      <select value={f.mat} onChange={e => sf('mat', e.target.value)}><option value="">All materials</option>{d.m.map(m => <option key={m.id}>{m.material_name}</option>)}</select>
      <select value={f.loc} onChange={e => sf('loc', e.target.value)}><option value="">All locations</option>{d.l.map(m => <option key={m.id}>{m.location_name}</option>)}</select>
      <select value={f.mv} onChange={e => sf('mv', e.target.value)}><option value="">All movements</option>{MOVES.map(m => <option key={m}>{m}</option>)}</select>
      <select value={f.user} onChange={e => sf('user', e.target.value)}><option value="">All users</option>{users.map(u => <option key={u}>{u}</option>)}</select>
      <input type="date" value={f.a} onChange={e => sf('a', e.target.value)} /><input type="date" value={f.b} onChange={e => sf('b', e.target.value)} /></div>
    <Exp name={name} head={cols.map(c => c[1])} body={list.map(r => cols.map(c => c[2] ? c[2](r) : r[c[0]] ?? ''))} />
    <table><thead><tr>{cols.map(c => <th key={c[0]} onClick={() => setSo({ k: c[0], dir: so.k === c[0] ? -so.dir : 1 })}>{c[1]}{so.k === c[0] ? (so.dir > 0 ? ' ▲' : ' ▼') : ''}</th>)}</tr></thead>
      <tbody>{cur.map(r => <tr key={r.id} className="click" onClick={() => setSel(r)}>{cols.map(c => <td key={c[0]} data-l={c[1]}>{c[2] ? c[2](r) : r[c[0]]}</td>)}</tr>)}</tbody></table>
    {!cur.length && <p>No records found.</p>}
    <div className="pg"><button className="btn sm alt" disabled={pg === 0} onClick={() => setPg(pg - 1)}>◀ Prev</button><span>Page {pg + 1} / {pages} · {list.length} records</span><button className="btn sm alt" disabled={pg + 1 >= pages} onClick={() => setPg(pg + 1)}>Next ▶</button></div>
    {sel && <Modal><h3>Transaction #{sel.id}</h3>
      {[['Date', fmt(sel.transaction_date)], ['Material', sel.mat], ['Quantity', sel.quantity], ['Movement', sel.movement], ['From', sel.from], ['To', sel.to], ['Remarks', sel.remarks || '—'], ['Added by', sel.user], ['Added', new Date(sel.created_at).toLocaleString()], ['Last updated', new Date(sel.updated_at).toLocaleString()]].map(([k, x]) => <p key={k}><b>{k}:</b> {x}</p>)}
      <div className="row"><button className="btn" onClick={() => { onEdit(sel); setSel(null); }}>Edit</button>{admin && <button className="btn red" onClick={() => { onDel(sel); setSel(null); }}>Delete</button>}<button className="btn alt" onClick={() => setSel(null)}>Close</button></div></Modal>}
  </div>;
}

function Form({ init, d, done, cancel, notify, name }) {
  const [f, setF] = useState({ transaction_date: today(), mat: '', quantity: '', movement: MOVES[0], from_location: '', to_location: '', remarks: '', ...init }), [busy, setBusy] = useState(false), [err, setErr] = useState('');
  const set = (k, v) => setF(x => ({ ...x, [k]: v }));
  const tl = t => d.l.find(x => x.type === t && x.active)?.id || '';
  const needFrom = !NOFROM.includes(f.movement), needTo = f.movement !== 'Issued';
  const pick = mv => { const [a, b] = mv.includes('→') ? mv.split(' → ') : []; setF(x => ({ ...x, movement: mv, from_location: a ? tl(a) : mv === 'Issued' ? x.from_location : '', to_location: b ? tl(b) : NOFROM.includes(mv) ? x.to_location : '' })); };
  const go = async e => {
    e.preventDefault(); setErr(''); const q = Number(f.quantity);
    if (!f.mat.trim()) return setErr('Select or type a material.');
    if (f.movement !== 'Adjustment' && q <= 0) return setErr('Quantity must be greater than 0.');
    if ((needFrom && !f.from_location) || (needTo && !f.to_location)) return setErr('Select the location(s).');
    if (needFrom && needTo && f.from_location == f.to_location) return setErr('From and To must be different.');
    setBusy(true);
    let m = d.m.find(x => x.material_name.toLowerCase() === f.mat.trim().toLowerCase());
    if (!m) { const { data, error } = await sb.from('materials').insert({ material_name: f.mat.trim() }).select().single(); if (error) { setBusy(false); return setErr(error.message); } m = data; }
    if (needFrom && !f.id) { const bal = Number(d.b.find(x => x.material_id === m.id && x.location_id == f.from_location)?.qty || 0); if (bal < q && !confirm(`Only ${bal} available at the source location. Continue anyway?`)) return setBusy(false); }
    const row = { transaction_date: f.transaction_date, material_id: m.id, quantity: q, movement: f.movement, from_location: needFrom ? +f.from_location : null, to_location: needTo ? +f.to_location : null, remarks: f.remarks || null, updated_by_name: name };
    const { error } = f.id ? await sb.from('inventory_transactions').update(row).eq('id', f.id) : await sb.from('inventory_transactions').insert({ ...row, created_by_name: name });
    setBusy(false); if (error) return setErr(error.message);
    notify(f.id ? 'Inventory updated.' : 'Inventory successfully added.'); done();
  };
  const Sel = ({ k, label }) => <><label>{label}</label><select value={f[k]} onChange={e => set(k, e.target.value)} required><option value="">Select…</option>{d.l.filter(x => x.active || x.id == f[k]).map(x => <option key={x.id} value={x.id}>{x.location_name}</option>)}</select></>;
  return <Modal><form onSubmit={go}><h3>{f.id ? `Edit #${f.id}` : 'Add Inventory'}</h3>
    <label>Date</label><input type="date" value={f.transaction_date} onChange={e => set('transaction_date', e.target.value)} required />
    <label>Material / Device (search or type a new one)</label><input list="ml" value={f.mat} onChange={e => set('mat', e.target.value)} placeholder="e.g. CCTV Camera" required />
    <datalist id="ml">{d.m.filter(x => x.active).map(x => <option key={x.id} value={x.material_name} />)}</datalist>
    <label>Quantity</label><input type="number" inputMode="decimal" step="any" value={f.quantity} onChange={e => set('quantity', e.target.value)} required />
    <label>Movement</label><select value={f.movement} onChange={e => pick(e.target.value)}>{MOVES.map(m => <option key={m}>{m}</option>)}</select>
    {needFrom && <Sel k="from_location" label={needTo ? 'From location' : 'Location'} />}{needTo && <Sel k="to_location" label={needFrom ? 'To location' : 'Location'} />}
    <label>Remarks</label><textarea rows={2} value={f.remarks || ''} onChange={e => set('remarks', e.target.value)} />
    {err && <p className="msg">{err}</p>}
    <div className="row" style={{ marginTop: 12 }}><button className="btn big" disabled={busy}>{f.id ? 'SAVE CHANGES' : 'ADD INVENTORY'}</button><button type="button" className="btn alt big" onClick={cancel}>Cancel</button></div></form></Modal>;
}

function Mat({ d, load, admin, notify }) {
  const [n, setN] = useState(''), [c, setC] = useState(''), [u, setU] = useState('pcs'), [q, setQ] = useState('');
  const add = async e => { e.preventDefault(); const { error } = await sb.from('materials').insert({ material_name: n.trim(), category: c || null, unit: u || 'pcs' }); error ? alert(error.message) : (setN(''), setC(''), notify('Material added.'), load()); };
  const tog = async m => { await sb.from('materials').update({ active: !m.active }).eq('id', m.id); load(); };
  return <div className="card"><h3>Materials</h3>
    <form className="row" onSubmit={add}><input placeholder="Material name" value={n} onChange={e => setN(e.target.value)} required /><input placeholder="Category" value={c} onChange={e => setC(e.target.value)} /><input placeholder="Unit" value={u} onChange={e => setU(e.target.value)} /><button className="btn">Add</button></form>
    <input placeholder="🔍 Search materials" value={q} onChange={e => setQ(e.target.value)} />
    <table><thead><tr><th>Material</th><th>Category</th><th>Unit</th>{admin && <th>Active</th>}</tr></thead><tbody>
      {d.m.filter(m => (m.material_name + (m.category || '')).toLowerCase().includes(q.toLowerCase())).map(m => <tr key={m.id}><td data-l="Material">{m.material_name}</td><td data-l="Category">{m.category}</td><td data-l="Unit">{m.unit}</td>{admin && <td><button className="btn sm alt" onClick={() => tog(m)}>{m.active ? 'Active — disable' : 'Disabled — enable'}</button></td>}</tr>)}</tbody></table></div>;
}

function Rep({ rows, d, stock }) {
  const [k, setK] = useState('daily'), [dt, setDt] = useState(today()), [mo, setMo] = useState(today().slice(0, 7)), [mid, setMid] = useState('');
  let out = rows;
  if (k === 'daily') out = rows.filter(r => r.transaction_date === dt);
  if (k === 'weekly') { const e = new Date(new Date(dt).getTime() + 6 * 864e5).toISOString().slice(0, 10); out = rows.filter(r => r.transaction_date >= dt && r.transaction_date <= e); }
  if (k === 'monthly') out = rows.filter(r => r.transaction_date.startsWith(mo));
  if (k === 'material') out = rows.filter(r => String(r.material_id) === mid);
  const stk = k === 'stock';
  const head = stk ? ['Material', 'Site', 'Office', 'Warehouse', 'Store', 'Other', 'Total'] : ['Date', 'Material', 'Qty', 'Movement', 'From', 'To', 'User', 'Remarks'];
  const body = stk ? stock.map(s => [s.name, s.Site, s.Office, s.Warehouse, s.Store, s.Other, s.total]) : out.map(r => [fmt(r.transaction_date), r.mat, r.quantity, r.movement, r.from, r.to, r.user, r.remarks || '']);
  return <div className="card"><h3>Reports</h3>
    <div className="row"><select value={k} onChange={e => setK(e.target.value)}><option value="daily">Daily</option><option value="weekly">Weekly (7 days from date)</option><option value="monthly">Monthly</option><option value="material">Material</option><option value="stock">Site vs Office (current)</option></select>
      {(k === 'daily' || k === 'weekly') && <input type="date" value={dt} onChange={e => setDt(e.target.value)} />}
      {k === 'monthly' && <input type="month" value={mo} onChange={e => setMo(e.target.value)} />}
      {k === 'material' && <select value={mid} onChange={e => setMid(e.target.value)}><option value="">Select material…</option>{d.m.map(m => <option key={m.id} value={m.id}>{m.material_name}</option>)}</select>}</div>
    <Exp name={'Report-' + k} head={head} body={body} />
    <table><thead><tr>{head.map(h => <th key={h}>{h}</th>)}</tr></thead><tbody>{body.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} data-l={head[j]}>{c}</td>)}</tr>)}</tbody></table>
    {!body.length && <p>No records for this selection.</p>}</div>;
}

function Aud() {
  const [a, setA] = useState([]);
  useEffect(() => { sb.from('audit_logs').select('*').order('id', { ascending: false }).limit(200).then(({ data }) => setA(data || [])); }, []);
  return <div className="card"><h3>Audit Log</h3><table><thead><tr><th>Date</th><th>Time</th><th>User</th><th>Action</th><th>Record</th><th>Details</th></tr></thead><tbody>
    {a.map(x => <tr key={x.id}><td data-l="Date">{new Date(x.created_at).toLocaleDateString()}</td><td data-l="Time">{tm(x.created_at)}</td><td data-l="User">{x.user_name}</td><td data-l="Action">{x.action}</td><td data-l="Record">#{x.record_id}</td><td data-l="Details">{x.details}</td></tr>)}</tbody></table></div>;
}

function Set({ d, load, notify }) {
  const [n, setN] = useState(''), [t, setT] = useState('Site');
  const add = async e => { e.preventDefault(); const { error } = await sb.from('locations').insert({ location_name: n.trim(), type: t }); error ? alert(error.message) : (setN(''), load()); };
  const url = typeof location !== 'undefined' ? location.origin : '';
  return <><div className="card"><h3>Share System</h3><p>{url}</p><div className="row">
    <button className="btn" onClick={() => { navigator.clipboard?.writeText(url); notify('System link copied.'); }}>Copy link</button>
    <a className="btn" style={{ textAlign: 'center', textDecoration: 'none' }} target="_blank" href={'https://wa.me/?text=' + encodeURIComponent('Please use this link to update the site inventory:\n' + url)}>Share via WhatsApp</a></div></div>
    <div className="card"><h3>Locations</h3><form className="row" onSubmit={add}><input placeholder="Location name" value={n} onChange={e => setN(e.target.value)} required />
      <select value={t} onChange={e => setT(e.target.value)}>{['Site', 'Office', 'Warehouse', 'Store', 'Other'].map(x => <option key={x}>{x}</option>)}</select><button className="btn">Add</button></form>
      <table><thead><tr><th>Name</th><th>Type</th><th>Status</th></tr></thead><tbody>{d.l.map(l => <tr key={l.id}><td data-l="Name">{l.location_name}</td><td data-l="Type">{l.type}</td>
        <td><button className="btn sm alt" onClick={async () => { await sb.from('locations').update({ active: !l.active }).eq('id', l.id); load(); }}>{l.active ? 'Active — disable' : 'Disabled — enable'}</button></td></tr>)}</tbody></table></div></>;
}
