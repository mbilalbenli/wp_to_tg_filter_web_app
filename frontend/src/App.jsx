import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { isAuthed } from './api'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import WhatsApp from './pages/WhatsApp'
import Groups from './pages/Groups'
import Filters from './pages/Filters'
import Telegram from './pages/Telegram'
import History from './pages/History'
import Settings from './pages/Settings'

const Protected = ({ children }) => (isAuthed() ? children : <Navigate to="/login" replace />)

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<Protected><Layout /></Protected>}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/whatsapp" element={<WhatsApp />} />
          <Route path="/groups" element={<Groups />} />
          <Route path="/filters" element={<Filters />} />
          <Route path="/telegram" element={<Telegram />} />
          <Route path="/history" element={<History />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
