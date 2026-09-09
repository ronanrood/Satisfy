import { useState, useEffect } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase } from '../supabaseClient'
import logo from '../img/logo.png'
import logoMini from '../img/logo_mini.png'

const ICONE_CLIENTES = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)

const ICONE_SAIR = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
)

export default function Layout({ children }) {
  const [menuAberto, setMenuAberto] = useState(false)
  const [colapsado, setColapsado] = useState(() => {
    return localStorage.getItem('satisfy_sidebar_collapsed') === 'true'
  })

  const toggleSidebar = () => {
    const proximo = !colapsado
    setColapsado(proximo)
    localStorage.setItem('satisfy_sidebar_collapsed', String(proximo))
  }

  return (
    <div className={`shell${colapsado ? ' sidebar-is-collapsed' : ''}`}>
      <button className="hamburger-btn" onClick={() => setMenuAberto(true)} aria-label="Abrir menu">☰</button>
      {menuAberto && <div className="sidebar-overlay open" onClick={() => setMenuAberto(false)} />}

      <div className={`sidebar-wrapper${colapsado ? ' collapsed' : ''}${menuAberto ? ' open' : ''}`}>
        {/* Botão para Recolher / Expandir a barra lateral */}
        <button
          className="sidebar-collapse-btn"
          onClick={toggleSidebar}
          title={colapsado ? 'Expandir menu' : 'Recolher menu'}
          type="button"
          aria-label={colapsado ? 'Expandir menu' : 'Recolher menu'}
        >
          {colapsado ? <ChevronRight style={{ width: 14, height: 14 }} /> : <ChevronLeft style={{ width: 14, height: 14 }} />}
        </button>

        <aside className={`sidebar${colapsado ? ' collapsed' : ''}`}>
          <div className="sidebar-logo">
            <Link to="/" title="Satisfy">
              <img src={colapsado ? logoMini : logo} alt="Satisfy" />
            </Link>
          </div>

          <nav className="sidebar-nav">
            <NavLink
              to="/"
              end
              onClick={() => setMenuAberto(false)}
              className={({ isActive }) => (isActive ? 'active' : '')}
              title="Clientes"
            >
              {ICONE_CLIENTES}
              <span>Clientes</span>
            </NavLink>
          </nav>

          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 4, width: '100%', paddingBottom: 6 }}>
            <button
              className="sidebar-logout"
              onClick={() => supabase.auth.signOut()}
              title="Sair da conta"
              type="button"
            >
              {ICONE_SAIR}
              <span>Sair</span>
            </button>
          </div>
        </aside>
      </div>

      <main className="main">
        <div className="main-content-inner">{children}</div>
      </main>
    </div>
  )
}
