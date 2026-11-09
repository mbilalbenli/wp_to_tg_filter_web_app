import { useEffect, useState, useCallback } from 'react'
import api from '../api'

export default function WhatsApp() {
  const [status, setStatus] = useState(null)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const load = useCallback(() => { api.waStatus().then(setStatus).catch((e) => setError(e.message)) }, [])
  useEffect(() => { load(); const t = setInterval(load, 5000); return () => clearInterval(t) }, [load])

  const act = async (fn, ok) => { setError(''); setMsg(''); try { await fn(); setMsg(ok); load() } catch (e) { setError(e.message) } }
  const qr = status?.qr
  const qrSrc = qr ? (qr.startsWith('data:') || qr.startsWith('http') ? qr : null) : null

  return (
    <>
      <h1>WhatsApp Bağlantısı</h1>
      <p className="muted">QR kodu WhatsApp uygulamasından tarayarak bağlanın.</p>
      {error && <div className="alert error">{error}</div>}
      {msg && <div className="alert success">{msg}</div>}
      <div className="card">
        {!status ? <p className="muted">Durum yükleniyor...</p> : (
          <>
            <p>Durum: <span className={`badge ${status.connected ? 'ok' : 'fail'}`}>{status.connected ? 'Bağlı' : 'Bağlı Değil'}</span> <span className="muted">{status.state || ''}</span></p>
            <p>Hesap: <strong>{status.account || '—'}</strong></p>
            {!status.connected && qr && (qrSrc ? <><p className="muted">WhatsApp → Bağlı Cihazlar → Cihaz Bağla adımlarıyla tarayın:</p><img className="qr" src={qrSrc} alt="WhatsApp QR kodu" /></> : <><p className="muted">QR verisi:</p><pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{qr}</pre></>)}
            {!status.connected && !qr && <p className="muted">QR kodu için önce bağlanmayı başlatın.</p>}
            <div className="row" style={{ marginTop: 14 }}>
              <button className="btn" onClick={() => act(api.waConnect, 'Bağlantı başlatıldı. QR kodu kısa süre içinde görünecek.')}>Bağlan / QR Al</button>
              <button className="btn secondary" onClick={load}>Durumu Yenile</button>
              <button className="btn danger" onClick={() => act(api.waDisconnect, 'Bağlantı kesildi.')}>Bağlantıyı Kes</button>
            </div>
          </>
        )}
      </div>
    </>
  )
}
