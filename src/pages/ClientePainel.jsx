import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiShield } from 'react-icons/fi'
import { supabase } from '../supabaseClient'
import MetricasCliente from '../components/MetricasCliente'
import ModalPrivacidadeLGPD from '../components/ModalPrivacidadeLGPD'

export default function ClientePainel({ perfil }) {
  const navigate = useNavigate()
  const [modalLgpdAberto, setModalLgpdAberto] = useState(false)

  return (
    <div style={{ minHeight: '100vh' }}>
      <header className="client-header">
        <div className="sidebar-brand" style={{ color: 'var(--ink)' }}>
          <span className="dot" />Satisfy
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <p
            onClick={() => setModalLgpdAberto(true)}
            style={{
              cursor: 'pointer',
              fontSize: 12,
              color: '#64748b',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              margin: 0,
              userSelect: 'none',
              transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#0284c7')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
            title="Privacidade & LGPD"
          >
            <FiShield />
            <span>Privacidade & LGPD</span>
          </p>
          <button className="btn-ghost" onClick={() => supabase.auth.signOut()}>Sair</button>
        </div>
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

      <ModalPrivacidadeLGPD
        aberto={modalLgpdAberto}
        onClose={() => setModalLgpdAberto(false)}
        onVerMais={() => navigate('/privacidade')}
      />
    </div>
  )
}
