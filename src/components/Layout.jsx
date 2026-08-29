import { NavLink } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function Layout({ children }) {
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar-brand"><span className="dot" />Satisfy</div>
        <nav className="sidebar-nav">
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
            Clientes
          </NavLink>
          <button onClick={() => supabase.auth.signOut()}>Sair</button>
        </nav>
        <div className="sidebar-footer">Painel Mestre</div>
      </aside>
      <main className="main">{children}</main>
    </div>
  )
}
