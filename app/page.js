'use client';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { Home, Boxes, Plus, BarChart3, Settings, ScrollText, Menu, Share2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { sb } from '../lib/supabase';

const STATUS = ['Released', 'Defective'];
const DESC = ["AXIS Q6325-LE PTZ", "Autodome 7100I camera with IR Part no: NDP-7802-Z40L", "MIC 7100i PTZ Starlight camera", "Repaired CCTV", "Buble house (bosch)", "POE Midspan BOSCH", "BOSCH NETWORK CARD", "Autodome 7100I Pipe mount Part no: NDA-7100-PIPE", "15 MTR CCTV POLE", "6 MTR RADAR POLE", "8 MTR RADAR POLE", "HOV-32K1A-ALU-300MM-120/230VAC (IW1-TS1-085)", "WCM3A-CELLING BRACKET(IW1-TS1-086)", "ARH LPR", "ARH Power supply", "phonex pwr supply", "Microsemi POE pd9501", "Tattile LPR", "TrafiBot HD", "LED mod 24x12 27.78mm RGB | P.N 3951161 (RF-003)", "LED Module 30x15 -22.23mm | P.N 3951166 (RF-003)", "LED MODULE/ P.N 3951195 (RF-003)", "LED Module 30x15 -22.23mm RGB | P.N 3951189", "LED Module 12x12 -27.78mm RGB | P.N 3951180", "LED Module 36x18 _18.52 RGB | P.N 3951184", "LED Module 15x15 -22.23mm RGB | P.N 3951171", "LED Module 36x18 -20mm RGB | P.N 3951197 (RF-003)", "LED DOT RGB-NS 16x16 25mm FG 5V | P.N 3902437 (RF-003)", "LED mod 24x12 27.78mm RGB / P.N 3951187", "LED Display Module, 16 x 16 pixels, 15 mm pixel pitch, RGB | P.N 3902260", "CAN lntereface card |P.N 3902335", "Modular LUX Sensor 5V | P.N 3902625", "Modular LUX Sensor 5V 2m | P.N 3902627", "Modular LUX Sensor 2m | P.N 3902200", "LED mod 18x18 20mm RGB | P.N 3951195 (RF-003)", "DMS LED Module Power Cable 4420533 - Kabel s T kon 0.2M-5T-377-8M-B-ITS B-code, UL2464", "DMS LED Module Power Cable 4420531 - Kabel s T kon 0.2M-5T-377-3M-B-ITS B-code, UL2464", "DMS LED Module Power Cable 4420532 - Kabel s T kon 0.2M-5T-377-5M-B-ITS B-code, UL2464", "DMS CABLE 5T 8MTR", "DMS CABLE 5T 3MTR", "DMS CABLE 5T 5MTR", "Cable with T-connectors 0.2M-4T-350-5M-B-ITS B-code | P.N 4420457", "Cable with T connectors 0.2M-4T-350-4M-ITS B-code | P.N 4420447", "Cable with T connectors, 0.2M-5T-350-3M-B-ITS B-code | P.N 4420459", "Cable with T-connectors 0.2M-4T-350-2M-4T-350-3M-B-ITS | P.N 4420488", "Cable for MOD DSP 0.2M-6T-350-10M B-code UL | P.N 4420444", "Cable for MOD DSP 0.2M-4T-350-3M B-code UL | P.N 4420440", "Cable for MOD DSP 0.2M-6T-350-3M B-code UL | P.N 4420441", "Cable for MOD DSP 0.2M-6T-350-5M B-code UL | P.N 4420442", "Cable for MOD DSP 0.2M-6T-350-7M B-code UL | P.N 4420443", "Cable for MOD DSP 0.2M-6T-350-10M B-сode UL", "Cable for NextGen - DMS 0.2M-6T-350-8M-B-ITS B | P.N 4420461", "OVP module | P.N 3901905 - Modular Sign OVP", "VMS controller LX-OPEN-CTL-5xCAN+1 I/O | P.N 5201397", "DMS Controller", "DMS Controller 5201068 - LX-OPEN-CTL+6xCAN+2I/O | P.N 5201068", "LCS Controller 5201215 - LX-OPEN-CTL+4xCAN+2I/O | P.N 5201215", "LX Compact Controller 3990176 - LX-COMBO-CTL-LCD-1xETH-1xSER-2xCAN-1xIO", "LED Touch Screen for NTCIP Controller 3003813 - 7 inch LCD touchscreen (GT911)", "LED touch screen for Controller", "LUX sensor with cable", "LX-OPEN-CTL+6xCAN+1I/O | P.N 5201052", "OVP_CAN_Double_3 | P.N 3902453", "LED DOT RGB-NS 16x16 15mm NG 5V | P.N 3902419", "LX-COMBO-CTL-LCD-1xETH-1xSER-1xCAN | P.N 3990175", "CAN Interface card", "D-LAN-CAT-5-FPEAN-NO-4046356730273TARIFF.8536301(IV1-TS1-145)", "FAN PROTECTION 150/150 AISI316(IU2-TS1-143)", "A53-DB9FW/ADAPTERRS-232/422/485CONVETER2KV(OA1-TS1-114", "LCS-LED BOARD(IU3-TS-124)", "SERIAL CABLE (IU3-TS-134)", "SERIAL SERVER (IU3-TS-128)", "FILTER FAN (IU3-TS-127)", "CONV.WIFI/RS232DB9M9-48V 2SMAF (IU3-TS-113)", "INDUSTRIL RS232-422-485-CONVETER2KV ISOLATION(OA1TS1-001", "FILTER-250X250 KIT OF 5 (IU2-TS-066)", "SERIAL CABLE TYPE 2A COD92304034-004(IU3-TS-067)", "SERIAL CABLE TYPE 2B COD92304034-005(IU3-TS-068)", "SERIAL CABLE TYPE2-J1-J2COD92302066-001 (IU3-TS-069)", "THROUGH BEAM PHOTOELECTRIC SENSOR(CB1-TS-070)", "Board 1409 RGB25 16x16/4TSCED 1 Dl 22mA (Code:140032235-V)", "Board 1409 RGB25 16x16/4TSCEDn^sel 22mA (Code:140032236-V)", "Board V1044 Row Ctrl M/FC dO Longlatch (Type A) (CODE: 140031645-V) RGB25-240x80.A2,PG29 Aesys Code: 995101501502", "Board 1636 NewRGB25 16x16/4TSCiD di22mA [SCHEDA 1636 New RGB25 16X16/4TSCD di22mA (Rev:B) (140032524-V)", "CPU 0428+Expansion 0216 for RGB25-432x80 (Code:72428319-R001)", "CPU 0428+Expansion 0216 for RGB25-160x72 (Code:72428319-R001)", "CPU 0428+Expansion 0216 for RGB25-240x80 (Code:72428319-R001)", "CPU 0428+Expansion 0216 for RGB25-320x80 (Code:72197326-001)", "CPU 0429+Expansion 0216 for RGB25-48x48 (Code: 72428319-R001)", "Colour calibrator 0623 ERGP25-48x48 cod .995101602100-05 (Code: 14003794-V)", "Temperature sensor 0218 ERGP25-48x48 cod. 995101602100-003 (Code: 14003440)", "Board 0218 T° frequencyO mini-fit (CODE: 14003440) RGB25-320x80.A2 Aesys Code: 995101702000", "Light sensor 1130 ERGP25-48x48 cod. 995101602100-07 (Code: 140031500-V)", "Board 0511 DCtrl 232 HS optlo al 3FI Ex ERGB25-320x80 cod. 995101702000-04 (Code: 14003982)", "Board 0511 DCtrl 232 HS optlo al 3FI Ex ERGB25-48x48 cod. 99510160200-04 (Code: 14003982)", "Board 0112 Diff.interf.termination ERGP25-320x80 cod. 995101702000-02 (Code: 14003287)", "Board 0112 Diff.interf.termination ERGP25-48x48 cod. 99510160100-02 (Code: 14003287)", "Board V1044 Row Ctr M/FC dlo longlatch ERGB25-320x80 cod. 995101702000-05 (Code: 140031645-V)", "Board V1044 Row Ctr M/FC dlo longlatch ERGB25-48x48 cod. 995101602100-06 (Code: 140031645-V)", "Board V1044 Row Ctr M/FC dlo longlatch 065-00 (Code: 140031645-V)", "Board V1044 Row Ctr M/FC dlo longlatch ERGB25-432x80 type B (Code: 140031645-V)", "Board V1044 Row Ctr M/FC dlo longlatch ERGB25-352x112 type B (Code: 140031645-V)", "Board 0522 RS485 D-R RB300 RT 150 DS+5V (Code: 140032841-V)", "BOARD 1609 FULL Ass,8Tachom.T&H (CODE: 140032478-V) FMFC20-208x96 IP66 BORDERLESS Aesys Code: 995101902600", "CPU Board 1629 Porting 04298 140031439 (CODE: 140032555-V)", "CENTRALINA CCL3343+TFT.RACK19 (CODE: 995301600400) Model: ERGB25-240x80.A2", "CENTRALINA CCL3343+TFT.RACK19 (CODE: 995301600400) Model: ERGB25-320x80.A2", "CENTRALINA CCL3343+TFT.RACK19 (CODE: 995301600400) Model: ERGB25-432x80.A2", "NTCIP CONTROLLER 352*112 CENTRALINA CCL343-PMV (CODE: 995301000400) Model: ERGB25-240x80.A2", "BOARD 1907 HUB for DMS (CODE: 140032813-V)", "Ind.CF 256MB 3,3+5V 32nm 1ch 8/16b 0+70° [CODE: 11067060]", "Photocell Sensor (CODE: 140032795-V)", "Board 1125 Extension Flat 26P Term.N.F.[CODE: 140031475]", "AXIAL FAN 119x119x38 12Vll.2W AlarmB IP24 (CODE: 12006109-R00l]", "AXIAL FAN 120X120x38 12V 0.60A Alam 2B (CODE:12006058-R002)", "Board 1409 RGB25 16x16/4TSCiD di 22mA [CODE: 140031863) RGB25-48x48.A2 Aesys Code: 995101602100", "SCHEDA V0216 Exp.Module 16 12Vi 4Ti 60 (CODE: 14003436-V) RGB25-48x48.A2 Aesys Code: 995101602100", "SCHEDA 0930 RS485 Termination CPU 0429 (CODE: 140031235-V) RGB25-48x48.A2 Aesys Code: 995101602100", "Flat cable 26P 295 21DC (lT/lB) (CODE: 92304008-009)", "OVDS Power supply", "RSDMS Power supply", "OVDS dual beam", "OVDS Speaker", "CAT6A Cable", "SWITCHING POWER SUPPLY 3000W24V MENWELL(IV1-TS1-099)", "LCS MEANWELL Power Supply RSP-3000-24", "DIN Rail power supply SDR-960-24 24V, 180-264VDC", "RSP-500-3.3 POWER SUPPLY 3.3V (IZ1-TS-122)", "RSP-320-12 POWER SUPPLY 12V", "RSP-320-5 POWER SUPPLY 5V", "RSP-150-5 DC POWER SUPPLY 5V(IU3-TS-119)", "RSP-500-5V DC POWER SUPPLY 5V (OB1-TS-117)", "LRS-75-12 POWER SUPPLY 12V MEANWELL", "RSP-150-5 DC POWER SUPPLY 5V MEANWELL", "Solid State Relay SSR-40 DA (40A/250V)", "Highways Monitoring Radar 12/24V dc/multi lane / Speed & range output (code:343-500-000)", "FTDI USB-422 Configuration Cable for 343(code: CA-345)", "343 Power/RS422 Cable Assy (10M)(code: CA-310)", "343 Interface Enclosure c/w 24V dc PSU /343 (code: MK343-03)", "343 Camera Set Up Kit /343 (code:MK343-05)", "343 Mounting Bracket Kit(code:MS-246)", "POE extender Veracity", "Dahua POE Midspan", "LPR Power supply", "Camera Lowering System(Mod.No.: CDP6-6AV15M-15M-7042)", "OVDS-rsdms ctrl", "Fuse 10a-6.3a", "CCTV Bracket L-bow", "MIC IP starlight 7100iIC IP starlight 7100i PTZ 2MP HDR 30x IP68 enhanced white", "PTZ 2MP HDR 40x IP66 pendant"];
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

const COLS = [['transaction_date', 'Date', r => fmt(r.transaction_date)], ['mat', 'Material'], ['item_description', 'Item Description'], ['quantity', 'Qty'], ['work_order', 'Work Order'], ['location', 'Location'], ['status', 'Status'], ['remarks', 'Remarks'], ['user', 'Added By'], ['created_at', 'Time', r => tm(r.created_at)]];

function Dash({ stock, rows }) {
  const S = k => stock.reduce((a, x) => a + x[k], 0);
  return <>
    <div className="grid">{[['Total Quantity', S('total')], ['Released', S('Released')], ['Defective', S('Defective')]].map(([n, q]) => <div className="card" key={n}><small>{n}</small><h2>{q}</h2></div>)}</div>
    <div className="card"><h3>Recent Records</h3><Table cols={COLS.slice(0, 7).concat([COLS[8]])} rows={rows.slice(0, 8)} /></div>
    <div className="card"><h3>By Material</h3><table><thead><tr><th>Material</th><th>Released</th><th>Defective</th><th>Total</th></tr></thead><tbody>
      {stock.map(s => <tr key={s.name}><td data-l="Material">{s.name}</td><td data-l="Released">{s.Released}</td><td data-l="Defective">{s.Defective}</td><td data-l="Total"><b>{s.total}</b></td></tr>)}</tbody></table></div></>;
}
const Table = ({ cols, rows, onRow }) => <table><thead><tr>{cols.map(c => <th key={c[0]}>{c[1]}</th>)}</tr></thead><tbody>
  {rows.map(r => <tr key={r.id} className={onRow ? 'click' : ''} onClick={() => onRow && onRow(r)}>{cols.map(c => <td key={c[0]} data-l={c[1]}>{c[2] ? c[2](r) : r[c[0]]}</td>)}</tr>)}</tbody></table>;

function Tbl({ rows, onEdit, onDel, d }) {
  const [q, setQ] = useState(''), [f, setF] = useState({ mat: '', st: '', user: '', a: '', b: '' }), [so, setSo] = useState({ k: 'transaction_date', dir: -1 }), [pg, setPg] = useState(0), [sel, setSel] = useState(null);
  const list = useMemo(() => {
    const t = q.toLowerCase();
    return rows.filter(r => (!t || [fmt(r.transaction_date), r.mat, r.item_description, r.work_order, r.location, r.status, r.user, r.remarks].join(' ').toLowerCase().includes(t))
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
      {[['Date', fmt(sel.transaction_date)], ['Material', sel.mat], ['Item Description', sel.item_description || '—'], ['Quantity', sel.quantity], ['Work Order', sel.work_order || '—'], ['Location', sel.location || '—'], ['Status', sel.status], ['Remarks', sel.remarks || '—'], ['Added by', sel.user], ['Added', new Date(sel.created_at).toLocaleString()], ['Last updated', new Date(sel.updated_at).toLocaleString()]].map(([k, x]) => <p key={k}><b>{k}:</b> {x}</p>)}
      <div className="row"><button className="btn" onClick={() => { onEdit(sel); setSel(null); }}>Edit</button><button className="btn red" onClick={() => { onDel(sel); setSel(null); }}>Delete</button><button className="btn alt" onClick={() => setSel(null)}>Close</button></div></Modal>}
  </div>;
}

function Form({ init, d, done, cancel, notify, name }) {
  const [f, setF] = useState({ transaction_date: today(), material_id: '', item_description: '', quantity: '', work_order: '', location: '', status: 'Released', remarks: '', ...init }), [busy, setBusy] = useState(false), [err, setErr] = useState('');
  const set = (k, v) => setF(x => ({ ...x, [k]: v }));
  const go = async e => {
    e.preventDefault(); setErr(''); const q = Number(f.quantity);
    if (!f.material_id) return setErr('Select a material.');
    if (!DESC.includes(f.item_description)) return setErr('Please pick the item description from the list.');
    if (!(q > 0)) return setErr('Quantity must be greater than 0.');
    setBusy(true);
    const row = { transaction_date: f.transaction_date, material_id: +f.material_id, quantity: q, item_description: f.item_description, work_order: f.work_order?.trim() || null, location: f.location.trim(), status: f.status, remarks: f.remarks || null, updated_by_name: name };
    const { error } = f.id ? await sb.from('inventory_transactions').update(row).eq('id', f.id) : await sb.from('inventory_transactions').insert({ ...row, created_by_name: name });
    setBusy(false); if (error) return setErr(error.message);
    notify(f.id ? 'Inventory updated.' : 'Inventory successfully added.'); done();
  };
  return <Modal><form onSubmit={go}><h3>{f.id ? `Edit #${f.id}` : 'Add Inventory'}</h3>
    <label>Date</label><input type="date" value={f.transaction_date} onChange={e => set('transaction_date', e.target.value)} required />
    <label>Materials</label><select value={f.material_id} onChange={e => set('material_id', e.target.value)} required><option value="">Select…</option>{d.m.map(m => <option key={m.id} value={m.id}>{m.material_name}</option>)}</select>
    <label>Item Description</label><input list="dl" value={f.item_description || ''} onChange={e => set('item_description', e.target.value)} placeholder="Tap and search, then pick from the list" required /><datalist id="dl">{DESC.map(x => <option key={x} value={x} />)}</datalist>
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
  const head = sm ? ['Material', 'Released', 'Defective', 'Total'] : ['Date', 'Material', 'Item Description', 'Qty', 'Work Order', 'Location', 'Status', 'User', 'Remarks'];
  const body = sm ? stock.map(s => [s.name, s.Released, s.Defective, s.total]) : out.map(r => [fmt(r.transaction_date), r.mat, r.item_description || '', r.quantity, r.work_order || '', r.location || '', r.status, r.user, r.remarks || '']);
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
