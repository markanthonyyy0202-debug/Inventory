'use client';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { Home, Boxes, Plus, BarChart3, Settings, ScrollText, Menu, Share2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { sb } from '../lib/supabase';

const STATUS = ['Released', 'Defective'];
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
  const [d, setD] = useState({ t: [], m: [] }), [v, setV] = useState('dash'), [open, setOpen] = useState(false), [form, setForm] = useState(null), [toast, setToast] = useState('');
  const load = useCallback(async () => {
    const [t, m] = await Promise.all([
      sb.from('inventory_transactions').select('*').order('transaction_date', { ascending: false }).order('id', { ascending: false }),
      sb.from('materials').select('*').order('id')]);
    setD({ t: t.data || [], m: m.data || [] });
  }, []);
  useEffect(() => {
    load();
    const ch = sb.channel('live').on('postgres_changes', { event: '*', schema: 'public' }, () => load()).subscribe();
    return () => { sb.removeChannel(ch); };
  }, [load]);
  const M = useMemo(() => Object.fromEntries(d.m.map(x => [x.id, x])), [d.m]);
  const rows = useMemo(() => d.t.map(r => ({ ...r, mat: M[r.material_id]?.material_name || '?', user: r.created_by_name || '—' })), [d.t, M]);
  const stock = useMemo(() => d.m.map(m => {
    const x = d.t.filter(r => r.material_id === m.id), g = s => x.filter(r => r.status === s).reduce((a, r) => a + Number(r.quantity), 0);
    return { name: m.material_name, Released: g('Released'), Defective: g('Defective'), total: g('Released') + g('Defective') };
  }), [d.m, d.t]);
  const notify = t => { setToast(t); setTimeout(() => setToast(''), 3000); };
  const del = async r => { if (!confirm(`Delete record #${r.id} (${r.quantity} × ${r.mat})? This cannot be undone.`)) return; const { error } = await sb.rpc('delete_tx', { tx_id: r.id, who: name }); error ? alert(error.message) : notify('Record deleted.'); load(); };
  const nav = [['dash', 'Dashboard', Home], ['inv', 'Inventory', Boxes], ['add', 'Add Inventory', Plus], ['rep', 'Reports', BarChart3], ['aud', 'Audit Log', ScrollText], ['set', 'Share', Settings]];
  const share = () => { navigator.clipboard?.writeText(location.origin); notify('System link copied.'); };
  const P = { name, d, M, rows, stock, notify, load, onEdit: r => setForm(r), onDel: del };
  return <>
    <div className="top"><button onClick={() => setOpen(!open)}><Menu /></button><b>Site Inventory</b>
      <button onClick={share} title="Share"><Share2 /></button>
      <span style={{ fontSize: 13, cursor: 'pointer' }} title="Change name" onClick={() => { const n = prompt('Your name', name); if (n && n.trim()) setName(n.trim()); }}>{name}</span></div>
    <div className={'side' + (open ? ' open' : '')}>{nav.map(([k, n, I]) => <a key={k} className={v === k ? 'on' : ''} onClick={() => { k === 'add' ? setForm({}) : setV(k); setOpen(false); }}><I size={20} />{n}</a>)}</div>
    <main>
      {v === 'dash' && <Dash {...P} />}
      {v === 'inv' && <Tbl {...P} />}
      {v === 'rep' && <Rep {...P} />}
      {v === 'aud' && <Aud />}
      {v === 'set' && <Share {...P} />}
    </main>
    <button className="btn big fab" onClick={() => setForm({})}>+ ADD INVENTORY</button>
    {form && <Form init={form} {...P} done={() => { setForm(null); load(); }} cancel={() => setForm(null)} />}
    {toast && <div className="toast">{toast}</div>}
  </>;
}

const COLS = [['transaction_date', 'Date', r => fmt(r.transaction_date)], ['mat', 'Material'], ['quantity', 'Qty'], ['work_order', 'Work Order'], ['location', 'Location'], ['status', 'Status'], ['remarks', 'Remarks'], ['user', 'Added By'], ['created_at', 'Time', r => tm(r.created_at)]];

function Dash({ stock, rows }) {
  const S = k => stock.reduce((a, x) => a + x[k], 0);
  return <>
    <div className="grid">{[['Total Quantity', S('total')], ['Released', S('Released')], ['Defective', S('Defective')]].map(([n, q]) => <div className="card" key={n}><small>{n}</small><h2>{q}</h2></div>)}</div>
    <div className="card"><h3>Recent Records</h3><Table cols={COLS.slice(0, 6).concat([COLS[7]])} rows={rows.slice(0, 8)} /></div>
    <div className="card"><h3>By Material</h3><table><thead><tr><th>Material</th><th>Released</th><th>Defective</th><th>Total</th></tr></thead><tbody>
      {stock.map(s => <tr key={s.name}><td data-l="Material">{s.name}</td><td data-l="Released">{s.Released}</td><td data-l="Defective">{s.Defective}</td><td data-l="Total"><b>{s.total}</b></td></tr>)}</tbody></table></div></>;
}
const Table = ({ cols, rows, onRow }) => <table><thead><tr>{cols.map(c => <th key={c[0]}>{c[1]}</th>)}</tr></thead><tbody>
  {rows.map(r => <tr key={r.id} className={onRow ? 'click' : ''} onClick={() => onRow && onRow(r)}>{cols.map(c => <td key={c[0]} data-l={c[1]}>{c[2] ? c[2](r) : r[c[0]]}</td>)}</tr>)}</tbody></table>;

