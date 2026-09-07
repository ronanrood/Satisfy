import { useState, useEffect } from 'react'
import { useOutletContext, Link } from 'react-router-dom'
import {
  FiActivity,
  FiDollarSign,
  FiMessageSquare,
  FiUsers,
  FiTrendingUp,
  FiSettings,
  FiArrowUpRight,
  FiCheckCircle,
  FiZap,
} from 'react-icons/fi'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { sdrService } from '../../services/sdrService'

const CHART_DATA_TODAY = [
  { time: '08:00', leads: 2, conv: 1 },
  { time: '10:00', leads: 8, conv: 3 },
  { time: '12:00', leads: 14, conv: 6 },
  { time: '14:00', leads: 22, conv: 9 },
  { time: '16:00', leads: 31, conv: 15 },
  { time: '18:00', leads: 38, conv: 19 },
]

const CHART_DATA_WEEK = [
  { time: 'Seg', leads: 24, conv: 8 },
  { time: 'Ter', leads: 36, conv: 14 },
  { time: 'Qua', leads: 42, conv: 18 },
  { time: 'Qui', leads: 55, conv: 24 },
  { time: 'Sex', leads: 62, conv: 29 },
  { time: 'Sáb', leads: 28, conv: 12 },
  { time: 'Dom', leads: 18, conv: 7 },
]

const CHART_DATA_MONTH = [
  { time: 'Sem 1', leads: 140, conv: 52 },
  { time: 'Sem 2', leads: 210, conv: 84 },
  { time: 'Sem 3', leads: 260, conv: 110 },
  { time: 'Sem 4', leads: 310, conv: 138 },
]

