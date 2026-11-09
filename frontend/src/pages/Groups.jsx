import { useEffect, useState } from 'react'
import api from '../api'

export default function Groups() {
  const [groups, setGroups] = useState([])
  const [selected, setSelected] = useState(new Set())
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(true)

  const load = () => { setLoading(true); api.groups().then((g) => { const list = Array.isArray(g) ? g : g.groups || []; setGroups(list); setSelected(new Set(list.filter((x) => x.selected).map((x) => x.id))) }).catch((e) => setError(e.message)).finally(() => setLoading(false)) }
  useEffect(load, [])

  const toggle = (id) => setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  const save = async () => { setError(''); setMsg(''); try { await api.saveGroupSelection([...selected]); setMsg('Grup seçimi kaydedildi.') } catch (e) { setError(e.message) } }
  const sync = async () => { setError(''); setMsg(''); try { await api.syncGroups(); setMsg('Gruplar senkronize edildi.'); load() } catch (e) { setError(e.message) } }

  return (
    <>
      <h1>Gruplar</h1>
      <p className="muted">Dinlenecek WhatsApp gruplarını seçin.</p>
      {error && <div className="alert error">{error}</div>}
      {msg && <div className="alert success">{msg}</div>}
      <div className="card">
        <div className="row" style={{ marginBottom: 14 }}>
          <button className="btn secondary" onClick={sync}>Grupları Senkronize Et</button>
          <button className="btn" onClick={save}>Seçimi Kaydet ({selected.size})</button>
        </div>
        {loading ? <p className="muted">Yükleniyor...</p> : groups.length === 0 ? <p className="muted">Grup bulunamadı. WhatsApp bağlı olduğundan emin olup senkronize edin.</p> : (
          <table><thead><tr><th></th><th>Grup</th><th>Katılımcı</th><th>Durum</th></tr></thead>
            <tbody>{groups.map((g) => <tr key={g.id}><td><input type="checkbox" checked={selected.has(g.id)} onChange={() => toggle(g.id)} /></td><td>{g.name}</td><td>{g.participants ?? '—'}</td><td>{selected.has(g.id) ? <span className="badge ok">Dinleniyor</span> : <span className="badge">Seçili değil</span>}</td></tr>)}</tbody></table>
        )}
      </div>
    </>
  )
}
