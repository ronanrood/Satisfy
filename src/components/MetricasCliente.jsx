import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

const PERIODOS = [
  { valor: '7', label: 'Últimos 7 dias', dias: 7 },
  { valor: '30', label: 'Últimos 30 dias', dias: 30 },
  { valor: '90', label: 'Últimos 90 dias', dias: 90 },
  { valor: 'todos', label: 'Desde o início', dias: null },
]

export default function MetricasCliente({ clienteId }) {
  const [carregando, setCarregando] = useState(true)
  const [respostas, setRespostas] = useState([])
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

    if (config.dias) {
      const dataInicio = new Date()
      dataInicio.setDate(dataInicio.getDate() - config.dias)
      query = query.gte('created_at', dataInicio.toISOString())
    }

    const { data } = await query
    setRespostas(data || [])
    setCarregando(false)
  }

  const config = PERIODOS.find((p) => p.valor === periodo)
  // agrupa por semana quando o período é longo, senão por dia — mantém o gráfico legível
  const agruparPorSemana = config.dias === null || config.dias > 30
  const baldes = calcularVolume(respostas, config.dias || 90, agruparPorSemana)
  const maiorVolume = Math.max(...baldes.map((b) => b.quantidade), 1)

  const total = respostas.length
  const comNota = respostas.filter((r) => r.nota !== null)
  const media = comNota.length ? comNota.reduce((soma, r) => soma + r.nota, 0) / comNota.length : null
  const recentes = respostas.slice(0, 8)

  return (
    <div>
      <div style={estilos.filtroRow}>
        <label htmlFor="periodo" style={estilos.filtroLabel}>Período</label>
        <select id="periodo" value={periodo} onChange={(e) => setPeriodo(e.target.value)} style={estilos.filtroSelect}>
          {PERIODOS.map((p) => (
            <option key={p.valor} value={p.valor}>{p.label}</option>
          ))}
        </select>
      </div>

      {carregando ? (
        <p className="empty-state">Carregando…</p>
      ) : respostas.length === 0 ? (
        <p className="empty-state">Nenhuma resposta registrada nesse período.</p>
      ) : (
        <>
          <div style={estilos.statsRow}>
            <Stat label="Respostas no período" valor={total} />
            <Stat label="Nota média" valor={media !== null ? media.toFixed(1) : '—'} />
            <Stat label="Unidades ativas" valor={new Set(respostas.map((r) => r.totens?.unidades?.nome)).size} />
          </div>

          <div style={{ marginTop: 24 }}>
            <h3 style={estilos.subtitulo}>Volume {agruparPorSemana ? 'por semana' : 'por dia'}</h3>
            <div style={estilos.barrasWrap}>
              {baldes.map((b) => (
                <div key={b.chave} style={estilos.barraCol}>
                  <div style={{ ...estilos.barra, height: `${(b.quantidade / maiorVolume) * 80 + 4}px` }} title={`${b.quantidade} resposta(s)`} />
                  <span style={estilos.barraLabel}>{b.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 28 }}>
            <h3 style={estilos.subtitulo}>Respostas recentes</h3>
            <table>
              <thead>
                <tr>
                  <th>Quando</th>
                  <th>Unidade</th>
                  <th>Nota</th>
                  <th>Comentário</th>
                </tr>
              </thead>
              <tbody>
                {recentes.map((r) => (
                  <tr key={r.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatarData(r.created_at)}</td>
                    <td>{r.totens?.unidades?.nome || '—'}</td>
                    <td>{r.nota ?? '—'}</td>
                    <td style={{ maxWidth: 280 }}>{r.comentario || <span style={{ color: 'var(--ink-soft)' }}>—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

function Stat({ label, valor }) {
  return (
    <div style={estilos.statBox}>
      <div style={estilos.statValor}>{valor}</div>
      <div style={estilos.statLabel}>{label}</div>
    </div>
  )
}

// Agrupa as respostas em "baldes" de dia ou de semana, cobrindo a janela toda
// (mesmo os dias/semanas sem nenhuma resposta aparecem com quantidade 0)
function calcularVolume(respostas, diasJanela, porSemana) {
  const hoje = new Date()
  const baldes = []

  if (porSemana) {
    const semanas = Math.ceil(diasJanela / 7)
    for (let i = semanas - 1; i >= 0; i--) {
      const fimSemana = new Date(hoje)
      fimSemana.setDate(hoje.getDate() - i * 7)
      const inicioSemana = new Date(fimSemana)
      inicioSemana.setDate(fimSemana.getDate() - 6)
      baldes.push({
        chave: inicioSemana.toISOString().slice(0, 10),
        label: inicioSemana.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        inicio: inicioSemana,
        fim: fimSemana,
        quantidade: 0,
      })
    }

    respostas.forEach((r) => {
      const data = new Date(r.created_at)
      const balde = baldes.find((b) => data >= diaZero(b.inicio) && data <= fimDoDia(b.fim))
      if (balde) balde.quantidade += 1
    })
  } else {
    for (let i = diasJanela - 1; i >= 0; i--) {
      const data = new Date(hoje)
      data.setDate(hoje.getDate() - i)
      baldes.push({
        chave: data.toISOString().slice(0, 10),
        label: data.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
        quantidade: 0,
      })
    }

    respostas.forEach((r) => {
      const chave = r.created_at?.slice(0, 10)
      const balde = baldes.find((b) => b.chave === chave)
      if (balde) balde.quantidade += 1
    })
  }

  return baldes
}

function diaZero(data) {
  const d = new Date(data)
  d.setHours(0, 0, 0, 0)
  return d
}

function fimDoDia(data) {
  const d = new Date(data)
  d.setHours(23, 59, 59, 999)
  return d
}

function formatarData(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

const estilos = {
  filtroRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 },
  filtroLabel: { fontSize: 13, fontWeight: 500, color: 'var(--ink-soft)' },
  filtroSelect: { padding: '8px 12px', border: '1px solid var(--line)', borderRadius: 7, fontSize: 13, background: '#fff' },
  statsRow: { display: 'flex', gap: 16 },
  statBox: {
    flex: 1,
    background: 'var(--paper)',
    border: '1px solid var(--line)',
    borderRadius: 8,
    padding: '16px 18px',
  },
  statValor: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: 28,
    fontWeight: 700,
    color: 'var(--ink)',
  },
  statLabel: { fontSize: 12, color: 'var(--ink-soft)', marginTop: 4 },
  subtitulo: { fontSize: 13, fontWeight: 600, color: 'var(--ink-soft)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.04em' },
  barrasWrap: { display: 'flex', gap: 6, alignItems: 'flex-end', height: 100, padding: '0 4px', overflowX: 'auto' },
  barraCol: { flex: '1 0 18px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 18 },
  barra: { width: '100%', background: 'var(--amber)', borderRadius: '4px 4px 0 0', minHeight: 4 },
  barraLabel: { fontSize: 10, color: 'var(--ink-soft)', textTransform: 'capitalize', whiteSpace: 'nowrap' },
}
