import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { 
  FiMessageSquare, 
  FiHome, 
  FiStar, 
  FiDownload, 
  FiPrinter, 
  FiUser 
} from 'react-icons/fi'

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
  const recentes = respostas.slice(0, 8)

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
          <div className="export-actions" style={{ display: 'flex', gap: 10 }}>
            <button className="btn-export-csv" onClick={() => exportarCSV(respostas)}>
              <FiDownload /> Exportar CSV
            </button>
            <button className="btn-export-csv" onClick={() => window.print()}>
              <FiPrinter /> Exportar PDF
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

          {/* Gráficos Lado a Lado: Volume e Evolução */}
          <div className="charts-double-row">
            <div className="chart-box">
              <h4 className="chart-title">
                VOLUME DE RESPOSTAS por Dia (Últimos {config?.dias || 30} Dias)
              </h4>
              <div className="bar-chart-container">
                {baldes.map((b, idx) => {
                  const alturaPct = (b.quantidade / maiorVolume) * 85
                  return (
                    <div key={idx} className="bar-column">
                      <div className="bar-track">
                        <div
                          className="bar-fill"
                          style={{ height: `${Math.max(alturaPct, 6)}%` }}
                          title={`${b.label}: ${b.quantidade} resposta(s)`}
                        />
                      </div>
                      <span className="bar-tick">{b.label}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="chart-box">
              <h4 className="chart-title">EVOLUÇÃO da Nota MÉDIA</h4>
              <div className="line-chart-container">
                <TrendSparkline baldes={baldes} />
                <div className="chart-axis-labels">
                  {baldes.map((b, idx) => (
                    <span key={idx} className="bar-tick">{b.label}</span>
                  ))}
                </div>
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

          {/* Tabela de Respostas Recentes */}
          <div className="recent-section">
            <h4 className="section-title">RESPOSTAS RECENTES</h4>
            <div className="table-styled-container">
              <table className="clean-table">
                <thead>
                  <tr>
                    <th>QUANDO</th>
                    <th>UNIDADE</th>
                    <th>SCORE</th>
                    <th>COMMENTARY</th>
                  </tr>
                </thead>
                <tbody>
                  {recentes.map((r) => (
                    <tr key={r.id}>
                      <td className="cell-date">{formatarData(r.created_at)}</td>
                      <td className="cell-unit">
                        <div className="avatar-chip">
                          <FiUser className="avatar-icon" />
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
                  ))}
                </tbody>
              </table>
            </div>
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
  const ratio = Math.max(0, Math.min(safeVal / max, 1))
  const rotationDeg = -90 + (ratio * 180)

  return (
    <div className="speedometer-wrapper" style={{ width: size, height: size * 0.65 }}>
      <svg viewBox="0 0 100 58" className="gauge-svg">
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
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
          stroke="url(#gaugeGradient)"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <g transform={`translate(50, 50) rotate(${rotationDeg})`}>
          <line x1="0" y1="0" x2="0" y2="-32" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="0" cy="0" r="4.5" fill="#334155" />
          <circle cx="0" cy="0" r="2" fill="#ffffff" />
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
    baldes.push({
      chave: data.toISOString().slice(0, 10),
      label: data.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
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

function exportarCSV(respostas) {
  const cabecalho = ['Data', 'Unidade', 'Nota', 'Comentário']
  const linhas = respostas.map((r) => [
    formatarData(r.created_at),
    r.totens?.unidades?.nome || 'Locarti',
    r.nota ?? '',
    (r.comentario || '').replace(/"/g, '""'),
  ])

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