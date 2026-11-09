const BASE = import.meta.env.VITE_API_BASE || '/api'

export const getToken = () => localStorage.getItem('token')
export const setToken = (t) => t ? localStorage.setItem('token', t) : localStorage.removeItem('token')
export const isAuthed = () => !!getToken()

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  let res
  try {
    res = await fetch(`${BASE}${path}`, { ...options, headers })
  } catch {
    throw new Error('Sunucuya ulaşılamıyor. Backend çalışıyor mu kontrol edin.')
  }
  if (res.status === 401) {
    setToken(null)
    if (window.location.pathname !== '/login') window.location.href = '/login'
    throw new Error('Oturum süresi doldu. Lütfen tekrar giriş yapın.')
  }
  const text = await res.text()
  let data = null
  try { data = text ? JSON.parse(text) : null } catch { data = text }
  if (!res.ok) {
    const msg = data?.detail || data?.message || `İstek başarısız (${res.status})`
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg))
  }
  return data
}

export const api = {
  login: (username, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  me: () => request('/auth/me'),
  dashboard: () => request('/dashboard'),
  health: () => request('/health'),
  waStatus: () => request('/whatsapp/status'),
  waConnect: () => request('/whatsapp/connect', { method: 'POST' }),
  waDisconnect: () => request('/whatsapp/disconnect', { method: 'POST' }),
  groups: () => request('/groups'),
  saveGroupSelection: (group_ids) => request('/groups/selection', { method: 'PUT', body: JSON.stringify({ group_ids }) }),
  syncGroups: () => request('/groups/sync', { method: 'POST' }),
  filters: () => request('/filters'),
  createFilter: (body) => request('/filters', { method: 'POST', body: JSON.stringify(body) }),
  updateFilter: (id, body) => request(`/filters/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteFilter: (id) => request(`/filters/${id}`, { method: 'DELETE' }),
  targets: () => request('/telegram/targets'),
  createTarget: (body) => request('/telegram/targets', { method: 'POST', body: JSON.stringify(body) }),
  updateTarget: (id, body) => request(`/telegram/targets/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteTarget: (id) => request(`/telegram/targets/${id}`, { method: 'DELETE' }),
  testTarget: (id) => request(`/telegram/targets/${id}/test`, { method: 'POST' }),
  settings: () => request('/settings'),
  updateSettings: (body) => request('/settings', { method: 'PUT', body: JSON.stringify(body) }),
  history: (params = {}) => {
    const q = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => { if (v !== '' && v != null) q.set(k, v) })
    const s = q.toString()
    return request(`/history${s ? `?${s}` : ''}`)
  },
}
export default api
