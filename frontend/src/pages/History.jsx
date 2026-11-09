import { useEffect, useState } from 'react'
import api from '../api'
import { EmptyState, ErrorBox, LoadingBlock, Spinner, useToast } from '../components/feedback'

export default function History() {
  const toast = useToast()
  const [items, setItems] = useState([])
  const [search, setSearch] = useState('')
  const [filterId, setFilterId] = useState('')
  const [groupId, setGroupId] = useState('')
  const [filters, setFilters] = useState([])
  const [groups, setGroups] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = async (announce = false) => {
    setLoading(true); setError('')
    try {
      const d = await api.history({ search, filter_id: filterId, group_id: groupId })
      const list = Array.isArray(d) ? d : d.items || []
      setItems(list)
      if (announce) toast.success(`${list.length} kayıt bulundu.`)
    } catch (e) { setError(e.message) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, []) // eslint-disable-line
  useEffect(() => { api.filters().then((d) => setFilters(Array.isArray(d) ? d : [])).catch(() => {}); api.groups().then((d) => setGroups(Array.isArray(d) ? d : [])).catch(() => {}) }, [])
  const clear = () => { setSearch(''); setFilterId(''); setGroupId('') }

  return (
    <>
      <h1>Geçmiş</h1>
      <p className="muted">Eşleşen ve iletilen mesajlar</p>
      <ErrorBox message={error} onRetry={() => load()} />
      <div className="card">
        <div className="search-bar">
          <span className="search-input"><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Ara: metin, gönderen..." onKeyDown={(e) => e.key === 'Enter' && load(true)} /></span>
          <select value={filterId} onChange={(e) => setFilterId(e.target.value)}><option value="">Tüm filtreler</option>{filters.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}</select>
          <select value={groupId} onChange={(e) => setGroupId(e.target.value)}><option value="">Tüm gruplar</option>{groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</select>
          <button className="btn btn-loading" onClick={() => load(true)} disabled={loading}>{loading && <Spinner small />}Ara</button>
          {(search || filterId || groupId) && <button className="btn secondary" onClick={clear}>Temizle</button>}
        </div>
        {loading ? <LoadingBlock label="Geçmiş yükleniyor..." /> : error ? null : items.length === 0 ? <EmptyState title="Kayıt bulunamadı." hint="Arama kriterlerini değiştirin veya filtrelerin eşleşmesini bekleyin." /> : (
          <div style={{ overflowX: 'auto' }}><table><thead><tr><th>Tarih</th><th>Grup</th><th>Gönderen</th><th>Mesaj</th><th>Medya</th><th>Filtre</th><th>Durum</th><th>Hata</th></tr></thead>
            <tbody>{items.map((r) => <tr key={r.id}><td>{r.created_at}</td><td>{r.group_name || r.group_id}</td><td>{r.sender}</td><td>{(r.text || '').slice(0, 200)}</td><td>{r.media_type || ''}</td><td>{r.matched_filter_name || ''}</td><td><span className={`badge ${r.status === 'sent' ? 'ok' : r.status === 'failed' ? 'fail' : 'drop'}`}>{r.status === 'sent' ? 'Gönderildi' : r.status === 'failed' ? 'Başarısız' : r.status === 'dropped_quiet' ? 'Sessiz saatte düşürüldü' : r.status}</span></td><td>{r.error || ''}</td></tr>)}</tbody></table></div>
        )}
      </div>
    </>
  )
}
