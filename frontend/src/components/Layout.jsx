import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { setToken } from '../api'

const links = [
  ['/', 'Panel'],
  ['/whatsapp', 'WhatsApp'],
  ['/groups', 'Gruplar'],
  ['/filters', 'Filtreler'],
  ['/telegram', 'Telegram'],
  ['/history', 'Geçmiş'],
  ['/settings', 'Ayarlar'],
]

export default function Layout() {
  const navigate = useNavigate()
  const logout = () => { setToken(null); navigate('/login') }
  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">WP <span>→</span> Telegram<br /><span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 400 }}>Filtre Paneli</span></div>
        {links.map(([to, label]) => (
          <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `navlink${isActive ? ' active' : ''}`}>{label}</NavLink>
        ))}
        <div style={{ flex: 1 }} />
        <button className="btn secondary" onClick={logout}>Çıkış Yap</button>
      </aside>
      <main className="main"><Outlet /></main>
    </div>
  )
}
