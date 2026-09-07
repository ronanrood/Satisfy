import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import {
  FiPlus,
  FiDollarSign,
  FiPhone,
  FiUser,
  FiChevronRight,
  FiX,
  FiFilter,
} from 'react-icons/fi'
import { sdrService } from '../../services/sdrService'

export default function SDRPipelinePage() {
  const { clienteId } = useOutletContext()
  const [stages, setStages] = useState([])
  const [deals, setDeals] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [selectedDeal, setSelectedDeal] = useState(null)

  // Form State for new deal
  const [newTitle, setNewTitle] = useState('')
  const [newContact, setNewContact] = useState('')
  const [newCompany, setNewCompany] = useState('')
  const [newValue, setNewValue] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newStage, setNewStage] = useState('lead')

  useEffect(() => {
    if (clienteId) {
      setStages(sdrService.getStages())
      setDeals(sdrService.getDeals(clienteId))
    }
  }, [clienteId])

  const handleCreateDeal = (e) => {
    e.preventDefault()
    const newD = {
      id: 'deal-' + Date.now(),
      title: newTitle,
      contact_name: newContact,
      company: newCompany,
      value: parseFloat(newValue) || 0,
      phone: newPhone,
      stage_id: newStage,
      tags: ['Inbound', 'WhatsApp'],
      updated_at: 'Agora',
    }

    const updated = [newD, ...deals]
    setDeals(updated)
    sdrService.saveDeals(clienteId, updated)
    setShowModal(false)

    // Reset
    setNewTitle('')
    setNewContact('')
    setNewCompany('')
    setNewValue('')
    setNewPhone('')
  }

  const handleMoveStage = (dealId, nextStageId) => {
    const updated = deals.map((d) =>
      d.id === dealId ? { ...d, stage_id: nextStageId, updated_at: 'Agora' } : d
    )
    setDeals(updated)
    sdrService.saveDeals(clienteId, updated)
    if (selectedDeal && selectedDeal.id === dealId) {
      setSelectedDeal({ ...selectedDeal, stage_id: nextStageId })
    }
  }

  const totalValue = deals.reduce((acc, d) => acc + (d.value || 0), 0)
  const avgTicket = deals.length > 0 ? totalValue / deals.length : 0

  return (
    <div className="sdr-root-container">
      <div className="sdr-ambient-glow-top" />

      {/* Header */}
      <div className="sdr-header-row">
        <div className="sdr-page-title-group">
          <h1>
            <span style={{ color: '#06b6d4' }}>❖</span> Pipeline de Vendas
          </h1>
          <p>Gerencie o funil de qualificação e fechamento dos leads atendidos pelo SDR.</p>
        </div>

        <div className="sdr-header-actions">
          <button className="sdr-btn-primary" onClick={() => setShowModal(true)}>
            <FiPlus /> Novo Deal
          </button>
        </div>
      </div>

      {/* Pipeline Summary Bar */}
      <div
        style={{
          background: 'var(--paper-raised)',
          border: '1px solid var(--line)',
          borderRadius: 12,
          padding: '14px 20px',
          marginBottom: 24,
          display: 'flex',
          gap: 32,
          alignItems: 'center',
          flexWrap: 'wrap',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        }}
      >
        <div>
          <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>Total no Funil: </span>
          <strong style={{ color: 'var(--teal)', fontSize: 15 }}>
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(totalValue)}
          </strong>
        </div>
        <div>
          <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>Deals Ativos: </span>
          <strong style={{ color: 'var(--ink)', fontSize: 15 }}>{deals.length}</strong>
        </div>
        <div>
          <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>Ticket Médio: </span>
          <strong style={{ color: 'var(--amber-deep)', fontSize: 15 }}>
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(avgTicket)}
          </strong>
        </div>
      </div>

      {/* Kanban Columns */}
      <div className="sdr-pipeline-container">
        {stages.map((stage) => {
          const columnDeals = deals.filter((d) => d.stage_id === stage.id)
          const columnTotal = columnDeals.reduce((sum, d) => sum + (d.value || 0), 0)

          return (
            <div key={stage.id} className="sdr-kanban-column">
              <div className="sdr-column-header">
                <div className="sdr-column-title-group">
                  <span className="sdr-stage-pill" style={{ background: stage.color }} />
                  <span className="sdr-column-title">{stage.name}</span>
                  <span className="sdr-column-count">{columnDeals.length}</span>
                </div>
                <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>
                  {new Intl.NumberFormat('pt-BR', { notation: 'compact', style: 'currency', currency: 'BRL' }).format(columnTotal)}
                </span>
              </div>

              <div className="sdr-deals-list">
                {columnDeals.map((deal) => (
                  <div
                    key={deal.id}
                    className="sdr-deal-card"
                    onClick={() => setSelectedDeal(deal)}
                  >
                    <div className="sdr-deal-header">
                      <h4 className="sdr-deal-title">{deal.title}</h4>
                      <span className="sdr-deal-value">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(deal.value)}
                      </span>
                    </div>

                    <div className="sdr-deal-contact">
                      <FiUser style={{ marginRight: 4, verticalAlign: 'middle' }} />
                      {deal.contact_name} {deal.company ? `(${deal.company})` : ''}
                    </div>

                    <div className="sdr-deal-footer">
                      <div className="sdr-deal-tags">
                        {deal.tags?.map((t, idx) => (
                          <span key={idx} className="sdr-deal-tag">{t}</span>
                        ))}
                      </div>
                      <span>{deal.updated_at}</span>
                    </div>
                  </div>
                ))}

                {columnDeals.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '30px 10px', color: '#475569', fontSize: 12 }}>
                    Nenhum deal neste estágio
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal: New Deal */}
      {showModal && (
        <div className="sdr-wizard-overlay" onClick={() => setShowModal(false)}>
          <div
            className="sdr-wizard-modal"
            style={{ maxWidth: 480 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sdr-wizard-header">
              <h3 className="sdr-wizard-title">Criar Novo Deal</h3>
              <button className="sdr-wizard-close-btn" onClick={() => setShowModal(false)}>
                <FiX />
              </button>
            </div>
            <form onSubmit={handleCreateDeal} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="sdr-label">Título da Oportunidade</label>
                <input
                  className="sdr-input"
                  placeholder="Ex: Contrato Anual Empresa X"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="sdr-label">Nome do Contato</label>
                  <input
                    className="sdr-input"
                    placeholder="Ex: João Silva"
                    value={newContact}
                    onChange={(e) => setNewContact(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="sdr-label">Empresa</label>
                  <input
                    className="sdr-input"
                    placeholder="Ex: Tech Corp"
                    value={newCompany}
                    onChange={(e) => setNewCompany(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="sdr-label">Valor Estimado (R$)</label>
                  <input
                    type="number"
                    className="sdr-input"
                    placeholder="Ex: 5000"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                  />
                </div>
                <div>
                  <label className="sdr-label">WhatsApp</label>
                  <input
                    className="sdr-input"
                    placeholder="+55 11 99999-9999"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="sdr-label">Estágio Inicial</label>
                <select
                  className="sdr-input"
                  value={newStage}
                  onChange={(e) => setNewStage(e.target.value)}
                >
                  {stages.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" className="sdr-btn-secondary" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="sdr-btn-primary">
                  Adicionar Deal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View / Edit Deal Details */}
      {selectedDeal && (
        <div className="sdr-wizard-overlay" onClick={() => setSelectedDeal(null)}>
          <div
            className="sdr-wizard-modal"
            style={{ maxWidth: 500 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sdr-wizard-header">
              <div>
                <h3 className="sdr-wizard-title">{selectedDeal.title}</h3>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>
                  {selectedDeal.contact_name} · {selectedDeal.company}
                </div>
              </div>
              <button className="sdr-wizard-close-btn" onClick={() => setSelectedDeal(null)}>
                <FiX />
              </button>
            </div>

            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', background: 'var(--paper)', padding: 14, borderRadius: 8, border: '1px solid var(--line)' }}>
                <div>
                  <span style={{ fontSize: 11, color: 'var(--ink-soft)' }}>VALOR DO DEAL</span>
                  <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--teal)' }}>
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedDeal.value)}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: 11, color: 'var(--ink-soft)' }}>WHATSAPP</span>
                  <div style={{ fontSize: 13, color: 'var(--ink)', fontWeight: 500 }}>
                    {selectedDeal.phone}
                  </div>
                </div>
              </div>

              <div>
                <label className="sdr-label">Mudar Estágio do Funil</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {stages.map((s) => {
                    const isCur = selectedDeal.stage_id === s.id
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleMoveStage(selectedDeal.id, s.id)}
                        style={{
                          padding: '8px 6px',
                          borderRadius: 6,
                          border: isCur ? `2px solid var(--ink)` : '1px solid var(--line)',
                          background: isCur ? 'var(--paper)' : '#ffffff',
                          color: 'var(--ink)',
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        {s.name}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  className="sdr-btn-secondary"
                  onClick={() => setSelectedDeal(null)}
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
