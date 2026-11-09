import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api, { setToken } from '../api'

export default function Login() {
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const submit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const data = await api.login(username, password)
      setToken(data.access_token)
      navigate('/')
    } catch (err) { setError(err.message || 'Giriş başarısız.') } finally { setLoading(false) }
  }

  return (
    <div className="login-wrap">
      <form className="card login-card" onSubmit={submit}>
        <h1>Giriş Yap</h1>
        <p className="muted">WhatsApp → Telegram Filtre Paneli</p>
        {error && <div className="alert error">{error}</div>}
        <div className="field"><label>Kullanıcı adı</label><input value={username} onChange={(e) => setUsername(e.target.value)} required autoComplete="username" /></div>
        <div className="field"><label>Şifre</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" /></div>
        <button className="btn" style={{ width: '100%' }} disabled={loading}>{loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}</button>
      </form>
    </div>
  )
}
