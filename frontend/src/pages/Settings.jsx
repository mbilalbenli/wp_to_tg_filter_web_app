import { useEffect, useState } from 'react'
import api from '../api'
import { ErrorBox, Spinner, useToast } from '../components/feedback'

export default function Settings() {
  const toast = useToast()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ default_case_sensitive: false, default_whole_word: false, default_turkish_normalize: true })
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  useEffect(() => { api.settings().then((d) => { if (d) setForm((f) => ({ ...f, ...d })) }).catch((e) => setError(e.message)) }, [])
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const submit = async (e) => { e.preventDefault(); setError(''); setMsg(''); setSaving(true); try { await api.updateSettings(form); toast.success('Ayarlar kaydedildi.') } catch (err) { setError(err.message) } finally { setSaving(false) } }

  return (
    <>
      <h1>Ayarlar</h1>
      <p className="muted">Genel eşleşme varsayılanları</p>
      <ErrorBox message={error} />
      <form className="card" onSubmit={submit}>
        <h2>Varsayılan Eşleşme Ayarları</h2>
        <p className="muted">Yeni filtrelerde ön tanımlı gelen değerlerdir. Her filtre kendi ayarıyla bunları değiştirebilir.</p>
        <label className="check"><input type="checkbox" checked={!!form.default_case_sensitive} onChange={(e) => set('default_case_sensitive', e.target.checked)} /> Varsayılan: büyük/küçük harf duyarlı</label>
        <label className="check"><input type="checkbox" checked={!!form.default_whole_word} onChange={(e) => set('default_whole_word', e.target.checked)} /> Varsayılan: tam kelime eşleşmesi</label>
        <label className="check"><input type="checkbox" checked={!!form.default_turkish_normalize} onChange={(e) => set('default_turkish_normalize', e.target.checked)} /> Varsayılan: Türkçe karakter normalize et</label>
        <button className="btn btn-loading" style={{ marginTop: 10 }} disabled={saving}>{saving && <Spinner small />}Kaydet</button>
      </form>
      <div className="card">
        <h2>Şifre Değiştirme</h2>
        <p className="muted">Bu demo sürümünde şifre değiştirme panelden yapılamıyor. Şifreyi sunucudaki <code>ADMIN_PASSWORD</code> ortam değişkeninden değiştirip uygulamayı yeniden başlatın.</p>
      </div>
    </>
  )
}
