import { useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import logo from '../img/logo.png'

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

  return (
    <div className="shell">
      <button className="hamburger-btn" onClick={() => setMenuAberto(true)} aria-label="Abrir menu">☰</button>
      {menuAberto && <div className="sidebar-overlay open" onClick={() => setMenuAberto(false)} />}

      <aside className={`sidebar${menuAberto ? ' open' : ''}`}>
        <div className="sidebar-logo">
          <Link to="/">
            <img src={logo} alt="Satisfy" />
          </Link>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/" end onClick={() => setMenuAberto(false)} className={({ isActive }) => (isActive ? 'active' : '')}>
            {ICONE_CLIENTES}Clientes
          </NavLink>
        </nav>

        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <button className="sidebar-logout" onClick={() => supabase.auth.signOut()}>{ICONE_SAIR}Sair</button>
        </div>

        <div className="sidebar-footer">Painel Mestre</div>
      </aside>

      <main className="main">{children}</main>
    </div>
  )
}
