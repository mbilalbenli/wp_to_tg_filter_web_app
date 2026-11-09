import { useEffect, useState, useCallback, useRef } from 'react'
import api from '../api'
import { ErrorBox, LoadingBlock, Spinner, useToast } from '../components/feedback'

export default function WhatsApp() {
  const toast = useToast()
  const [status, setStatus] = useState(null)
  const [error, setError] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [updatedAt, setUpdatedAt] = useState(null)
  const busyRef = useRef(false)

  const load = useCallback(async (announce = false) => {
    if (busyRef.current) return
    busyRef.current = true
    setRefreshing(true)
    try {
      const s = await api.waStatus()
      setStatus(s)
      setError('')
      setUpdatedAt(new Date())
      if (announce) toast.success(`Durum yenilendi: ${s.connected ? 'Bağlı' : 'Bağlı Değil'}${s.state ? ` (${s.state})` : ''}`)
    } catch (e) {
      setError(e.message)
      if (announce) toast.error(e.message)
    } finally {
      busyRef.current = false
      setRefreshing(false)
    }
  }, [toast])

  useEffect(() => {
    load()
    const t = setInterval(() => load(), 5000)
    return () => clearInterval(t)
  }, [load])

  const act = async (fn, ok) => {
    setError('')
    try { await fn(); toast.success(ok); await load() } catch (e) { setError(e.message) }
  }
  const qr = status?.qr
  const qrSrc = qr ? (qr.startsWith('data:') || qr.startsWith('http') ? qr : null) : null

  return (
    <>
      <h1>WhatsApp Bağlantısı</h1>
      <p className="muted">QR kodu WhatsApp uygulamasından tarayarak bağlanın.</p>
      <ErrorBox message={error} onRetry={() => load(true)} />
      <div className="card">
        {!status && !error ? <LoadingBlock label="WhatsApp durumu yükleniyor..." /> : !status ? null : (
          <>
            <p>Durum: <span className={`badge ${status.connected ? 'ok' : 'fail'}`}>{status.connected ? 'Bağlı' : 'Bağlı Değil'}</span> <span className="muted">{status.state || ''}</span></p>
            <p>Hesap: <strong>{status.account || '—'}</strong></p>
            {updatedAt && <p className="muted">Son yenileme: {updatedAt.toLocaleTimeString('tr-TR')}{refreshing ? ' · yenileniyor...' : ''}</p>}
            {!status.connected && qr && (qrSrc ? <><p className="muted">WhatsApp → Bağlı Cihazlar → Cihaz Bağla adımlarıyla tarayın:</p><img className="qr" src={qrSrc} alt="WhatsApp QR kodu" /></> : <><p className="muted">QR verisi:</p><pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{qr}</pre></>)}
            {!status.connected && !qr && <p className="muted">QR kodu için önce bağlanmayı başlatın.</p>}
            <div className="row" style={{ marginTop: 14 }}>
              <button className="btn" onClick={() => act(api.waConnect, 'Bağlantı başlatıldı. QR kodu kısa süre içinde görünecek.')}>Bağlan / QR Al</button>
              <button className="btn secondary btn-loading" onClick={() => load(true)} disabled={refreshing}>{refreshing && <Spinner small />}{refreshing ? 'Yenileniyor...' : 'Durumu Yenile'}</button>
              <button className="btn danger" onClick={() => act(api.waDisconnect, 'Bağlantı kesildi.')}>Bağlantıyı Kes</button>
            </div>
          </>
        )}
      </div>
    </>
  )
}
