import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

const PERIODOS = [
  { valor: '7', label: 'Últimos 7 dias', dias: 7 },
  { valor: '30', label: 'Últimos 30 dias', dias: 30 },
  { valor: '90', label: 'Últimos 90 dias', dias: 90 },
  { valor: 'todos', label: 'Desde o início', dias: null },
]

const TIPOS_NOTA = ['estrelas', 'carinhas', 'nps', 'nota', 'escala_opiniao']
const TIPOS_ESCOLHA = ['escolha_unica', 'escolha_multipla']

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

    if (config.dias) {
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
  const agruparPorSemana = config.dias === null || config.dias > 30
  const baldes = calcularVolume(respostas, config.dias || 90, agruparPorSemana)
  const maiorVolume = Math.max(...baldes.map((b) => b.quantidade), 1)

  const total = respostas.length
  const comNota = respostas.filter((r) => r.nota !== null)
  const media = comNota.length ? comNota.reduce((soma, r) => soma + r.nota, 0) / comNota.length : null
  const recentes = respostas.slice(0, 8)

  const porUnidade = calcularPorUnidade(respostas)
  const porPergunta = calcularPorPergunta(respostas, perguntas)

  return (
    <div>
      <div style={estilos.filtroRow}>
        <label htmlFor="periodo" style={estilos.filtroLabel}>Período</label>
        <select id="periodo" value={periodo} onChange={(e) => setPeriodo(e.target.value)} style={estilos.filtroSelect}>
          {PERIODOS.map((p) => (
            <option key={p.valor} value={p.valor}>{p.label}</option>
          ))}
        </select>

        {respostas.length > 0 && (
          <button className="btn-ghost" style={{ marginLeft: 'auto', padding: '8px 14px', fontSize: 13 }} onClick={() => exportarCSV(respostas)}>
            ⭳ Exportar CSV
          </button>
        )}
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
            <Stat label="Unidades ativas" valor={porUnidade.length} />
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

          {porUnidade.length > 1 && (
            <div style={{ marginTop: 28 }}>
              <h3 style={estilos.subtitulo}>Comparação por unidade</h3>
              <table>
                <thead>
                  <tr>
                    <th>Unidade</th>
                    <th>Respostas</th>
                    <th>Nota média</th>
                  </tr>
                </thead>
                <tbody>
                  {porUnidade.map((u) => (
                    <tr key={u.nome}>
                      <td>{u.nome}</td>
                      <td>{u.total}</td>
                      <td>{u.media !== null ? u.media.toFixed(1) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {porPergunta.length > 0 && (
            <div style={{ marginTop: 28 }}>
              <h3 style={estilos.subtitulo}>Detalhamento por pergunta</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {porPergunta.map((p) => (
                  <PerguntaDetalhe key={p.id} pergunta={p} />
                ))}
              </div>
            </div>
          )}

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

function PerguntaDetalhe({ pergunta }) {
  if (pergunta.modo === 'media') {
    return (
      <div>
        <div style={estilos.perguntaTitulo}>{pergunta.texto}</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={estilos.perguntaMedia}>{pergunta.media.toFixed(1)}</span>
          <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>média · {pergunta.total} resposta(s)</span>
        </div>
      </div>
    )
  }

  // modo === 'distribuicao' (múltipla escolha/seleção)
  const maiorContagem = Math.max(...pergunta.opcoes.map((o) => o.quantidade), 1)
  return (
    <div>
      <div style={estilos.perguntaTitulo}>{pergunta.texto}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {pergunta.opcoes.map((o) => (
          <div key={o.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13, width: 140, flexShrink: 0, color: 'var(--ink-soft)' }}>{o.label}</span>
            <div style={{ flex: 1, background: 'var(--paper)', borderRadius: 4, overflow: 'hidden', height: 16 }}>
              <div style={{ width: `${(o.quantidade / maiorContagem) * 100}%`, background: 'var(--amber)', height: '100%' }} />
            </div>
            <span style={{ fontSize: 12, color: 'var(--ink-soft)', width: 24, textAlign: 'right' }}>{o.quantidade}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function calcularPorUnidade(respostas) {
  const mapa = new Map()
  respostas.forEach((r) => {
    const nome = r.totens?.unidades?.nome || 'Sem unidade'
    if (!mapa.has(nome)) mapa.set(nome, { nome, total: 0, somaNotas: 0, comNota: 0 })
    const entrada = mapa.get(nome)
    entrada.total += 1
    if (r.nota !== null) {
      entrada.somaNotas += r.nota
      entrada.comNota += 1
    }
  })
  return Array.from(mapa.values())
    .map((e) => ({ nome: e.nome, total: e.total, media: e.comNota ? e.somaNotas / e.comNota : null }))
    .sort((a, b) => b.total - a.total)
}

// Junta as respostas detalhadas (jsonb) de todas as respostas, agrupando por pergunta
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
        return { id: p.id, texto: p.texto, modo: 'media', media: soma / validos.length, total: validos.length }
      }

      // escolha_unica / escolha_multipla
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

function exportarCSV(respostas) {
  const cabecalho = ['Data', 'Unidade', 'Nota', 'Comentário']
  const linhas = respostas.map((r) => [
    formatarData(r.created_at),
    r.totens?.unidades?.nome || '',
    r.nota ?? '',
    (r.comentario || '').replace(/"/g, '""'),
  ])

  const csv = [cabecalho, ...linhas]
    .map((linha) => linha.map((valor) => `"${valor}"`).join(','))
    .join('\n')

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `respostas-satisfy-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

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
  perguntaTitulo: { fontSize: 14, fontWeight: 600, marginBottom: 8 },
  perguntaMedia: { fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 700, color: 'var(--amber-deep)' },
}
