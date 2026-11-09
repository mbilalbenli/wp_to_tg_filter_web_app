import { useEffect, useState } from 'react'
import api from '../api'

export default function History() {
  const [items, setItems] = useState([])
  const [search, setSearch] = useState('')
  const [filterId, setFilterId] = useState('')
  const [groupId, setGroupId] = useState('')
  const [filters, setFilters] = useState([])
  const [groups, setGroups] = useState([])
  const [error, setError] = useState('')

  const load = () => api.history({ search, filter_id: filterId, group_id: groupId }).then((d) => setItems(Array.isArray(d) ? d : d.items || [])).catch((e) => setError(e.message))
  useEffect(() => { load() }, []) // eslint-disable-line
  useEffect(() => { api.filters().then((d) => setFilters(Array.isArray(d) ? d : [])).catch(() => {}); api.groups().then((d) => setGroups(Array.isArray(d) ? d : [])).catch(() => {}) }, [])

  return (
    <>
      <h1>Geçmiş</h1>
      <p className="muted">Eşleşen ve iletilen mesajlar</p>
      {error && <div className="alert error">{error}</div>}
      <div className="card">
        <div className="row" style={{ marginBottom: 12 }}>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Ara: metin, gönderen..." onKeyDown={(e) => e.key === 'Enter' && load()} />
          <select value={filterId} onChange={(e) => setFilterId(e.target.value)}><option value="">Tüm filtreler</option>{filters.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}</select>
          <select value={groupId} onChange={(e) => setGroupId(e.target.value)}><option value="">Tüm gruplar</option>{groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</select>
          <button className="btn" onClick={load}>Ara</button>
        </div>
        {items.length === 0 ? <p className="muted">Kayıt bulunamadı.</p> : (
          <div style={{ overflowX: 'auto' }}><table><thead><tr><th>Tarih</th><th>Grup</th><th>Gönderen</th><th>Mesaj</th><th>Medya</th><th>Filtre</th><th>Durum</th><th>Hata</th></tr></thead>
            <tbody>{items.map((r) => <tr key={r.id}><td>{r.created_at}</td><td>{r.group_name || r.group_id}</td><td>{r.sender}</td><td>{(r.text || '').slice(0, 200)}</td><td>{r.media_type || ''}</td><td>{r.matched_filter_name || ''}</td><td><span className={`badge ${r.status === 'sent' ? 'ok' : r.status === 'failed' ? 'fail' : 'drop'}`}>{r.status === 'sent' ? 'Gönderildi' : r.status === 'failed' ? 'Başarısız' : r.status === 'dropped_quiet' ? 'Sessiz saatte düşürüldü' : r.status}</span></td><td>{r.error || ''}</td></tr>)}</tbody></table></div>
        )}
      </div>
    </>
  )
}
