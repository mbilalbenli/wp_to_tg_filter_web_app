import { useEffect, useState } from 'react'
import api from '../api'

const empty = { name: '', bot_token: '', chat_id: '', chat_title: '', is_default: false }

export default function Telegram() {
  const [targets, setTargets] = useState([])
  const [form, setForm] = useState(empty)
  const [editing, setEditing] = useState(null)
  const [step, setStep] = useState(1)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')

  const load = () => api.targets().then((d) => setTargets(Array.isArray(d) ? d : d.targets || [])).catch((e) => setError(e.message))
  useEffect(load, [])
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async (e) => {
    e.preventDefault(); setError(''); setMsg('')
    try {
      if (editing) await api.updateTarget(editing, form); else await api.createTarget(form)
      setMsg(editing ? 'Hedef güncellendi.' : 'Hedef oluşturuldu.')
      setForm(empty); setEditing(null); load()
    } catch (err) { setError(err.message) }
  }
  const test = async (id) => { setError(''); setMsg(''); try { await api.testTarget(id); setMsg('Test mesajı gönderildi.') } catch (e) { setError(e.message) } }
  const del = async (id) => { if (!confirm('Hedef silinsin mi?')) return; try { await api.deleteTarget(id); load() } catch (e) { setError(e.message) } }
  const edit = (t) => { setEditing(t.id); setForm({ name: t.name || '', bot_token: '', chat_id: t.chat_id || '', chat_title: t.chat_title || '', is_default: !!t.is_default }); setStep(1); window.scrollTo(0, 0) }

  return (
    <>
      <h1>Telegram Hedefleri</h1>
      <p className="muted">Bot ve sohbet bilgilerini adım adım girin.</p>
      {error && <div className="alert error">{error}</div>}
      {msg && <div className="alert success">{msg}</div>}

      <form className="card" onSubmit={submit}>
        <h2>{editing ? 'Hedefi Düzenle' : 'Yeni Hedef — Kurulum Sihirbazı'}</h2>
        <div className="steps">
          <span className={`step ${step === 1 ? 'active' : ''}`}>1. Bot Token</span>
          <span className={`step ${step === 2 ? 'active' : ''}`}>2. Chat ID</span>
          <span className={`step ${step === 3 ? 'active' : ''}`}>3. Test</span>
        </div>

        {step === 1 && (
          <>
            <div className="alert info">Telegram'da <strong>@BotFather</strong> ile konuşun, <strong>/newbot</strong> yazın, botunuza isim ve kullanıcı adı verin. BotFather size <code>123456:ABC-...</code> biçiminde bir token verecek, aşağıya yapıştırın.</div>
            <div className="field"><label>Hedef adı</label><input value={form.name} onChange={(e) => set('name', e.target.value)} required placeholder="Örn: Ana Kanal" /></div>
            <div className="field"><label>Bot token</label><input value={form.bot_token} onChange={(e) => set('bot_token', e.target.value)} required={!editing} placeholder={editing ? 'Değiştirmek için yeni token girin' : '123456:ABC-...'} /></div>
            <button type="button" className="btn" onClick={() => setStep(2)}>Sonraki Adım →</button>
          </>
        )}
        {step === 2 && (
          <>
            <div className="alert info">
              Chat ID bulma: 1) Botunuzu hedef sohbete/kanala ekleyin ve yönetici yapın. 2) Sohbete herhangi bir mesaj gönderin. 3) Tarayıcıda <code>https://api.telegram.org/bot&lt;TOKEN&gt;/getUpdates</code> adresini açın. 4) Yanıttaki <code>chat</code> → <code>id</code> değerini kopyalayın (kanallarda genellikle <code>-100...</code> ile başlar). Kişisel sohbet için <strong>@userinfobot</strong> da ID'nizi gösterebilir.
            </div>
            <div className="row">
              <div className="field"><label>Chat ID</label><input value={form.chat_id} onChange={(e) => set('chat_id', e.target.value)} required placeholder="-1001234567890" /></div>
              <div className="field"><label>Sohbet başlığı (isteğe bağlı)</label><input value={form.chat_title} onChange={(e) => set('chat_title', e.target.value)} placeholder="Örn: İş İlanları Kanalı" /></div>
            </div>
            <label className="check"><input type="checkbox" checked={form.is_default} onChange={(e) => set('is_default', e.target.checked)} /> Varsayılan hedef</label>
            <div className="row"><button type="button" className="btn secondary" onClick={() => setStep(1)}>← Geri</button><button type="button" className="btn" onClick={() => setStep(3)}>Sonraki Adım →</button></div>
          </>
        )}
        {step === 3 && (
          <>
            <div className="alert info">Önce hedefi kaydedin, ardından listedeki <strong>Test</strong> düğmesiyle test mesajı gönderip Telegram'da ulaşıp ulaşmadığını kontrol edin.</div>
            <p className="muted">Ad: {form.name || '—'} · Chat ID: {form.chat_id || '—'} · Varsayılan: {form.is_default ? 'Evet' : 'Hayır'}</p>
            <div className="row"><button type="button" className="btn secondary" onClick={() => setStep(2)}>← Geri</button><button className="btn">{editing ? 'Kaydet' : 'Hedefi Kaydet'}</button>{editing && <button type="button" className="btn secondary" onClick={() => { setEditing(null); setForm(empty) }}>İptal</button>}</div>
          </>
        )}
      </form>

      <div className="card">
        <h2>Kayıtlı Hedefler</h2>
        {targets.length === 0 ? <p className="muted">Henüz hedef yok.</p> : (
          <table><thead><tr><th>Ad</th><th>Token</th><th>Chat ID</th><th>Sohbet</th><th>Varsayılan</th><th></th></tr></thead>
            <tbody>{targets.map((t) => <tr key={t.id}><td>{t.name}</td><td>{t.bot_token_masked || '••••••'}</td><td>{t.chat_id}</td><td>{t.chat_title || ''}</td><td>{t.is_default ? 'Evet' : ''}</td><td><button className="btn secondary" onClick={() => test(t.id)}>Test</button>{' '}<button className="btn secondary" onClick={() => edit(t)}>Düzenle</button>{' '}<button className="btn danger" onClick={() => del(t.id)}>Sil</button></td></tr>)}</tbody></table>
        )}
      </div>
    </>
  )
}
