import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './useAuth'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ClienteLayout from './components/ClienteLayout'
import ClienteDashboardPage from './pages/ClienteDashboardPage'
import ClientePesquisasPage from './pages/ClientePesquisasPage'
import ClienteUnidadesPage from './pages/ClienteUnidadesPage'
import ClienteDispositivosPage from './pages/ClienteDispositivosPage'
import Totem from './pages/Totem'
import ClientePainel from './pages/ClientePainel'

export default function App() {
  const { session, perfil, carregando } = useAuth()
  const location = useLocation()

  // A tela do totem é pública — roda sem login, direto no PC/tablet do cliente
  if (location.pathname.startsWith('/totem/')) {
    return (
      <Routes>
        <Route path="/totem/:token" element={<Totem />} />
      </Routes>
    )
  }

  if (carregando) {
    return <div className="empty-state" style={{ paddingTop: 80 }}>Carregando…</div>
  }

  if (!session) {
    return (
      <Routes>
        <Route path="*" element={<Login />} />
      </Routes>
    )
  }

  if (perfil && perfil.papel === 'admin_cliente') {
    if (perfil.cliente_status !== 'ativo') {
      return (
        <div className="empty-state" style={{ paddingTop: 80 }}>
          Seu acesso ao Satisfy está temporariamente indisponível.
          <div style={{ fontSize: 13, marginTop: 8 }}>Fale com o responsável pela sua licença para regularizar.</div>
        </div>
      )
    }
    return <ClientePainel perfil={perfil} />
  }

  if (perfil && perfil.papel !== 'mestre') {
    return (
      <div className="empty-state" style={{ paddingTop: 80 }}>
        Sua conta ainda não tem um papel de acesso configurado. Fale com o administrador do Satisfy.
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/clientes/:id" element={<ClienteLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<ClienteDashboardPage />} />
        <Route path="pesquisas" element={<ClientePesquisasPage />} />
        <Route path="unidades" element={<ClienteUnidadesPage />} />
        <Route path="dispositivos" element={<ClienteDispositivosPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}
