import { supabase } from '../supabaseClient'
import MetricasCliente from '../components/MetricasCliente'

export default function ClientePainel({ perfil }) {
  return (
    <div style={{ minHeight: '100vh' }}>
      <header className="client-header">
        <div className="sidebar-brand" style={{ color: 'var(--ink)' }}>
          <span className="dot" />Satisfy
        </div>
        <button className="btn-ghost" onClick={() => supabase.auth.signOut()}>Sair</button>
      </header>

      <main className="client-main">
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
