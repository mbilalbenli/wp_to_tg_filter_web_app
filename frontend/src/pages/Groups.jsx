import { useEffect, useState } from 'react'
import api from '../api'
import { EmptyState, ErrorBox, LoadingBlock, Spinner, useToast } from '../components/feedback'

export default function Groups() {
  const toast = useToast()
  const [groups, setGroups] = useState([])
  const [selected, setSelected] = useState(new Set())
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState('')

  const load = async () => {
    setLoading(true); setError('')
    try {
      const g = await api.groups()
      const list = Array.isArray(g) ? g : g.groups || []
      setGroups(list); setSelected(new Set(list.filter((x) => x.selected).map((x) => x.id)))
    } catch (e) { setError(e.message) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const toggle = (id) => setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  const save = async () => { setBusy('save'); try { await api.saveGroupSelection([...selected]); toast.success(`Grup seçimi kaydedildi (${selected.size} grup).`) } catch (e) { toast.error(e.message) } finally { setBusy('') } }
  const sync = async () => { setBusy('sync'); try { await api.syncGroups(); toast.success('Gruplar senkronize edildi.'); await load() } catch (e) { toast.error(e.message) } finally { setBusy('') } }

  return (
    <>
      <h1>Gruplar</h1>
      <p className="muted">Dinlenecek WhatsApp gruplarını seçin.</p>
      <ErrorBox message={error} onRetry={load} />
      <div className="card">
        <div className="row" style={{ marginBottom: 14 }}>
          <button className="btn secondary btn-loading" onClick={sync} disabled={!!busy}>{busy === 'sync' && <Spinner small />}Grupları Senkronize Et</button>
          <button className="btn btn-loading" onClick={save} disabled={!!busy}>{busy === 'save' && <Spinner small />}Seçimi Kaydet ({selected.size})</button>
        </div>
        {loading ? <LoadingBlock label="Gruplar yükleniyor..." /> : error ? null : groups.length === 0 ? <EmptyState title="Grup bulunamadı." hint="WhatsApp bağlı olduğundan emin olup senkronize edin." /> : (
          <table><thead><tr><th></th><th>Grup</th><th>Katılımcı</th><th>Durum</th></tr></thead>
            <tbody>{groups.map((g) => <tr key={g.id}><td><input type="checkbox" checked={selected.has(g.id)} onChange={() => toggle(g.id)} /></td><td>{g.name}</td><td>{g.participants ?? '—'}</td><td>{selected.has(g.id) ? <span className="badge ok">Dinleniyor</span> : <span className="badge">Seçili değil</span>}</td></tr>)}</tbody></table>
        )}
      </div>
    </>
  )
}
