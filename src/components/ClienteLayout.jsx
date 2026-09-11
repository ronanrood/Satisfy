import { useEffect, useState } from 'react'
import { NavLink, Outlet, useParams, useNavigate, Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Kanban,
  MessageSquare,
  Users,
  Calendar,
  ShieldCheck,
  Settings,
  Bot,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  Check,
  X,
  Mail,
} from 'lucide-react'
import { supabase } from '../supabaseClient'
import logo from '../img/LogoSatisfyWhite.svg'
import logoMini from '../img/favicon.svg'
import SDROnboardingWizard from './sdr/SDROnboardingWizard'
import ModalPrivacidadeLGPD from './ModalPrivacidadeLGPD'
import { sdrService } from '../services/sdrService'

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

const ICONE_SAIR = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
)

export default function ClienteLayout() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [cliente, setCliente] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [editando, setEditando] = useState(false)
  const [menuAberto, setMenuAberto] = useState(false)
  const [wizardAberto, setWizardAberto] = useState(false)
  const [modalLgpdAberto, setModalLgpdAberto] = useState(false)
  const [sdrConfigurado, setSdrConfigurado] = useState(false)

  // Auto-expand SDR submenu if current route is under sdr
  const isSdrRoute = location.pathname.includes('/sdr/')
  const [sdrAberto, setSdrAberto] = useState(isSdrRoute)

  useEffect(() => {
    if (isSdrRoute && !sdrAberto) setSdrAberto(true)
  }, [isSdrRoute])

  useEffect(() => {
    buscarCliente()
    verificarConfiguracaoSDR()
  }, [id])

  function verificarConfiguracaoSDR() {
    if (!id) return
    const settings = sdrService.getSettings(id)
    setSdrConfigurado(!!settings?.is_configured)
  }

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

  // Submenu items matching screenshot 2 from Lovable
  const sdrSubmenuLinks = [
    { to: 'sdr/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
    { to: 'sdr/pipeline', label: 'Pipeline', Icon: Kanban },
    { to: 'sdr/chat', label: 'Chat Ao Vivo', Icon: MessageSquare },
    { to: 'sdr/contacts', label: 'Contatos', Icon: Users },
    { to: 'sdr/scheduling', label: 'Agendamentos', Icon: Calendar },
    { to: 'sdr/team', label: 'Equipe', Icon: ShieldCheck },
    { to: 'sdr/settings', label: 'Configurações', Icon: Settings },
  ]

  const handleSDRClick = () => {
    setSdrAberto(!sdrAberto)
    if (!isSdrRoute) {
      navigate(`sdr/dashboard`)
    }
  }

  const handleWizardCompleted = (settings) => {
    setSdrConfigurado(true)
    setSdrAberto(true)
  }

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
            {linksNav.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                onClick={() => setMenuAberto(false)}
                className={({ isActive }) => (isActive ? 'active' : '')}
                title={l.label}
              >
                {l.icone}
                <span>{l.label}</span>
              </NavLink>
            ))}

            {/* SDR Group with Submenu - ALWAYS ACCESSIBLE */}
            <div className="sidebar-submenu" style={{ marginTop: 6 }}>
              <button
                className={`sidebar-submenu-toggle${isSdrRoute ? ' active' : ''}`}
                onClick={handleSDRClick}
                title="Módulo SDR"
                type="button"
              >
                <Bot className="h-5 w-5" style={{ color: 'var(--amber)', flexShrink: 0 }} />
                <span className="sidebar-submenu-label">SDR</span>
                <span className={`sidebar-submenu-chevron${sdrAberto ? ' open' : ''}`}>
                  <ChevronDown className="h-4 w-4" />
                </span>
              </button>

              {/* Submenu Children (Always accessible in sidebar) */}
              <div className={`sidebar-submenu-children${sdrAberto ? ' open' : ''}`}>
                <div className="sidebar-submenu-children-inner">
                  {sdrSubmenuLinks.map((l) => {
                    const SubIcon = l.Icon
                    return (
                      <NavLink
                        key={l.to}
                        to={l.to}
                        onClick={() => setMenuAberto(false)}
                        className={({ isActive }) =>
                          `sidebar-submenu-child${isActive ? ' active' : ''}`
                        }
                        title={l.label}
                      >
                        <SubIcon className="h-4 w-4" />
                        <span>{l.label}</span>
                      </NavLink>
                    )
                  })}
                </div>
              </div>
            </div>
          </nav>

          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 6, width: '100%', paddingBottom: 6 }}>
            <Link to="/" className="sidebar-back" style={{ fontSize: 13, color: '#8fa0aa', padding: '8px 10px' }} title="Todos os clientes">
              ← <span>Todos os clientes</span>
            </Link>
            <p
              className="sidebar-privacy-link"
              onClick={() => setModalLgpdAberto(true)}
              title="Privacidade & LGPD"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setModalLgpdAberto(true)
                }
              }}
            >
              <ShieldCheck style={{ width: 14, height: 14 }} className="sidebar-privacy-icon" />
              <span>Privacidade & LGPD</span>
            </p>

            <button
              className="sidebar-logout"
              onClick={() => supabase.auth.signOut()}
              title="Sair da conta"
              type="button"
            >
              {ICONE_SAIR}
              <span>Sair</span>
            </button>

            <div className="sidebar-dev-credit">
              <span>Desenvolvido por </span>
              <a
                href="https://www.nuvdev.com"
                target="_blank"
                rel="noopener noreferrer"
                title="Visitar www.nuvdev.com"
              >
                Nuvdev
              </a>
            </div>
          </div>
        </aside>
      </div>

      <main className="main">
        <div className="main-content-inner">
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
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <button className="btn-ghost" onClick={() => setEditando(true)}>
                        <Pencil style={{ width: 14, height: 14 }} />
                        Editar cliente
                      </button>
                      <button className="btn-ghost danger" onClick={excluirCliente}>
                        <Trash2 style={{ width: 14, height: 14 }} />
                        Excluir cliente
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <Outlet context={{ clienteId: id, cliente, openWizard: () => setWizardAberto(true) }} />
            </>
          )}
        </div>
      </main>

      {/* 7-Step Onboarding Wizard Modal */}
      <SDROnboardingWizard
        isOpen={wizardAberto}
        onClose={() => setWizardAberto(false)}
        clienteId={id}
        onCompleted={handleWizardCompleted}
      />

      {/* Modal Resumo de Privacidade & LGPD */}
      <ModalPrivacidadeLGPD
        aberto={modalLgpdAberto}
        onClose={() => setModalLgpdAberto(false)}
        onVerMais={() => navigate(`/clientes/${id}/privacidade`)}
      />
    </div>
  )
}

