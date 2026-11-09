import { useEffect, useState } from 'react'
import api from '../api'

const MEDIA = ['text', 'image', 'video', 'audio', 'document', 'sticker']
const MEDIA_LABELS = { text: 'Metin', image: 'Resim', video: 'Video', audio: 'Ses', document: 'Dosya', sticker: 'Sticker' }
const empty = {
  name: '', keyword: '', enabled: true, case_sensitive: false, whole_word: false, turkish_normalize: true,
  telegram_target_id: '', exclude_keywords: [], sender_mode: 'all', sender_list: [],
  quiet_hours_enabled: false, quiet_start: '23:00', quiet_end: '08:00', quiet_action: 'drop',
  media_types: [], link_mode: 'any', min_length: '', max_length: '', group_ids: [],
}
const listToText = (a) => (a || []).join(', ')
const textToList = (s) => (typeof s === 'string' ? s.split(',').map((x) => x.trim()).filter(Boolean) : s || [])

export default function Filters() {
  const [filters, setFilters] = useState([])
  const [targets, setTargets] = useState([])
  const [groups, setGroups] = useState([])
  const [form, setForm] = useState(empty)
  const [editing, setEditing] = useState(null)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')

  const load = () => {
    api.filters().then((d) => setFilters(Array.isArray(d) ? d : d.filters || [])).catch((e) => setError(e.message))
    api.targets().then((d) => setTargets(Array.isArray(d) ? d : d.targets || [])).catch(() => {})
    api.groups().then((d) => setGroups(Array.isArray(d) ? d : d.groups || [])).catch(() => {})
  }
  useEffect(load, [])

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const toggleList = (k, v) => setForm((f) => ({ ...f, [k]: f[k].includes(v) ? f[k].filter((x) => x !== v) : [...f[k], v] }))

  const submit = async (e) => {
    e.preventDefault(); setError(''); setMsg('')
    const body = {
      ...form,
      exclude_keywords: textToList(form.exclude_keywords),
      sender_list: textToList(form.sender_list),
      telegram_target_id: form.telegram_target_id ? Number(form.telegram_target_id) : null,
      min_length: form.min_length === '' ? null : Number(form.min_length),
      max_length: form.max_length === '' ? null : Number(form.max_length),
      group_ids: form.group_ids.map(Number),
    }
    try {
      if (editing) await api.updateFilter(editing, body); else await api.createFilter(body)
      setMsg(editing ? 'Filtre güncellendi.' : 'Filtre oluşturuldu.')
      setForm(empty); setEditing(null); load()
    } catch (err) { setError(err.message) }
  }

  const edit = (f) => { setEditing(f.id); setForm({ ...empty, ...f, exclude_keywords: f.exclude_keywords || [], sender_list: f.sender_list || [], telegram_target_id: f.telegram_target_id ?? '', min_length: f.min_length ?? '', max_length: f.max_length ?? '', media_types: f.media_types || [], group_ids: f.group_ids || [] }); window.scrollTo(0, 0) }
  const del = async (id) => { if (!confirm('Filtre silinsin mi?')) return; try { await api.deleteFilter(id); load() } catch (e) { setError(e.message) } }

  return (
    <>
      <h1>Filtreler</h1>
      <p className="muted">Anahtar kelime ve eşleşme kurallarını yönetin.</p>
      {error && <div className="alert error">{error}</div>}
      {msg && <div className="alert success">{msg}</div>}

      <form className="card" onSubmit={submit}>
        <h2>{editing ? 'Filtreyi Düzenle' : 'Yeni Filtre'}</h2>
        <div className="row">
          <div className="field"><label>Filtre adı</label><input value={form.name} onChange={(e) => set('name', e.target.value)} required placeholder="Örn: İş ilanları" /></div>
          <div className="field"><label>Anahtar kelime / ifade</label><input value={form.keyword} onChange={(e) => set('keyword', e.target.value)} required placeholder="Örn: iş arıyorum" /></div>
          <div className="field"><label>Telegram hedefi</label><select value={form.telegram_target_id} onChange={(e) => set('telegram_target_id', e.target.value)}><option value="">Varsayılan hedef</option>{targets.map((t) => <option key={t.id} value={t.id}>{t.name} {t.is_default ? '(varsayılan)' : ''}</option>)}</select></div>
        </div>
        <label className="check"><input type="checkbox" checked={form.enabled} onChange={(e) => set('enabled', e.target.checked)} /> Aktif</label>
        <label className="check"><input type="checkbox" checked={form.case_sensitive} onChange={(e) => set('case_sensitive', e.target.checked)} /> Büyük/küçük harf duyarlı</label>
        <label className="check"><input type="checkbox" checked={form.whole_word} onChange={(e) => set('whole_word', e.target.checked)} /> Tam kelime eşleşmesi</label>
        <label className="check"><input type="checkbox" checked={form.turkish_normalize} onChange={(e) => set('turkish_normalize', e.target.checked)} /> Türkçe karakter normalize et (İ/I, ş/s vb.)</label>

        <h3>Ek Kurallar</h3>
        <div className="field"><label>Hariç kelimeler (virgülle ayırın, biri geçerse eşleşme iptal)</label><input value={Array.isArray(form.exclude_keywords) ? listToText(form.exclude_keywords) : form.exclude_keywords} onChange={(e) => set('exclude_keywords', e.target.value)} placeholder="spam, reklam" /></div>
        <div className="row">
          <div className="field"><label>Gönderen filtresi</label><select value={form.sender_mode} onChange={(e) => set('sender_mode', e.target.value)}><option value="all">Tümü</option><option value="only">Sadece listedekiler</option><option value="except">Listedekiler hariç</option></select></div>
          <div className="field"><label>Gönderen listesi (virgülle ayırın)</label><input value={Array.isArray(form.sender_list) ? listToText(form.sender_list) : form.sender_list} onChange={(e) => set('sender_list', e.target.value)} placeholder="905xx..., Ahmet" /></div>
        </div>
        <label className="check"><input type="checkbox" checked={form.quiet_hours_enabled} onChange={(e) => set('quiet_hours_enabled', e.target.checked)} /> Sessiz saatler aktif</label>
        {form.quiet_hours_enabled && (
          <div className="row">
            <div className="field"><label>Başlangıç</label><input type="time" value={form.quiet_start} onChange={(e) => set('quiet_start', e.target.value)} /></div>
            <div className="field"><label>Bitiş</label><input type="time" value={form.quiet_end} onChange={(e) => set('quiet_end', e.target.value)} /></div>
            <div className="field"><label>Sessiz saatte</label><select value={form.quiet_action} onChange={(e) => set('quiet_action', e.target.value)}><option value="drop">İletme (düşür)</option><option value="queue">Kuyruğa al</option></select></div>
          </div>
        )}
        <div className="field"><label>Medya tipleri (boş = tümü)</label><div className="row">{MEDIA.map((m) => <label key={m} className="check" style={{ flex: '0 0 auto' }}><input type="checkbox" checked={form.media_types.includes(m)} onChange={() => toggleList('media_types', m)} /> {MEDIA_LABELS[m]}</label>)}</div></div>
        <div className="row">
          <div className="field"><label>Link durumu</label><select value={form.link_mode} onChange={(e) => set('link_mode', e.target.value)}><option value="any">Fark etmez</option><option value="only_link">Sadece link içerenler</option><option value="no_link">Sadece link içermeyenler</option></select></div>
          <div className="field"><label>Min. uzunluk</label><input type="number" min="0" value={form.min_length} onChange={(e) => set('min_length', e.target.value)} /></div>
          <div className="field"><label>Maks. uzunluk</label><input type="number" min="0" value={form.max_length} onChange={(e) => set('max_length', e.target.value)} /></div>
        </div>
        {groups.length > 0 && <div className="field"><label>Geçerli gruplar (boş = tüm seçili gruplar)</label>{groups.map((g) => <label key={g.id} className="check"><input type="checkbox" checked={form.group_ids.map(String).includes(String(g.id))} onChange={() => toggleList('group_ids', g.id)} /> {g.name}</label>)}</div>}
        <div className="row">
          <button className="btn">{editing ? 'Kaydet' : 'Filtre Oluştur'}</button>
          {editing && <button type="button" className="btn secondary" onClick={() => { setEditing(null); setForm(empty) }}>İptal</button>}
        </div>
      </form>

      <div className="card">
        <h2>Filtre Listesi</h2>
        {filters.length === 0 ? <p className="muted">Henüz filtre yok.</p> : (
          <table><thead><tr><th>Ad</th><th>Kelime</th><th>Durum</th><th>Hedef</th><th></th></tr></thead>
            <tbody>{filters.map((f) => <tr key={f.id}><td>{f.name}</td><td>{f.keyword}</td><td>{f.enabled ? <span className="badge ok">Aktif</span> : <span className="badge">Pasif</span>}</td><td>{f.telegram_target_id ?? 'Varsayılan'}</td><td><button className="btn secondary" onClick={() => edit(f)}>Düzenle</button>{' '}<button className="btn danger" onClick={() => del(f.id)}>Sil</button></td></tr>)}</tbody></table>
        )}
      </div>
    </>
  )
}
