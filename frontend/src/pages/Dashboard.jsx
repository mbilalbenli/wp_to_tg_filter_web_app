import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => { api.dashboard().then(setData).catch((e) => setError(e.message)) }, [])
  if (error) return <><h1>Panel</h1><div className="alert error">{error}</div></>
  if (!data) return <p className="muted">Yükleniyor...</p>
  const recent = data.recent_matches || []
  return (
    <>
      <h1>Panel</h1>
      <p className="muted">Genel durum özeti</p>
      <div className="grid">
        <div className="card"><div className="muted">WhatsApp Durumu</div><div className="stat" style={{ fontSize: 20 }}>{data.wa_connected ? 'Bağlı' : 'Bağlı Değil'}</div><div className="muted">{data.wa_account || 'Hesap yok'} · <Link to="/whatsapp">Yönet</Link></div></div>
        <div className="card"><div className="muted">Aktif Filtre</div><div className="stat">{data.active_filters ?? 0}</div><Link to="/filters">Filtreleri gör</Link></div>
        <div className="card"><div className="muted">Seçili Grup</div><div className="stat">{data.selected_groups ?? 0}</div><Link to="/groups">Grupları gör</Link></div>
        <div className="card"><div className="muted">Bugün Gönderilen</div><div className="stat">{data.sent_today ?? 0}</div><div className="muted">Toplam: {data.total_sent ?? 0}</div></div>
      </div>
      <div className="card">
        <h2>Son Eşleşmeler</h2>
        {recent.length === 0 ? <p className="muted">Henüz eşleşme yok.</p> : (
          <table><thead><tr><th>Grup</th><th>Gönderen</th><th>Mesaj</th><th>Filtre</th><th>Durum</th><th>Tarih</th></tr></thead>
            <tbody>{recent.map((r) => <tr key={r.id}><td>{r.group_name || r.group_id}</td><td>{r.sender}</td><td>{(r.text || '').slice(0, 120)}</td><td>{r.matched_filter_name || ''}</td><td><span className={`badge ${r.status === 'sent' ? 'ok' : r.status === 'failed' ? 'fail' : 'drop'}`}>{r.status}</span></td><td>{r.created_at}</td></tr>)}</tbody></table>
        )}
        <p><Link to="/history">Tüm geçmişi gör →</Link></p>
      </div>
    </>
  )
}