function EdicaoCliente({ cliente, onCancelar, onSalvo }) {
  const [nome, setNome] = useState(cliente.nome)
  const [plano, setPlano] = useState(cliente.plano)
  const [status, setStatus] = useState(cliente.status)
  const [emailRelatorio, setEmailRelatorio] = useState(cliente.email_relatorio || '')
  const [receberRelatorioSemanal, setReceberRelatorioSemanal] = useState(cliente.receber_relatorio_semanal !== false)
  const [salvando, setSalvando] = useState(false)

  async function salvar(e) {
    if (e) e.preventDefault()
    setSalvando(true)

    const payload = {
      nome: nome.trim(),
      plano,
      status,
      email_relatorio: emailRelatorio.trim() || null,
      receber_relatorio_semanal: Boolean(receberRelatorioSemanal),
    }

    let { error } = await supabase.from('clientes').update(payload).eq('id', cliente.id)

    // Tratamento resiliente caso a tabela ainda não tenha a nova coluna
    if (error && error.code === 'PGRST204') {
      const fallback = await supabase.from('clientes').update({ nome: nome.trim(), plano, status }).eq('id', cliente.id)
      if (!fallback.error) {
        alert('Dados salvos!\n\nNota: Para persistir o e-mail de relatório semanal, execute o script "supabase_migration_relatorios.sql" no SQL Editor do seu Supabase.')
        setSalvando(false)
        onSalvo()
        return
      }
    }

    setSalvando(false)
    onSalvo()
  }

  return (
    <form onSubmit={salvar} className="panel-card form-card-box" style={{ marginBottom: 24 }}>
      <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: 700, color: 'var(--ink)' }}>
        Editar Dados do Cliente
      </h3>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 18 }}>
        <div className="form-field" style={{ flex: '2 1 260px' }}>
          <label htmlFor="editNome">Nome da Empresa</label>
          <input
            id="editNome"
            className="text-input"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
            autoFocus
          />
        </div>
        <div className="form-field" style={{ flex: '1 1 140px' }}>
          <label htmlFor="editPlano">Plano de Licença</label>
          <select
            id="editPlano"
            className="text-input"
            value={plano}
            onChange={(e) => setPlano(e.target.value)}
          >
            <option value="trial">Trial</option>
            <option value="basico">Básico</option>
            <option value="pro">Pro</option>
          </select>
        </div>
        <div className="form-field" style={{ flex: '1 1 140px' }}>
          <label htmlFor="editStatus">Status da Conta</label>
          <select
            id="editStatus"
            className="text-input"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="ativo">Ativo</option>
            <option value="suspenso">Suspenso</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>
      </div>

      {/* Seção de Relatórios Semanais Automáticos */}
      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 10 }}>
          <label htmlFor="editEmailRelatorio" style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>
            <Mail style={{ width: 16, height: 16, color: '#0284c7' }} />
            E-mail para Recebimento de Relatórios Semanais
          </label>
          {emailRelatorio && (
            <button
              type="button"
              onClick={() => setReceberRelatorioSemanal(!receberRelatorioSemanal)}
              style={{
                fontSize: 11,
                fontWeight: 600,
                padding: '4px 10px',
                borderRadius: 6,
                border: '1px solid',
                cursor: 'pointer',
                borderColor: receberRelatorioSemanal ? '#fca5a5' : '#86efac',
                background: receberRelatorioSemanal ? '#fef2f2' : '#f0fdf4',
                color: receberRelatorioSemanal ? '#b91c1c' : '#15803d',
                transition: 'all 0.15s ease',
              }}
            >
              {receberRelatorioSemanal ? 'Cancelar envio automático' : 'Reativar envio automático'}
            </button>
          )}
        </div>

        <input
          id="editEmailRelatorio"
          type="email"
          className="text-input"
          value={emailRelatorio}
          onChange={(e) => setEmailRelatorio(e.target.value)}
          placeholder="Ex: gestao@empresa.com.br"
          style={{ width: '100%', boxSizing: 'border-box' }}
        />

        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: '#334155', cursor: 'pointer', fontWeight: 500 }}>
            <input
              type="checkbox"
              checked={receberRelatorioSemanal}
              onChange={(e) => setReceberRelatorioSemanal(e.target.checked)}
              style={{ width: 16, height: 16, accentColor: '#0284c7', cursor: 'pointer' }}
            />
            <span>Enviar relatório consolidado das pesquisas automaticamente <strong>1x por semana</strong></span>
          </label>
        </div>
        <p style={{ margin: '6px 0 0 0', fontSize: 11, color: '#64748b' }}>
          Caso o cliente não queira mais receber os relatórios, desmarque a opção acima ou clique em "Cancelar envio automático".
        </p>
      </div>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <button className="btn-action-primary" type="submit" disabled={salvando}>
          <Check style={{ width: 14, height: 14 }} />
          {salvando ? 'Salvando…' : 'Salvar Alterações'}
        </button>
        <button className="btn-ghost" type="button" onClick={onCancelar}>
          <X style={{ width: 14, height: 14 }} />
          Cancelar
        </button>
      </div>
    </form>
  )
}