function Tbl({ rows, onEdit, onDel, d }) {
  const [q, setQ] = useState(''), [f, setF] = useState({ mat: '', st: '', user: '', a: '', b: '' }), [so, setSo] = useState({ k: 'transaction_date', dir: -1 }), [pg, setPg] = useState(0), [sel, setSel] = useState(null);
  const list = useMemo(() => {
    const t = q.toLowerCase();
    return rows.filter(r => (!t || [fmt(r.transaction_date), r.mat, r.work_order, r.location, r.status, r.user, r.remarks].join(' ').toLowerCase().includes(t))
      && (!f.mat || r.mat === f.mat) && (!f.st || r.status === f.st) && (!f.user || r.user === f.user) && (!f.a || r.transaction_date >= f.a) && (!f.b || r.transaction_date <= f.b))
      .sort((x, y) => (x[so.k] > y[so.k] ? 1 : x[so.k] < y[so.k] ? -1 : 0) * so.dir);
  }, [rows, q, f, so]);
  const pages = Math.max(1, Math.ceil(list.length / 10)), cur = list.slice(pg * 10, pg * 10 + 10), sf = (k, x) => { setF({ ...f, [k]: x }); setPg(0); };
  return <div className="card"><h3>Inventory</h3>
    <input placeholder="🔍 Search material, work order, location, status, user…" value={q} onChange={e => { setQ(e.target.value); setPg(0); }} />
    <div className="row" style={{ marginTop: 8 }}>
      <select value={f.mat} onChange={e => sf('mat', e.target.value)}><option value="">All materials</option>{d.m.map(m => <option key={m.id}>{m.material_name}</option>)}</select>
      <select value={f.st} onChange={e => sf('st', e.target.value)}><option value="">All status</option>{STATUS.map(m => <option key={m}>{m}</option>)}</select>
      <select value={f.user} onChange={e => sf('user', e.target.value)}><option value="">All users</option>{[...new Set(rows.map(r => r.user))].map(u => <option key={u}>{u}</option>)}</select>
      <input type="date" value={f.a} onChange={e => sf('a', e.target.value)} /><input type="date" value={f.b} onChange={e => sf('b', e.target.value)} /></div>
    <Exp name="Inventory" head={COLS.map(c => c[1])} body={list.map(r => COLS.map(c => c[2] ? c[2](r) : r[c[0]] ?? ''))} />
    <table><thead><tr>{COLS.map(c => <th key={c[0]} onClick={() => setSo({ k: c[0], dir: so.k === c[0] ? -so.dir : 1 })}>{c[1]}{so.k === c[0] ? (so.dir > 0 ? ' ▲' : ' ▼') : ''}</th>)}</tr></thead>
      <tbody>{cur.map(r => <tr key={r.id} className="click" onClick={() => setSel(r)}>{COLS.map(c => <td key={c[0]} data-l={c[1]}>{c[2] ? c[2](r) : r[c[0]]}</td>)}</tr>)}</tbody></table>
    {!cur.length && <p>No records found.</p>}
    <div className="pg"><button className="btn sm alt" disabled={pg === 0} onClick={() => setPg(pg - 1)}>◀ Prev</button><span>Page {pg + 1} / {pages} · {list.length} records</span><button className="btn sm alt" disabled={pg + 1 >= pages} onClick={() => setPg(pg + 1)}>Next ▶</button></div>
    {sel && <Modal><h3>Record #{sel.id}</h3>
      {[['Date', fmt(sel.transaction_date)], ['Material', sel.mat], ['Quantity', sel.quantity], ['Work Order', sel.work_order || '—'], ['Location', sel.location || '—'], ['Status', sel.status], ['Remarks', sel.remarks || '—'], ['Added by', sel.user], ['Added', new Date(sel.created_at).toLocaleString()], ['Last updated', new Date(sel.updated_at).toLocaleString()]].map(([k, x]) => <p key={k}><b>{k}:</b> {x}</p>)}
      <div className="row"><button className="btn" onClick={() => { onEdit(sel); setSel(null); }}>Edit</button><button className="btn red" onClick={() => { onDel(sel); setSel(null); }}>Delete</button><button className="btn alt" onClick={() => setSel(null)}>Close</button></div></Modal>}
  </div>;
}

