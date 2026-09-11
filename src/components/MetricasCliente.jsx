import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { relatorioService } from '../services/relatorioService'
import { 
  FiMessageSquare, 
  FiHome, 
  FiStar, 
  FiDownload, 
  FiPrinter, 
  FiUser,
  FiChevronDown,
  FiPhone,
  FiSend,
  FiMail,
  FiCheckCircle,
  FiX
} from 'react-icons/fi'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'

const PERIODOS = [
  { valor: '7', label: 'Últimos 7 dias', dias: 7 },
  { valor: '30', label: 'Últimos 30 Dias', dias: 30 },
  { valor: '90', label: 'Últimos 90 dias', dias: 90 },
  { valor: 'todos', label: 'Desde o início', dias: null },
]

const TIPOS_NOTA = ['estrelas', 'carinhas', 'nps', 'nota', 'escala_opiniao']
const TIPOS_ESCOLHA = ['escolha_unica', 'escolha_multipla']
const MAX_POR_TIPO = { estrelas: 5, carinhas: 5, nps: 10, nota: 10, escala_opiniao: 10 }

export default function MetricasCliente({ clienteId }) {
  const [carregando, setCarregando] = useState(true)
  const [respostas, setRespostas] = useState([])
  const [perguntas, setPerguntas] = useState([])
  const [periodo, setPeriodo] = useState('30')
  const [recentesAberto, setRecentesAberto] = useState(() => {
    try {
      const salvo = localStorage.getItem('satisfy_metricas_recentes_aberto')
      return salvo !== null ? JSON.parse(salvo) : true
    } catch {
      return true
    }
  })
  const [enviandoEmail, setEnviandoEmail] = useState(false)
  const [modalSucessoAberto, setModalSucessoAberto] = useState(false)
  const [modalEmailPromptAberto, setModalEmailPromptAberto] = useState(false)
  const [emailInputTemporario, setEmailInputTemporario] = useState('')
  const [resultadoEnvio, setResultadoEnvio] = useState(null)

  async function handleEnviarRelatorio30Dias(emailManual = null) {
    try {
      setEnviandoEmail(true)
      // 1. Busca dados do cliente para obter e-mail cadastrado
      const { data: cliente } = await supabase
        .from('clientes')
        .select('*')
        .eq('id', clienteId)
        .maybeSingle()

      const emailDestino = (emailManual || cliente?.email_relatorio || '').trim()

      if (!emailDestino) {
        setEmailInputTemporario('')
        setModalEmailPromptAberto(true)
        setEnviandoEmail(false)
        return
      }

      // Se foi informado manualmente e o cliente ainda não tinha gravado
      if (emailManual && (!cliente?.email_relatorio || cliente.email_relatorio !== emailManual)) {
        try {
          await supabase.from('clientes').update({ email_relatorio: emailManual }).eq('id', clienteId)
        } catch {
          // ignore se coluna não existir
        }
      }

      const res = await relatorioService.enviarRelatorio30Dias(
        cliente || { id: clienteId, nome: 'Cliente' },
        emailDestino
      )

      setResultadoEnvio(res)
      setModalEmailPromptAberto(false)
      setModalSucessoAberto(true)
    } catch (err) {
      console.error('Erro ao enviar relatório por e-mail:', err)
      alert(`Erro ao enviar relatório: ${err.message || 'Falha no envio'}`)
    } finally {
      setEnviandoEmail(false)
    }
  }

  const alternarRecentes = () => {
    setRecentesAberto((prev) => {
      const novo = !prev
      try {
        localStorage.setItem('satisfy_metricas_recentes_aberto', JSON.stringify(novo))
      } catch {
        // ignore
      }
      return novo
    })
  }

  useEffect(() => {
    buscar()
  }, [clienteId, periodo])

  async function buscar() {
    setCarregando(true)
    const config = PERIODOS.find((p) => p.valor === periodo)

    let query = supabase
      .from('respostas')
      .select('*, totens!inner(nome, unidades!inner(nome, cliente_id))')
      .eq('totens.unidades.cliente_id', clienteId)
      .order('created_at', { ascending: false })
      .limit(1000)

    if (config?.dias) {
      const dataInicio = new Date()
      dataInicio.setDate(dataInicio.getDate() - config.dias)
      query = query.gte('created_at', dataInicio.toISOString())
    }

    const [{ data: respostasData }, { data: pesquisaData }] = await Promise.all([
      query,
      supabase.from('pesquisas').select('perguntas').eq('cliente_id', clienteId).eq('ativa', true).maybeSingle(),
    ])

    setRespostas(respostasData || [])
    setPerguntas(pesquisaData?.perguntas || [])
    setCarregando(false)
  }

  const config = PERIODOS.find((p) => p.valor === periodo)
  const agruparPorSemana = config?.dias === null || config?.dias > 30
  const baldes = calcularVolumeEEvolucao(respostas, config?.dias || 30, agruparPorSemana)
  const maiorVolume = Math.max(...baldes.map((b) => b.quantidade), 1)

  const total = respostas.length
  const comNota = respostas.filter((r) => r.nota !== null)
  const media = comNota.length ? comNota.reduce((soma, r) => soma + r.nota, 0) / comNota.length : null
  const recentes = respostas.slice(0, 50)

  const porUnidade = calcularPorUnidade(respostas)
  const porPergunta = calcularPorPergunta(respostas, perguntas)

  return (
    <div className="metrics-dashboard-wrapper">
      {/* Header com Filtro de Período e Botões de Exportação */}
      <div className="metrics-header-toolbar metricas-ocultar-impressao">
        <div className="period-selector-box">
          <label htmlFor="periodo-select">Período</label>
          <div className="select-styled-wrap">
            <select
              id="periodo-select"
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
            >
              {PERIODOS.map((p) => (
                <option key={p.valor} value={p.valor}>{p.label}</option>
              ))}
            </select>
          </div>
        </div>

        {respostas.length > 0 && (
          <div className="export-actions" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn-export-csv" onClick={() => exportarCSV(respostas)}>
              <FiDownload /> Exportar CSV
            </button>
            <button className="btn-export-csv" onClick={() => window.print()}>
              <FiPrinter /> Exportar PDF
            </button>
            <button
              className="btn-export-email"
              onClick={() => handleEnviarRelatorio30Dias()}
              disabled={enviandoEmail}
              title="Enviar relatório dos últimos 30 dias por e-mail para o cliente"
            >
              <FiSend />
              <span>{enviandoEmail ? 'Enviando...' : 'Enviar por E-mail (30 dias)'}</span>
            </button>
          </div>
        )}
      </div>

      {carregando ? (
        <div className="metrics-empty-state">
          <div className="metrics-spinner"></div>
          <p>Calculando métricas em tempo real...</p>
        </div>
      ) : respostas.length === 0 ? (
        <div className="metrics-empty-state">
          <p>Nenhuma resposta registrada nesse período selecionado.</p>
        </div>
      ) : (
        <div id="metricas-imprimir" className="metrics-content-fade">
          {/* Top KPI Cards */}
          <div className="kpi-grid">
            <div className="kpi-card kpi-card-blue">
              <div className="kpi-body">
                <span className="kpi-number">{total}</span>
                <span className="kpi-label">Total de Respostas</span>
              </div>
              <div className="kpi-icon-bubble">
                <FiMessageSquare />
              </div>
            </div>

            <div className="kpi-card kpi-card-amber">
              <div className="kpi-body">
                <div className="kpi-number-group">
                  <span className="kpi-number">{media !== null ? media.toFixed(1) : '—'}</span>
                  <FiStar className="star-icon" />
                </div>
                <span className="kpi-label">Nota Média</span>
              </div>
              <div className="kpi-gauge-wrap">
                <SpeedometerGauge value={media || 0} max={10} size={70} />
              </div>
            </div>

            <div className="kpi-card kpi-card-teal">
              <div className="kpi-body">
                <span className="kpi-number">{porUnidade.length || 1}</span>
                <span className="kpi-label">Unidades Ativas</span>
              </div>
              <div className="kpi-icon-bubble">
                <FiHome />
              </div>
            </div>
          </div>

          {/* Gráficos Lado a Lado: Volume e Evolução (Recharts Modernos e Animados) */}
          <div className="charts-double-row">
            <div className="chart-box">
              <h4 className="chart-title">
                VOLUME DE RESPOSTAS por Dia (Últimos {config?.dias || 30} Dias)
              </h4>
              <div style={{ height: 160, width: '100%', marginTop: 8 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={baldes} margin={{ top: 8, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="id"
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={(id) => {
                        const b = baldes.find((item) => item.id === id)
                        return b ? b.diaSemana : id
                      }}
                    />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const item = payload[0].payload
                          return (
                            <div className="chart-custom-tooltip">
                              <div className="tooltip-label">{item.dataCompleta || item.label}</div>
                              <div className="tooltip-value">
                                <strong>{item.quantidade}</strong> {item.quantidade === 1 ? 'resposta' : 'respostas'}
                              </div>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Bar
                      dataKey="quantidade"
                      name="Respostas"
                      fill="#2f6f62"
                      radius={[4, 4, 0, 0]}
                      animationDuration={1100}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="chart-box">
              <h4 className="chart-title">EVOLUÇÃO DA NOTA MÉDIA</h4>
              <div style={{ height: 160, width: '100%', marginTop: 8 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={baldes.map((b) => ({
                      ...b,
                      mediaVal: b.media !== null && b.media !== undefined ? Number(Number(b.media).toFixed(1)) : null,
                    }))}
                    margin={{ top: 8, right: 10, left: -25, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="metricasAmberGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#e8a33d" stopOpacity={0.28} />
                        <stop offset="95%" stopColor="#e8a33d" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="id"
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={(id) => {
                        const b = baldes.find((item) => item.id === id)
                        return b ? b.diaSemana : id
                      }}
                    />
                    <YAxis domain={[0, 10]} stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length && payload[0].payload.mediaVal !== null) {
                          const item = payload[0].payload
                          return (
                            <div className="chart-custom-tooltip">
                              <div className="tooltip-label">{item.dataCompleta || item.label}</div>
                              <div className="tooltip-value">
                                Nota Média: <strong>★ {item.mediaVal}</strong>
                              </div>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="mediaVal"
                      name="Nota Média"
                      stroke="#e8a33d"
                      strokeWidth={2.5}
                      fill="url(#metricasAmberGrad)"
                      dot={{ r: 3, fill: '#ffffff', stroke: '#c17f1f', strokeWidth: 2 }}
                      activeDot={{ r: 5, fill: '#e8a33d', stroke: '#ffffff', strokeWidth: 2 }}
                      connectNulls
                      animationDuration={1300}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Detalhamento por Pergunta */}
          {porPergunta.length > 0 && (
            <div className="questions-section">
              <h4 className="section-title">DETALHAMENTO POR PERGUNTA</h4>
              <div className="questions-grid">
                {porPergunta.map((p, idx) => (
                  <PerguntaVisualCard key={p.id || idx} pergunta={p} />
                ))}
              </div>
            </div>
          )}

          {/* Caixa Retrátil de Respostas Recentes */}
          <div className={`recent-section recent-box-container ${recentesAberto ? 'is-open' : 'is-closed'}`}>
            <div
              className="recent-box-header"
              onClick={alternarRecentes}
              role="button"
              tabIndex={0}
              aria-expanded={recentesAberto}
              aria-controls="recent-responses-body"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  alternarRecentes()
                }
              }}
            >
              <div className="recent-box-header-left">
                <div className="recent-box-icon-bubble">
                  <FiMessageSquare />
                </div>
                <h4 className="recent-box-title">RESPOSTAS RECENTES</h4>
                {recentes.length > 0 && (
                  <span className="recent-count-pill">
                    {respostas.length > 50
                      ? `50 mais recentes (de ${respostas.length})`
                      : `${recentes.length} ${recentes.length === 1 ? 'resposta' : 'respostas'}`}
                  </span>
                )}
              </div>

              <div className="recent-box-header-right">
                <span className="recent-box-toggle-label metricas-ocultar-impressao">
                  {recentesAberto ? 'Recolher' : 'Expandir'}
                </span>
                <span
                  className={`recent-box-toggle-btn ${recentesAberto ? 'open' : ''} metricas-ocultar-impressao`}
                  aria-hidden="true"
                >
                  <FiChevronDown />
                </span>
              </div>
            </div>

            <div
              id="recent-responses-body"
              className={`recent-box-body ${recentesAberto ? 'expanded' : 'collapsed'}`}
            >
              <div className="table-styled-container">
                {recentes.length === 0 ? (
                  <div className="recent-empty-message">
                    Nenhuma resposta recente encontrada para o período selecionado.
                  </div>
                ) : (
                  <table className="clean-table">
                    <thead>
                      <tr>
                        <th>QUANDO</th>
                        <th>NOME</th>
                        <th>TELEFONE</th>
                        <th>UNIDADE</th>
                        <th>NOTA</th>
                        <th>COMENTÁRIO</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentes.map((r) => {
                        const contato = extrairContato(r)
                        const telLimpo = (contato.telefone || '').replace(/\D/g, '')
                        const linkWhats = telLimpo.length >= 10 ? `https://wa.me/55${telLimpo}` : null

                        return (
                          <tr key={r.id}>
                            <td className="cell-date">{formatarData(r.created_at)}</td>
                            <td className="cell-client-name">
                              {contato.nome ? (
                                <div className="client-chip-wrap">
                                  <div className="avatar-chip client-avatar">
                                    <FiUser className="avatar-icon" />
                                  </div>
                                  <span className="client-name-bold">{contato.nome}</span>
                                </div>
                              ) : (
                                <span className="no-comment">—</span>
                              )}
                            </td>
                            <td className="cell-phone">
                              {contato.telefone ? (
                                <div className="phone-contact-group">
                                  <FiPhone className="phone-tiny-icon" />
                                  <span>{contato.telefone}</span>
                                  {linkWhats && (
                                    <a
                                      href={linkWhats}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="whatsapp-quick-link"
                                      title="Conversar no WhatsApp"
                                    >
                                      WhatsApp
                                    </a>
                                  )}
                                </div>
                              ) : (
                                <span className="no-comment">—</span>
                              )}
                            </td>
                            <td className="cell-unit">
                              <div className="avatar-chip">
                                <FiHome className="avatar-icon" />
                              </div>
                              <span>{r.totens?.unidades?.nome || 'Locarti'}</span>
                            </td>
                            <td>
                              <ScoreIndicator score={r.nota} />
                            </td>
                            <td className="cell-comment">
                              {r.comentario ? (
                                <div className="comment-content">
                                  <span>{r.comentario}</span>
                                  <FiMessageSquare className="comment-bubble-icon" />
                                </div>
                              ) : (
                                <span className="no-comment">—</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Modal Pop-up: E-mail Enviado com Sucesso */}
      {modalSucessoAberto && (
        <div className="modal-email-overlay" onClick={() => setModalSucessoAberto(false)}>
          <div className="modal-email-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-email-icon-success">
              <FiCheckCircle />
            </div>

            <h3 className="modal-email-title">Relatório Enviado com Sucesso!</h3>
            
            <p className="modal-email-subtitle">
              O relatório consolidado dos <strong>últimos 30 dias</strong> foi gerado e enviado com sucesso para:
            </p>

            <div className="modal-email-chip">
              <FiMail style={{ color: '#0284c7' }} />
              <span>{resultadoEnvio?.email}</span>
            </div>

            {resultadoEnvio?.dados && (
              <div className="modal-email-stats-box">
                <div className="modal-email-stat">
                  <strong>{resultadoEnvio.dados.totalRespostas}</strong>
                  <span>Respostas</span>
                </div>
                <div className="modal-email-stat">
                  <strong>{resultadoEnvio.dados.mediaNota}</strong>
                  <span>Nota Média</span>
                </div>
                <div className="modal-email-stat">
                  <strong>{resultadoEnvio.dados.npsScore}</strong>
                  <span>NPS Score</span>
                </div>
              </div>
            )}

            <div style={{ marginTop: 22 }}>
              <button
                type="button"
                className="btn-action-primary"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => setModalSucessoAberto(false)}
              >
                OK, Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Pop-up: Solicitar E-mail do Cliente caso não cadastrado */}
      {modalEmailPromptAberto && (
        <div className="modal-email-overlay" onClick={() => setModalEmailPromptAberto(false)}>
          <div className="modal-email-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-email-icon-info">
              <FiMail />
            </div>

            <h3 className="modal-email-title">Enviar Relatório por E-mail</h3>
            
            <p className="modal-email-subtitle">
              Nenhum e-mail de relatório foi encontrado no cadastro deste cliente. Digite o e-mail de destino para enviar o relatório dos últimos 30 dias:
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (emailInputTemporario.trim()) {
                  handleEnviarRelatorio30Dias(emailInputTemporario.trim())
                }
              }}
              style={{ marginTop: 14 }}
            >
              <input
                type="email"
                className="text-input"
                placeholder="Ex: diretoria@empresa.com.br"
                value={emailInputTemporario}
                onChange={(e) => setEmailInputTemporario(e.target.value)}
                required
                autoFocus
                style={{ width: '100%', boxSizing: 'border-box', marginBottom: 14 }}
              />

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  className="btn-ghost"
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => setModalEmailPromptAberto(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-action-primary"
                  style={{ flex: 2, justifyContent: 'center' }}
                  disabled={enviandoEmail || !emailInputTemporario.trim()}
                >
                  {enviandoEmail ? 'Enviando...' : 'Enviar Relatório'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

/* ========================================================
   COMPONENTES VISUAIS AUXILIARES
   ======================================================== */

function SpeedometerGauge({ value = 0, max = 10, size = 68 }) {
  const safeVal = Number(value) || 0
  const safeMax = Number(max) || 10
  const ratio = Math.max(0, Math.min(safeVal / safeMax, 1))
  const targetDeg = -90 + (ratio * 180)
  const [deg, setDeg] = useState(-90)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDeg(targetDeg)
    }, 60)
    return () => clearTimeout(timer)
  }, [targetDeg])

  const gradId = `gaugeGrad_${String(safeVal).replace(/[^a-zA-Z0-9]/g, '_')}_${safeMax}`

  return (
    <div className="speedometer-wrapper" style={{ width: size, height: size * 0.65 }}>
      <svg viewBox="0 0 100 58" className="gauge-svg">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="45%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>
        <path
          d="M 12 50 A 38 38 0 0 1 88 50"
          fill="none"
          stroke="#f1f5f9"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          d="M 12 50 A 38 38 0 0 1 88 50"
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth="8"
          strokeLinecap="round"
        />
        <g
          style={{
            transform: `rotate(${deg}deg)`,
            transformOrigin: '50px 50px',
            transformBox: 'view-box',
            transition: 'transform 1.1s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          <line x1="50" y1="50" x2="50" y2="18" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="50" cy="50" r="4.5" fill="#1e293b" />
          <circle cx="50" cy="50" r="2" fill="#ffffff" />
        </g>
      </svg>
    </div>
  )
}

function TrendSparkline({ baldes = [] }) {
  if (!baldes.length) return null

  const max = 10
  const width = 450
  const height = 90
  const paddingX = 15
  const paddingY = 15

  const pontuacao = baldes.map((b, idx) => ({
    x: paddingX + (idx / Math.max(baldes.length - 1, 1)) * (width - paddingX * 2),
    y: height - paddingY - ((Math.min(b.media ?? 5, max) / max) * (height - paddingY * 2)),
    val: b.media,
  }))

  const pontosPath = pontuacao.map((p) => `${p.x},${p.y}`).join(' L ')

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="trend-line-svg" preserveAspectRatio="none">
      <defs>
        <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="1">
          <stop offset="0%" stopColor="#d97706" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#d97706" stopOpacity="0.0" />
        </linearGradient>
      </defs>
      {pontuacao.length > 0 && (
        <path
          d={`M ${pontuacao[0].x},${height - 4} L ${pontosPath} L ${pontuacao[pontuacao.length - 1].x},${height - 4} Z`}
          fill="url(#areaGradient)"
        />
      )}
      <path
        d={`M ${pontosPath}`}
        fill="none"
        stroke="#c8933b"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {pontuacao.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r="3"
          fill="#ffffff"
          stroke="#b47823"
          strokeWidth="2"
        />
      ))}
    </svg>
  )
}

function PerguntaVisualCard({ pergunta }) {
  if (pergunta.modo === 'media') {
    return (
      <div className="question-metric-card">
        <div className="question-info">
          <span className="question-title">{pergunta.texto}</span>
          <div className="question-score-row">
            <span className="question-score-val">{pergunta.media.toFixed(1)}</span>
            <span className="question-subtext">média · {pergunta.total} resposta(s)</span>
          </div>
        </div>
        <div className="question-visual">
          <SpeedometerGauge value={pergunta.media} max={MAX_POR_TIPO[pergunta.tipo] || 10} size={72} />
        </div>
      </div>
    )
  }

  const maiorContagem = Math.max(...(pergunta.opcoes || []).map((o) => o.quantidade), 1)
  return (
    <div className="question-metric-card full-span">
      <div className="question-info" style={{ width: '100%' }}>
        <span className="question-title">{pergunta.texto}</span>
        <div className="distribution-list">
          {(pergunta.opcoes || []).map((o) => (
            <div key={o.label} className="distribution-item">
              <span className="distribution-label">{o.label}</span>
              <div className="distribution-track">
                <div
                  className="distribution-bar"
                  style={{ width: `${(o.quantidade / maiorContagem) * 100}%` }}
                />
              </div>
              <span className="distribution-count">{o.quantidade}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ScoreIndicator({ score }) {
  if (score === null || score === undefined) return <span className="no-score">—</span>
  
  let scoreClass = 'score-red'
  if (score >= 8) scoreClass = 'score-green'
  else if (score >= 5) scoreClass = 'score-amber'

  return <span className={`score-badge ${scoreClass}`}>{score}</span>
}

/* ========================================================
   FUNÇÕES AUXILIARES DE CÁLCULO E FORMATAÇÃO
   ======================================================== */

function calcularPorUnidade(respostas) {
  const mapa = new Map()
  respostas.forEach((r) => {
    const nome = r.totens?.unidades?.nome || 'Locarti'
    if (!mapa.has(nome)) mapa.set(nome, { nome, total: 0, somaNotas: 0, comNota: 0 })
    const entrada = mapa.get(nome)
    entrada.total += 1
    if (r.nota !== null) {
      entrada.somaNotas += r.nota
      entrada.comNota += 1
    }
  })
  return Array.from(mapa.values())
}

function calcularPorPergunta(respostas, perguntas) {
  const porId = new Map()
  respostas.forEach((r) => {
    (r.respostas_detalhe || []).forEach((item) => {
      if (!porId.has(item.pergunta_id)) porId.set(item.pergunta_id, [])
      porId.get(item.pergunta_id).push(item)
    })
  })

  return perguntas
    .filter((p) => TIPOS_NOTA.includes(p.tipo) || TIPOS_ESCOLHA.includes(p.tipo))
    .map((p) => {
      const itens = porId.get(p.id) || []
      if (itens.length === 0) return null

      if (TIPOS_NOTA.includes(p.tipo)) {
        const validos = itens.filter((i) => typeof i.resposta === 'number')
        if (validos.length === 0) return null
        const soma = validos.reduce((acc, i) => acc + i.resposta, 0)
        return { id: p.id, texto: p.texto, tipo: p.tipo, modo: 'media', media: soma / validos.length, total: validos.length }
      }

      const contagem = new Map()
      itens.forEach((i) => {
        const respostasItem = Array.isArray(i.resposta) ? i.resposta : [i.resposta]
        respostasItem.forEach((valor) => {
          if (!valor) return
          contagem.set(valor, (contagem.get(valor) || 0) + 1)
        })
      })
      const opcoes = Array.from(contagem.entries())
        .map(([label, quantidade]) => ({ label, quantidade }))
        .sort((a, b) => b.quantidade - a.quantidade)
      if (opcoes.length === 0) return null

      return { id: p.id, texto: p.texto, modo: 'distribuicao', opcoes }
    })
    .filter(Boolean)
}

function calcularVolumeEEvolucao(respostas, diasJanela) {
  const hoje = new Date()
  const baldes = []
  const DIAS_EXIBIR = Math.min(diasJanela || 30, 18)

  for (let i = DIAS_EXIBIR - 1; i >= 0; i--) {
    const data = new Date(hoje)
    data.setDate(hoje.getDate() - i)
    const diaSemana = data.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')
    const diaMes = data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    const dataCompleta = `${diaSemana}, ${diaMes}`

    baldes.push({
      id: `${data.toISOString().slice(0, 10)}_${i}`,
      chave: data.toISOString().slice(0, 10),
      label: diaSemana,
      diaSemana,
      diaMes,
      dataCompleta,
      quantidade: 0,
      somaNotas: 0,
      comNota: 0,
    })
  }

  respostas.forEach((r) => {
    const chave = r.created_at?.slice(0, 10)
    const balde = baldes.find((b) => b.chave === chave)
    if (balde) {
      balde.quantidade += 1
      if (r.nota !== null) {
        balde.somaNotas += r.nota
        balde.comNota += 1
      }
    }
  })

  return baldes.map((b) => ({ ...b, media: b.comNota ? b.somaNotas / b.comNota : null }))
}

function formatarData(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function extrairContato(r) {
  let nome = r.nome || ''
  let telefone = r.telefone || ''

  if ((!nome || !telefone) && Array.isArray(r.respostas_detalhe)) {
    const itemContato = r.respostas_detalhe.find(
      (item) => item.tipo === 'contato' || (item.resposta && typeof item.resposta === 'object' && (item.resposta.nome || item.resposta.telefone))
    )
    if (itemContato?.resposta && typeof itemContato.resposta === 'object') {
      if (!nome) nome = itemContato.resposta.nome || ''
      if (!telefone) telefone = itemContato.resposta.telefone || ''
    }
  }

  return { nome: (nome || '').trim(), telefone: (telefone || '').trim() }
}

function exportarCSV(respostas) {
  const cabecalho = ['Data', 'Nome', 'Telefone', 'Unidade', 'Nota', 'Comentário']
  const linhas = respostas.map((r) => {
    const contato = extrairContato(r)
    return [
      formatarData(r.created_at),
      contato.nome || '',
      contato.telefone || '',
      r.totens?.unidades?.nome || 'Locarti',
      r.nota ?? '',
      (r.comentario || '').replace(/"/g, '""'),
    ]
  })

  const csv = [cabecalho, ...linhas]
    .map((linha) => linha.map((v) => `"${v}"`).join(','))
    .join('\n')

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `metricas-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}