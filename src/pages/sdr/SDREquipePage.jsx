import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import {
  FiShield,
  FiUserCheck,
  FiPlus,
  FiMail,
  FiAward,
  FiTrendingUp,
} from 'react-icons/fi'
import { sdrService } from '../../services/sdrService'

export default function SDREquipePage() {
  const { clienteId } = useOutletContext()
  const [team, setTeam] = useState([])

  useEffect(() => {
    if (clienteId) {
      setTeam(sdrService.getTeam(clienteId))
    }
  }, [clienteId])

  return (
    <div className="sdr-root-container">
      <div className="sdr-header-row">
        <div className="sdr-page-title-group">
          <h1>
            <span style={{ color: '#06b6d4' }}>🛡️</span> Equipe Comercial e SDRs
          </h1>
          <p>Membros da equipe que recebem os leads qualificados e operam em conjunto com o agente de IA.</p>
        </div>

        <div className="sdr-header-actions">
          <button className="sdr-btn-primary" onClick={() => alert('Convite de novo membro enviado!')}>
            <FiPlus /> Convidar Membro
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
        {team.map((member) => (
          <div
            key={member.id}
            style={{
              background: 'var(--paper-raised)',
              border: '1px solid var(--line)',
              borderRadius: 12,
              padding: 22,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 12,
                  background: member.role.includes('IA') ? 'var(--amber)' : 'var(--ink)',
                  color: member.role.includes('IA') ? 'var(--ink)' : '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 16,
                }}
              >
                {member.name.substring(0, 2).toUpperCase()}
              </div>

              <div>
                <div style={{ fontWeight: 700, color: 'var(--ink)', fontSize: 15, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {member.name}
                  <span className="sdr-status-dot active" />
                </div>
                <div style={{ fontSize: 12, color: 'var(--teal)', fontWeight: 600 }}>{member.role}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-soft)' }}>{member.email}</div>
              </div>
            </div>

            <div
              style={{
                background: 'var(--paper)',
                border: '1px solid var(--line)',
                borderRadius: 8,
                padding: '12px 16px',
                display: 'flex',
                justifyContent: 'space-around',
                textAlign: 'center',
              }}
            >
              <div>
                <div style={{ fontSize: 11, color: 'var(--ink-soft)' }}>DEALS FECHADOS</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--teal)' }}>{member.deals_closed}</div>
              </div>
              <div style={{ width: 1, background: 'var(--line)' }} />
              <div>
                <div style={{ fontSize: 11, color: 'var(--ink-soft)' }}>TAXA DE CONVERSÃO</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--amber-deep)' }}>{member.conversion_rate}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
