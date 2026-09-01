import { useEffect, useState } from 'react'
import { NavLink, Outlet, useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import logo from '../img/logo.png'

const ICONES = {
  dashboard: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  ),
  pesquisas: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3h8a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
      <path d="M9 8h6M9 12h6M9 16h3" />
    </svg>
  ),
  unidades: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21V9l6-4 6 4v12" />
      <path d="M15 21V13l6-3v11" />
      <path d="M9 21v-5h3v5" />
    </svg>
  ),
  dispositivos: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="14" height="10" rx="1.5" />
      <path d="M8 20h4" />
      <rect x="18" y="9" width="4" height="9" rx="1" />
    </svg>
  ),
}

export default function ClienteLayout() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [cliente, setCliente] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [editando, setEditando] = useState(false)
  const [menuAberto, setMenuAberto] = useState(false)

  useEffect(() => {
    buscarCliente()
  }, [id])

  async function buscarCliente() {
    setCarregando(true)
    const { data } = await supabase.from('clientes').select('*').eq('id', id).single()
    setCliente(data)
    setCarregando(false)
  }

  async function excluirCliente() {
    const confirmado = window.confirm(
      `Excluir "${cliente.nome}"? Isso apaga TODAS as unidades, totens, pesquisas e respostas desse cliente. Não pode ser desfeito.`
    )
    if (!confirmado) return
    await supabase.from('clientes').delete().eq('id', cliente.id)
    navigate('/')
  }

  const linksNav = [
    { to: 'dashboard', label: 'Dashboard', icone: ICONES.dashboard },
    { to: 'pesquisas', label: 'Pesquisas', icone: ICONES.pesquisas },
    { to: 'unidades', label: 'Unidades', icone: ICONES.unidades },
    { to: 'dispositivos', label: 'Dispositivos', icone: ICONES.dispositivos },
  ]

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
          {linksNav.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              onClick={() => setMenuAberto(false)}
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              {l.icone}{l.label}
            </NavLink>
          ))}
        </nav>

        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Link to="/" style={{ fontSize: 13, color: '#8fa0aa', padding: '10px 12px' }}>← Todos os clientes</Link>
          <button onClick={() => supabase.auth.signOut()}>Sair</button>
        </div>
      </aside>

      <main className="main">
        {carregando ? (
          <p className="empty-state">Carregando…</p>
        ) : !cliente ? (
          <p className="empty-state">Cliente não encontrado.</p>
        ) : (
          <>
            <div className="page-header">
              {editando ? (
                <EdicaoCliente
                  cliente={cliente}
                  onCancelar={() => setEditando(false)}
                  onSalvo={() => {
                    setEditando(false)
                    buscarCliente()
                  }}
                />
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div className="page-eyebrow">{cliente.plano} · <span className={`pill ${cliente.status}`}>{cliente.status}</span></div>
                    <h1 className="page-title">{cliente.nome}</h1>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn-ghost" onClick={() => setEditando(true)}>Editar cliente</button>
                    <button className="btn-ghost" style={{ color: 'var(--red)' }} onClick={excluirCliente}>Excluir cliente</button>
                  </div>
                </div>
              )}
            </div>

            <Outlet context={{ clienteId: id, cliente }} />
          </>
        )}
      </main>
    </div>
  )
}

function EdicaoCliente({ cliente, onCancelar, onSalvo }) {
  const [nome, setNome] = useState(cliente.nome)
  const [plano, setPlano] = useState(cliente.plano)
  const [status, setStatus] = useState(cliente.status)
  const [salvando, setSalvando] = useState(false)

  async function salvar() {
    setSalvando(true)
    await supabase.from('clientes').update({ nome, plano, status }).eq('id', cliente.id)
    setSalvando(false)
    onSalvo()
  }

  return (
    <div className="card" style={{ marginBottom: 0 }}>
      <div className="field">
        <label htmlFor="editNome">Nome do cliente</label>
        <input id="editNome" value={nome} onChange={(e) => setNome(e.target.value)} autoFocus />
      </div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div className="field" style={{ flex: '1 1 160px' }}>
          <label htmlFor="editPlano">Plano</label>
          <select id="editPlano" value={plano} onChange={(e) => setPlano(e.target.value)}>
            <option value="trial">Trial</option>
            <option value="basico">Básico</option>
            <option value="pro">Pro</option>
          </select>
        </div>
        <div className="field" style={{ flex: '1 1 160px' }}>
          <label htmlFor="editStatus">Status</label>
          <select id="editStatus" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="ativo">Ativo</option>
            <option value="suspenso">Suspenso</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-primary" onClick={salvar} disabled={salvando}>{salvando ? 'Salvando…' : 'Salvar'}</button>
        <button className="btn-ghost" onClick={onCancelar}>Cancelar</button>
      </div>
    </div>
  )
}