export default function SDRDashboardPage() {
  const { clienteId, openWizard } = useOutletContext()
  const [period, setPeriod] = useState('today')
  const [settings, setSettings] = useState(null)
  const [deals, setDeals] = useState([])

  useEffect(() => {
    if (clienteId) {
      setSettings(sdrService.getSettings(clienteId))
      setDeals(sdrService.getDeals(clienteId))
    }
  }, [clienteId])

  const chartData =
    period === 'today'
      ? CHART_DATA_TODAY
      : period === '7days'
      ? CHART_DATA_WEEK
      : CHART_DATA_MONTH

  const totalPipelineValue = deals.reduce((acc, d) => acc + (d.value || 0), 0)

  return (
    <div className="sdr-root-container">
      <div className="sdr-ambient-glow-top" />
      <div className="sdr-ambient-glow-bottom" />

      {/* Onboarding Wizard Banner */}
      <div className="sdr-onboarding-banner">
        <div className="sdr-banner-left">
          <div className="sdr-banner-icon">
            <FiZap />
          </div>
          <div className="sdr-banner-info">
            <h3>SDR Virtual — {settings?.sdr_name || 'Nina'}</h3>
            <p>
              {settings?.company_name
                ? `Configurado para ${settings.company_name} · Pronto para conversão no WhatsApp.`
                : 'Configure seu agente de vendas e WhatsApp Cloud para iniciar o atendimento 24/7.'}
            </p>
          </div>
        </div>
        <button
          className="sdr-btn-primary"
          onClick={() => openWizard && openWizard()}
        >
          <FiSettings /> Assistente de Configuração
        </button>
      </div>

      {/* System Health Card */}
      <div className="sdr-health-card">
        <div className="sdr-health-items">
          <div className="sdr-health-item">
            <span className="sdr-status-dot active" />
            <span>Motor IA: <strong>{settings?.ai_model_mode?.toUpperCase() || 'FLASH'}</strong></span>
          </div>
          <div className="sdr-health-item">
            <span className="sdr-status-dot active" />
            <span>WhatsApp Cloud: <strong>Ativo</strong></span>
          </div>
          <div className="sdr-health-item">
            <span className="sdr-status-dot active" />
            <span>Respostas de Voz: <strong>{settings?.audio_enabled ? 'ElevenLabs' : 'Desativado'}</strong></span>
          </div>
          <div className="sdr-health-item">
            <span className="sdr-status-dot active" />
            <span>Horário: <strong>{settings?.business_hours_start || '09:00'} - {settings?.business_hours_end || '18:00'}</strong></span>
          </div>
        </div>
      </div>

      {/* Header with Title and Period Filter */}
      <div className="sdr-header-row">
        <div className="sdr-page-title-group">
          <h1>
            <FiActivity style={{ color: 'var(--ink)' }} /> Dashboard SDR
          </h1>
          <p>Visão geral da performance comercial e interações com clientes.</p>
        </div>

        <div className="sdr-header-actions">
          <div style={{ background: '#ffffff', padding: 3, borderRadius: 8, border: '1px solid var(--line)', display: 'flex', gap: 4 }}>
            {[
              { id: 'today', label: 'Hoje' },
              { id: '7days', label: '7 Dias' },
              { id: '30days', label: '30 Dias' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 6,
                  border: 'none',
                  background: period === p.id ? 'var(--ink)' : 'transparent',
                  color: period === p.id ? '#ffffff' : 'var(--ink-soft)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="sdr-kpi-grid">
        <div className="sdr-kpi-card">
          <div className="sdr-kpi-header">
            <span className="sdr-kpi-label">Atendimentos IA</span>
            <div className="sdr-kpi-icon blue">
              <FiMessageSquare />
            </div>
          </div>
          <div className="sdr-kpi-value-row">
            <span className="sdr-kpi-value">{period === 'today' ? '38' : period === '7days' ? '265' : '920'}</span>
            <span className="sdr-kpi-badge up">
              <FiTrendingUp /> +24%
            </span>
          </div>
        </div>

        <div className="sdr-kpi-card">
          <div className="sdr-kpi-header">
            <span className="sdr-kpi-label">Novos Leads</span>
            <div className="sdr-kpi-icon amber">
              <FiUsers />
            </div>
          </div>
          <div className="sdr-kpi-value-row">
            <span className="sdr-kpi-value">{period === 'today' ? '19' : period === '7days' ? '94' : '384'}</span>
            <span className="sdr-kpi-badge up">
              <FiTrendingUp /> +18%
            </span>
          </div>
        </div>

        <div className="sdr-kpi-card">
          <div className="sdr-kpi-header">
            <span className="sdr-kpi-label">Total em Pipeline</span>
            <div className="sdr-kpi-icon emerald">
              <FiDollarSign />
            </div>
          </div>
          <div className="sdr-kpi-value-row">
            <span className="sdr-kpi-value">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(totalPipelineValue)}
            </span>
            <span className="sdr-kpi-badge up">
              <FiTrendingUp /> +32%
            </span>
          </div>
        </div>

        <div className="sdr-kpi-card">
          <div className="sdr-kpi-header">
            <span className="sdr-kpi-label">Taxa de Conversão</span>
            <div className="sdr-kpi-icon purple">
              <FiActivity />
            </div>
          </div>
          <div className="sdr-kpi-value-row">
            <span className="sdr-kpi-value">28.4%</span>
            <span className="sdr-kpi-badge up">
              <FiTrendingUp /> +4.2%
            </span>
          </div>
        </div>
      </div>

      {/* Main Chart + Leads Summary */}
      <div className="sdr-dashboard-grid">
        <div className="sdr-panel">
          <div className="sdr-panel-title">
            <span>Fluxo de Atendimento e Conversões</span>
            <span style={{ fontSize: 12, color: 'var(--ink-soft)', fontWeight: 400 }}>WhatsApp em tempo real</span>
          </div>
          <div style={{ height: 320, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2f6f62" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2f6f62" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorConv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e8a33d" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#e8a33d" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e1e6ea',
                    borderRadius: 8,
                    color: 'var(--ink)',
                    fontSize: 12,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  }}
                />
                <Area type="monotone" dataKey="leads" name="Leads Atendidos" stroke="#2f6f62" strokeWidth={2} fillOpacity={1} fill="url(#colorLeads)" />
                <Area type="monotone" dataKey="conv" name="Qualificados / Reuniões" stroke="#e8a33d" strokeWidth={2} fillOpacity={1} fill="url(#colorConv)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Hot Deals Preview */}
        <div className="sdr-panel">
          <div className="sdr-panel-title">
            <span>Últimos Deals no Pipeline</span>
            <Link to="../pipeline" style={{ color: 'var(--ink)', fontSize: 12, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
              Ver todos <FiArrowUpRight />
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {deals.slice(0, 4).map((deal) => (
              <div
                key={deal.id}
                style={{
                  background: 'var(--paper)',
                  border: '1px solid var(--line)',
                  padding: 12,
                  borderRadius: 8,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--ink)', fontSize: 13 }}>{deal.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-soft)' }}>{deal.contact_name} · {deal.company}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, color: 'var(--teal)', fontSize: 13 }}>
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(deal.value)}
                  </div>
                  <div style={{ fontSize: 10, color: '#94a3b8' }}>{deal.updated_at}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
