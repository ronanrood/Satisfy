import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import {
  FiCalendar,
  FiClock,
  FiUser,
  FiVideo,
  FiPlus,
  FiCheckCircle,
  FiExternalLink,
} from 'react-icons/fi'
import { sdrService } from '../../services/sdrService'

export default function SDRAgendamentosPage() {
  const { clienteId } = useOutletContext()
  const [appointments, setAppointments] = useState([])

  useEffect(() => {
    if (clienteId) {
      setAppointments(sdrService.getAppointments(clienteId))
    }
  }, [clienteId])

  return (
    <div className="sdr-root-container">
      <div className="sdr-header-row">
        <div className="sdr-page-title-group">
          <h1>
            <span style={{ color: '#06b6d4' }}>📅</span> Agendamentos
          </h1>
          <p>Reuniões comerciais, demonstrações e visitas agendadas automaticamente pelo SDR virtual.</p>
        </div>

        <div className="sdr-header-actions">
          <button className="sdr-btn-primary" onClick={() => alert('Integrado com Google Agenda e Calendly')}>
            <FiPlus /> Novo Agendamento
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
        {appointments.map((app) => (
          <div
            key={app.id}
            style={{
              background: 'var(--paper-raised)',
              border: '1px solid var(--line)',
              borderRadius: 12,
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 14,
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <span
                  style={{
                    background: app.status === 'Confirmado' ? '#ecfdf5' : '#fffbeb',
                    color: app.status === 'Confirmado' ? '#059669' : '#b45309',
                    border: `1px solid ${app.status === 'Confirmado' ? '#d1fae5' : '#fef3c7'}`,
                    fontSize: 11,
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: 12,
                  }}
                >
                  {app.status}
                </span>
                <span style={{ fontSize: 12, color: 'var(--ink-soft)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <FiClock /> {app.date}
                </span>
              </div>

              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', margin: '0 0 4px 0' }}>
                {app.title}
              </h3>
              <p style={{ fontSize: 13, color: 'var(--ink-soft)', margin: 0 }}>
                {app.contact_name} · <strong>{app.company}</strong>
              </p>
            </div>

            <div style={{ borderTop: '1px solid var(--line)', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 12, color: 'var(--ink-soft)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <FiUser style={{ color: 'var(--teal)' }} /> {app.responsible}
              </div>

              {app.link && (
                <a
                  href={app.link}
                  target="_blank"
                  rel="noreferrer"
                  className="sdr-btn-secondary"
                  style={{ fontSize: 11, padding: '5px 10px', textDecoration: 'none' }}
                >
                  <FiVideo /> Acessar Sala
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
