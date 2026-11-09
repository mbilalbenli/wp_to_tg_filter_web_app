import { useEffect, useRef, useState } from 'react'
import api from '../api'

const empty = { name: '', bot_token: '', chat_id: '', chat_title: '', is_default: false }
const STEPS = ['1. Bot + Token', '2. Sohbeti Bağla', '3. Kaydet', '4. Test Et']

export default function Telegram() {
  const [targets, setTargets] = useState([])
  const [form, setForm] = useState(empty)
  const [editing, setEditing] = useState(null)
  const [step, setStep] = useState(1)
  const [bot, setBot] = useState(null)
  const [validating, setValidating] = useState(false)
  const [chats, setChats] = useState([])
  const [searching, setSearching] = useState(false)
  const [savedId, setSavedId] = useState(null)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const pollRef = useRef(null)

  const load = () => api.targets().then((d) => setTargets(Array.isArray(d) ? d : d.targets || [])).catch((e) => setError(e.message))
  useEffect(() => { load(); return () => clearInterval(pollRef.current) }, [])
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const validate = async () => {
    setError(''); setBot(null); setValidating(true)
    try {
      const d = await api.validateToken(form.bot_token.trim())
      setBot(d.bot)
      if (!form.name) set('name', d.bot.first_name || d.bot.username || '')
      setStep(2)
    } catch (e) { setError(e.message) } finally { setValidating(false) }
  }

  const discoverOnce = async () => {
    const d = await api.discoverChat(form.bot_token.trim())
    if (d.chats?.length) { setChats(d.chats); return true }
    return false
  }
  const startSearch = async () => {
    setError(''); setChats([]); setSearching(true)
    try {
      if (await discoverOnce()) { setSearching(false); return }
      let tries = 0
      clearInterval(pollRef.current)
      pollRef.current = setInterval(async () => {
        tries += 1
        try { if (await discoverOnce() || tries >= 20) { clearInterval(pollRef.current); setSearching(false) } }
        catch { clearInterval(pollRef.current); setSearching(false) }
      }, 3000)
    } catch (e) { setError(e.message); setSearching(false) }
  }
  const pickChat = (c) => { set('chat_id', c.chat_id); set('chat_title', c.title || ''); if (!form.name) set('name', c.title || '') }

  const submit = async (e) => {
    e.preventDefault(); setError(''); setMsg('')
    try {
      const d = editing ? await api.updateTarget(editing, form) : await api.createTarget(form)
      setSavedId(d.id || editing); setMsg('Hedef kaydedildi. Şimdi test mesajı gönderin.'); setStep(4); load()
    } catch (err) { setError(err.message) }
  }
  const test = async (id) => {
    setError(''); setMsg('')
    try { const d = await api.testTarget(id); if (d.ok) setMsg('Test mesajı gönderildi. Telegram sohbetinizi kontrol edin.'); else setError(d.error || 'Test mesajı gönderilemedi.') }
    catch (e) { setError(e.message) }
  }
  const del = async (id) => { if (!confirm('Hedef silinsin mi?')) return; try { await api.deleteTarget(id); load() } catch (e) { setError(e.message) } }
  const edit = (t) => {
    setEditing(t.id); setSavedId(null); setBot(null); setChats([])
    setForm({ name: t.name || '', bot_token: '', chat_id: t.chat_id || '', chat_title: t.chat_title || '', is_default: !!t.is_default })
    setStep(1); window.scrollTo(0, 0)
  }
  const reset = () => { setEditing(null); setForm(empty); setBot(null); setChats([]); setSavedId(null); setStep(1) }

  return (
    <>
      <h1>Telegram Hedefleri</h1>
      <p className="muted">Dört adımda botu bağlayın. Chat ID elle aranmaz; sistem otomatik bulur.</p>
      {error && <div className="alert error">{error}</div>}
      {msg && <div className="alert success">{msg}</div>}

      <form className="card" onSubmit={submit}>
        <h2>{editing ? 'Hedefi Düzenle' : 'Yeni Hedef — Kurulum Sihirbazı'}</h2>
        <div className="steps">{STEPS.map((s, i) => <span key={s} className={`step ${step === i + 1 ? 'active' : step > i + 1 ? 'done' : ''}`}>{s}</span>)}</div>

        {step === 1 && (
          <>
            <div className="alert info">
              <strong>Bot oluşturma (1 dakika):</strong>
              <ol style={{ margin: '8px 0 0', paddingLeft: 18 }}>
                <li>Aşağıdaki düğmeyle BotFather'ı açın.</li>
                <li><code>/newbot</code> gönderin, bota bir isim ve <code>...bot</code> ile biten bir kullanıcı adı verin.</li>
                <li>BotFather'ın verdiği uzun tokeni kopyalayıp aşağıya yapıştırın ve <strong>Tokeni Doğrula</strong>'ya basın.</li>
              </ol>
            </div>
            <div className="row" style={{ marginBottom: 12 }}>
              <a className="btn" href="https://t.me/BotFather" target="_blank" rel="noreferrer">BotFather'ı Aç ↗</a>
              <button type="button" className="btn secondary" onClick={() => navigator.clipboard?.writeText('/newbot')}>/newbot Komutunu Kopyala</button>
            </div>
            <div className="field"><label>Bot token</label><input value={form.bot_token} onChange={(e) => { set('bot_token', e.target.value); setBot(null) }} required={!editing} placeholder={editing ? 'Değiştirmek için yeni token girin, boş bırakmayın' : '123456789:ABC-...'} /></div>
            {bot && <div className="alert success">Bot doğrulandı: <strong>@{bot.username}</strong> ({bot.first_name})</div>}
            <button type="button" className="btn" disabled={validating || !form.bot_token.trim()} onClick={validate}>{validating ? 'Doğrulanıyor...' : 'Tokeni Doğrula ve Devam Et →'}</button>
            {editing && <p className="muted" style={{ marginTop: 8 }}>Düzenlemede tokeni değiştirmeden devam etmek için hedef listesinden vazgeçip yeniden oluşturmanız gerekmez; token alanına mevcut tokeni tekrar yapıştırın.</p>}
          </>
        )}

        {step === 2 && (
          <>
            <div className="alert info">
              <strong>Chat ID otomatik toplanır.</strong> Şöyle çalışır: bota bir mesaj geldiğinde Telegram bunu saklar; sistem <code>getUpdates</code> ile o mesajı okuyup sohbetin ID'sini çıkarır. Elle ID aramanız gerekmez.
              <ol style={{ margin: '8px 0 0', paddingLeft: 18 }}>
                <li><strong>Kişisel sohbet için:</strong> "Botu Aç" düğmesiyle botunuzu açın ve <strong>Başlat</strong>'a basıp herhangi bir mesaj yazın (örn. <code>merhaba</code>).</li>
                <li><strong>Grup için:</strong> botu gruba ekleyin ve grupta bir mesaj yazın. <strong>Kanal için:</strong> botu yönetici yapıp kanalda bir paylaşım yapın.</li>
                <li>Sonra burada <strong>Sohbeti Otomatik Bul</strong>'a basın; bulunan sohbeti listeden seçin.</li>
              </ol>
            </div>
            <div className="row" style={{ marginBottom: 12 }}>
              {bot?.link && <a className="btn" href={bot.link} target="_blank" rel="noreferrer">Botu Aç (@{bot.username}) ↗</a>}
              <button type="button" className="btn" onClick={startSearch} disabled={searching}>{searching ? 'Sohbet aranıyor... (bota mesaj yazın)' : 'Sohbeti Otomatik Bul'}</button>
            </div>
            {chats.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                {chats.map((c) => (
                  <label key={c.chat_id} className="check" style={{ display: 'block', marginBottom: 6 }}>
                    <input type="radio" name="chat" checked={form.chat_id === c.chat_id} onChange={() => pickChat(c)} />{' '}
                    <strong>{c.title || c.chat_id}</strong> <span className="muted">({c.type}) · ID: {c.chat_id}</span>
                  </label>
                ))}
              </div>
            )}
            <details style={{ marginBottom: 12 }}>
              <summary className="muted">Chat ID'yi elle girmek istiyorum</summary>
              <div className="row" style={{ marginTop: 8 }}>
                <div className="field"><label>Chat ID</label><input value={form.chat_id} onChange={(e) => set('chat_id', e.target.value)} placeholder="-1001234567890" /></div>
                <div className="field"><label>Sohbet başlığı</label><input value={form.chat_title} onChange={(e) => set('chat_title', e.target.value)} /></div>
              </div>
            </details>
            <div className="row">
              <button type="button" className="btn secondary" onClick={() => setStep(1)}>← Geri</button>
              <button type="button" className="btn" disabled={!form.chat_id} onClick={() => setStep(3)}>Sohbet Seçildi, Devam Et →</button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="field"><label>Hedef adı</label><input value={form.name} onChange={(e) => set('name', e.target.value)} required placeholder="Örn: Kişisel Telegramım" /></div>
            <p className="muted">Bot: {bot ? `@${bot.username}` : '—'} · Chat ID: {form.chat_id || '—'} · Sohbet: {form.chat_title || '—'}</p>
            <label className="check"><input type="checkbox" checked={form.is_default} onChange={(e) => set('is_default', e.target.checked)} /> Varsayılan hedef (filtrede hedef seçilmezse bu kullanılır)</label>
            <div className="row" style={{ marginTop: 12 }}>
              <button type="button" className="btn secondary" onClick={() => setStep(2)}>← Geri</button>
              <button className="btn">{editing ? 'Kaydet ve Teste Geç' : 'Hedefi Kaydet ve Teste Geç'}</button>
              {editing && <button type="button" className="btn secondary" onClick={reset}>İptal</button>}
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <div className="alert info">Test mesajı, kaydettiğiniz bot üzerinden seçtiğiniz sohbete gönderilir. Telegram'da mesajı görürseniz kurulum tamamdır; filtreler bu hedefi kullanabilir.</div>
            <div className="row">
              <button type="button" className="btn" disabled={!savedId && !editing} onClick={() => test(savedId || editing)}>Test Mesajı Gönder</button>
              <button type="button" className="btn secondary" onClick={reset}>Yeni Hedef Ekle</button>
            </div>
          </>
        )}
      </form>

      <div className="card">
        <h2>Kayıtlı Hedefler</h2>
        {targets.length === 0 ? <p className="muted">Henüz hedef yok. Yukarıdaki sihirbazla ilk botu bağlayın.</p> : (
          <table><thead><tr><th>Ad</th><th>Token</th><th>Chat ID</th><th>Sohbet</th><th>Varsayılan</th><th></th></tr></thead>
            <tbody>{targets.map((t) => <tr key={t.id}><td>{t.name}</td><td>{t.bot_token_masked || '••••••'}</td><td>{t.chat_id}</td><td>{t.chat_title || ''}</td><td>{t.is_default ? 'Evet' : ''}</td><td><button type="button" className="btn secondary" onClick={() => test(t.id)}>Test</button>{' '}<button type="button" className="btn secondary" onClick={() => edit(t)}>Düzenle</button>{' '}<button type="button" className="btn danger" onClick={() => del(t.id)}>Sil</button></td></tr>)}</tbody></table>
        )}
      </div>
    </>
  )
}
