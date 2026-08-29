import { supabase } from '../supabaseClient'
import MetricasCliente from '../components/MetricasCliente'

export default function ClientePainel({ perfil }) {
  return (
    <div style={{ minHeight: '100vh' }}>
      <header style={estilos.header}>
        <div className="sidebar-brand" style={{ color: 'var(--ink)' }}>
          <span className="dot" />Satisfy
        </div>
        <button className="btn-ghost" onClick={() => supabase.auth.signOut()}>Sair</button>
      </header>

      <main style={{ padding: '32px 48px', maxWidth: 1040 }}>
        <div className="page-header">
          <div className="page-eyebrow">Seu painel</div>
          <h1 className="page-title">Métricas de satisfação</h1>
          <p className="page-subtitle">Acompanhe as respostas recebidas nos seus totens.</p>
        </div>

        <div className="card">
          <MetricasCliente clienteId={perfil.cliente_id} />
        </div>
      </main>
    </div>
  )
}

const estilos = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '18px 48px',
    borderBottom: '1px solid var(--line)',
    background: '#fff',
  },
}