function Form({ init, d, done, cancel, notify, name }) {
  const [f, setF] = useState({ transaction_date: today(), material_id: '', quantity: '', work_order: '', location: '', status: 'Released', remarks: '', ...init }), [busy, setBusy] = useState(false), [err, setErr] = useState('');
  const set = (k, v) => setF(x => ({ ...x, [k]: v }));
  const go = async e => {
    e.preventDefault(); setErr(''); const q = Number(f.quantity);
    if (!f.material_id) return setErr('Select a material.');
    if (!(q > 0)) return setErr('Quantity must be greater than 0.');
    setBusy(true);
    const row = { transaction_date: f.transaction_date, material_id: +f.material_id, quantity: q, work_order: f.work_order?.trim() || null, location: f.location.trim(), status: f.status, remarks: f.remarks || null, updated_by_name: name };
    const { error } = f.id ? await sb.from('inventory_transactions').update(row).eq('id', f.id) : await sb.from('inventory_transactions').insert({ ...row, created_by_name: name });
    setBusy(false); if (error) return setErr(error.message);
    notify(f.id ? 'Inventory updated.' : 'Inventory successfully added.'); done();
  };
  return <Modal><form onSubmit={go}><h3>{f.id ? `Edit #${f.id}` : 'Add Inventory'}</h3>
    <label>Date</label><input type="date" value={f.transaction_date} onChange={e => set('transaction_date', e.target.value)} required />
    <label>Materials</label><select value={f.material_id} onChange={e => set('material_id', e.target.value)} required><option value="">Select…</option>{d.m.map(m => <option key={m.id} value={m.id}>{m.material_name}</option>)}</select>
    <label>Quantity</label><input type="number" inputMode="decimal" step="any" value={f.quantity} onChange={e => set('quantity', e.target.value)} required />
    <label>Work Order</label><input value={f.work_order || ''} onChange={e => set('work_order', e.target.value)} />
    <label>Location</label><input value={f.location || ''} onChange={e => set('location', e.target.value)} placeholder="Type the location" required />
    <label>Status</label><select value={f.status} onChange={e => set('status', e.target.value)}>{STATUS.map(s => <option key={s}>{s}</option>)}</select>
    <label>Remarks</label><textarea rows={2} value={f.remarks || ''} onChange={e => set('remarks', e.target.value)} />
    {err && <p className="msg">{err}</p>}
    <div className="row" style={{ marginTop: 12 }}><button className="btn big" disabled={busy}>{f.id ? 'SAVE CHANGES' : 'ADD INVENTORY'}</button><button type="button" className="btn alt big" onClick={cancel}>Cancel</button></div></form></Modal>;
}

function Rep({ rows, d, stock }) {
  const [k, setK] = useState('daily'), [dt, setDt] = useState(today()), [mo, setMo] = useState(today().slice(0, 7)), [mid, setMid] = useState('');
  let out = rows;
  if (k === 'daily') out = rows.filter(r => r.transaction_date === dt);
  if (k === 'weekly') { const e = new Date(new Date(dt).getTime() + 6 * 864e5).toISOString().slice(0, 10); out = rows.filter(r => r.transaction_date >= dt && r.transaction_date <= e); }
  if (k === 'monthly') out = rows.filter(r => r.transaction_date.startsWith(mo));
  if (k === 'material') out = rows.filter(r => String(r.material_id) === mid);
  const sm = k === 'summary';
  const head = sm ? ['Material', 'Released', 'Defective', 'Total'] : ['Date', 'Material', 'Qty', 'Work Order', 'Location', 'Status', 'User', 'Remarks'];
  const body = sm ? stock.map(s => [s.name, s.Released, s.Defective, s.total]) : out.map(r => [fmt(r.transaction_date), r.mat, r.quantity, r.work_order || '', r.location || '', r.status, r.user, r.remarks || '']);
  return <div className="card"><h3>Reports</h3>
    <div className="row"><select value={k} onChange={e => setK(e.target.value)}><option value="daily">Daily</option><option value="weekly">Weekly (7 days from date)</option><option value="monthly">Monthly</option><option value="material">Material</option><option value="summary">Summary by material</option></select>
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
  return <div className="card"><h3>Audit Log</h3><table><thead><tr><th>Date</th><th>Time</th><th>User</th><th>Action</th><th>Details</th></tr></thead><tbody>
    {a.map(x => <tr key={x.id}><td data-l="Date">{new Date(x.created_at).toLocaleDateString()}</td><td data-l="Time">{tm(x.created_at)}</td><td data-l="User">{x.user_name}</td><td data-l="Action">{x.action}</td><td data-l="Details">{x.details}</td></tr>)}</tbody></table></div>;
}

function Share({ notify }) {
  const url = typeof location !== 'undefined' ? location.origin : '';
  return <div className="card"><h3>Share System</h3><p>{url}</p><div className="row">
    <button className="btn" onClick={() => { navigator.clipboard?.writeText(url); notify('System link copied.'); }}>Copy link</button>
    <a className="btn" style={{ textAlign: 'center', textDecoration: 'none' }} target="_blank" href={'https://wa.me/?text=' + encodeURIComponent('Please use this link to update the site inventory:\n' + url)}>Share via WhatsApp</a></div></div>;
}
