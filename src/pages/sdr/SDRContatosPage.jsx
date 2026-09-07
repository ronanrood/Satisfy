import { useState, useEffect } from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import {
  FiUsers,
  FiSearch,
  FiMessageSquare,
  FiMail,
  FiPhone,
  FiPlus,
  FiExternalLink,
} from 'react-icons/fi'
import { sdrService } from '../../services/sdrService'

export default function SDRContatosPage() {
  const { clienteId } = useOutletContext()
  const navigate = useNavigate()
  const [contacts, setContacts] = useState([])
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (clienteId) {
      setContacts(sdrService.getContacts(clienteId))
    }
  }, [clienteId])

  const filtered = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="sdr-root-container">
      <div className="sdr-header-row">
        <div className="sdr-page-title-group">
          <h1>
            <span style={{ color: '#06b6d4' }}>👥</span> Contatos e Leads
          </h1>
          <p>Base unificada de todos os leads cadastrados e abordados pela inteligência artificial.</p>
        </div>

        <div className="sdr-header-actions">
          <div style={{ position: 'relative', width: 260 }}>
            <input
              className="sdr-input"
              placeholder="Buscar contato por nome, telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: 34, fontSize: 13 }}
            />
            <FiSearch style={{ position: 'absolute', left: 10, top: 12, color: '#64748b' }} />
          </div>
        </div>
      </div>

      <div className="sdr-panel" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#fafbfc', borderBottom: '1px solid var(--line)' }}>
              <th style={{ padding: '14px 18px', fontSize: 11, fontWeight: 700, color: 'var(--ink-soft)', textTransform: 'uppercase' }}>
                CONTATO / EMPRESA
              </th>
              <th style={{ padding: '14px 18px', fontSize: 11, fontWeight: 700, color: 'var(--ink-soft)', textTransform: 'uppercase' }}>
                WHATSAPP
              </th>
              <th style={{ padding: '14px 18px', fontSize: 11, fontWeight: 700, color: 'var(--ink-soft)', textTransform: 'uppercase' }}>
                ESTÁGIO NO FUNIL
              </th>
              <th style={{ padding: '14px 18px', fontSize: 11, fontWeight: 700, color: 'var(--ink-soft)', textTransform: 'uppercase' }}>
                STATUS ATENDIMENTO
              </th>
              <th style={{ padding: '14px 18px', fontSize: 11, fontWeight: 700, color: 'var(--ink-soft)', textTransform: 'uppercase' }}>
                ÚLTIMA AÇÃO
              </th>
              <th style={{ padding: '14px 18px', fontSize: 11, fontWeight: 700, color: 'var(--ink-soft)', textTransform: 'uppercase', textAlign: 'right' }}>
                AÇÕES
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr
                key={c.id}
                style={{
                  borderBottom: '1px solid var(--line)',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <td style={{ padding: '14px 18px' }}>
                  <div style={{ fontWeight: 600, color: 'var(--ink)', fontSize: 13.5 }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{c.company || '—'}</div>
                </td>
                <td style={{ padding: '14px 18px' }}>
                  <div style={{ color: 'var(--ink)', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <FiPhone style={{ fontSize: 12, color: 'var(--ink-soft)' }} /> {c.phone}
                  </div>
                  {c.email && (
                    <div style={{ color: 'var(--ink-soft)', fontSize: 11, marginTop: 2 }}>{c.email}</div>
                  )}
                </td>
                <td style={{ padding: '14px 18px' }}>
                  <span className="sdr-deal-tag">
                    {c.stage}
                  </span>
                </td>
                <td style={{ padding: '14px 18px' }}>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: c.status.includes('IA') ? '#059669' : '#d97706',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <span
                      className="sdr-status-dot"
                      style={{ background: c.status.includes('IA') ? '#10b981' : '#f59e0b' }}
                    />
                    {c.status}
                  </span>
                </td>
                <td style={{ padding: '14px 18px', fontSize: 12, color: 'var(--ink-soft)' }}>
                  {c.last_interaction}
                </td>
                <td style={{ padding: '16px 18px', textAlign: 'right' }}>
                  <button
                    className="sdr-btn-secondary"
                    onClick={() => navigate('../chat')}
                    style={{ fontSize: 12, padding: '6px 10px' }}
                    title="Abrir no Chat"
                  >
                    <FiMessageSquare /> Chat
                  </button>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
                  Nenhum contato encontrado
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
