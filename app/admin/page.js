'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Nav from '../Nav';

export default function Admin() {
  const [cats, setCats] = useState([]);
  const [rcas, setRcas] = useState([]);
  const [sel, setSel] = useState(null); // category id, or 'new'
  const [name, setName] = useState('');
  const [acts, setActs] = useState('');
  const [newRca, setNewRca] = useState('');
  const [msg, setMsg] = useState('');

  const load = async () => {
    setCats((await supabase.from('action_categories').select('*').order('sort')).data || []);
    setRcas((await supabase.from('rcas').select('*').order('created_at')).data || []);
  };
  useEffect(() => { load(); }, []);
  const say = (t) => { setMsg(t); setTimeout(() => setMsg(''), 2500); };

  function choose(id) {
    setSel(id || null);
    const x = cats.find((y) => y.id === id);
    setName(x?.name || ''); setActs(x ? x.actions.join('\n') : '');
  }
  async function saveCat() {
    if (!name.trim()) return say('Enter a category name.');
    const actions = acts.split('\n').map((s) => s.trim()).filter(Boolean);
    const row = { name: name.trim(), actions };
    const { error } = sel && sel !== 'new'
      ? await supabase.from('action_categories').update(row).eq('id', sel)
      : await supabase.from('action_categories').insert({ ...row, sort: cats.length + 1 });
    if (error) return say(error.message);
    say('Category saved.'); await load();
  }
  async function delCat() {
    if (!sel || sel === 'new' || !confirm('Delete this category and its actions?')) return;
    await supabase.from('action_categories').delete().eq('id', sel);
    setSel(null); setName(''); setActs(''); say('Category deleted.'); load();
  }
  async function addRca() {
    const n = newRca.trim();
    if (!n || n.toLowerCase() === 'other') return;
    const { error } = await supabase.from('rcas').insert({ name: n });
    if (error) return say(error.message);
    setNewRca(''); load();
  }
  async function delRca(id) { await supabase.from('rcas').delete().eq('id', id); load(); }

  return (
    <>
      <Nav />
      <main>
        <section>
          <h2>Action categories &amp; checklists</h2>
          <label htmlFor="sc">Category</label>
          <select id="sc" value={sel && sel !== 'new' ? sel : ''} onChange={(e) => choose(e.target.value)}>
            <option value="">Choose category to edit</option>
            {cats.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
          </select>
          <div className="row"><button className="btn" onClick={() => choose('new')}>New category</button></div>
          {sel && (<>
            <label htmlFor="cn">Category name</label><input id="cn" value={name} onChange={(e) => setName(e.target.value)} />
            <label htmlFor="ca">Actions (one per line, in the order they should appear)</label>
            <textarea id="ca" style={{ minHeight: 260 }} value={acts} onChange={(e) => setActs(e.target.value)} />
            <div className="row">
              <button className="btn solid" onClick={saveCat}>Save category</button>
              {sel !== 'new' && <button className="btn danger" onClick={delCat}>Delete category</button>}
            </div>
          </>)}
        </section>
        <section>
          <h2>RCA choices</h2>
          <p className="hint">"Other" is always available in the report form.</p>
          {rcas.map((r) => (<div className="item" key={r.id}><span>{r.name}</span><button className="btn danger" onClick={() => delRca(r.id)}>Remove</button></div>))}
          <label htmlFor="nr">Add RCA</label>
          <input id="nr" value={newRca} onChange={(e) => setNewRca(e.target.value)} />
          <div className="row"><button className="btn solid" onClick={addRca}>Add RCA</button></div>
        </section>
      </main>
      {msg && <div className="toast" role="status">{msg}</div>}
    </>
  );
}
