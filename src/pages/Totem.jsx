import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../supabaseClient'

const ETAPAS = {
  CARREGANDO: 'carregando',
  ERRO: 'erro',
  BANNER: 'banner',
  PERGUNTA: 'pergunta',
  OBRIGADO: 'obrigado',
}

const TEMPO_RESET_MS = 8000

export default function Totem() {
  const { token } = useParams()
  const [etapa, setEtapa] = useState(ETAPAS.CARREGANDO)
  const [totem, setTotem] = useState(null)
  const [pesquisa, setPesquisa] = useState(null)
  const [config, setConfig] = useState(null)

  const [indice, setIndice] = useState(0)
  const [respostas, setRespostas] = useState([]) // [{ pergunta_id, tipo, resposta }]
  const [textoAtual, setTextoAtual] = useState('')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    carregarTotem()
  }, [token])

  async function carregarTotem() {
    const { data: t, error: erroTotem } = await supabase
      .from('totens')
      .select('*, unidades(id, cliente_id)')
      .eq('token', token)
      .eq('ativo', true)
      .single()

    if (erroTotem || !t) {
      setEtapa(ETAPAS.ERRO)
      return
    }
    setTotem(t)

    const clienteId = t.unidades.cliente_id

    const { data: p } = await supabase
      .from('pesquisas')
      .select('*')
      .eq('cliente_id', clienteId)
      .eq('ativa', true)
      .maybeSingle()
    setPesquisa(p)

    const { data: configUnidade } = await supabase
      .from('configuracoes')
      .select('*')
      .eq('unidade_id', t.unidades.id)
      .maybeSingle()

    let configFinal = configUnidade
    if (!configFinal) {
      const { data: configCliente } = await supabase
        .from('configuracoes')
        .select('*')
        .eq('cliente_id', clienteId)
        .is('unidade_id', null)
        .maybeSingle()
      configFinal = configCliente
    }

    setConfig(configFinal || null)
    setEtapa(ETAPAS.BANNER)
  }

  const reiniciar = useCallback(() => {
    setIndice(0)
    setRespostas([])
    setTextoAtual('')
    setEtapa(ETAPAS.BANNER)
  }, [])

  useEffect(() => {
    if (etapa === ETAPAS.OBRIGADO) {
      const t = setTimeout(reiniciar, TEMPO_RESET_MS)
      return () => clearTimeout(t)
    }
  }, [etapa, reiniciar])

  const perguntas = pesquisa?.perguntas?.length ? pesquisa.perguntas : []
  const perguntaAtual = perguntas[indice]

  function iniciar() {
    if (perguntas.length === 0) {
      // sem perguntas cadastradas ainda — evita travar o totem
      finalizar([])
      return
    }
    setEtapa(ETAPAS.PERGUNTA)
  }

  function responderEAvancar(valor) {
    const novaResposta = { pergunta_id: perguntaAtual.id, tipo: perguntaAtual.tipo, resposta: valor }
    const todasRespostas = [...respostas, novaResposta]
    setRespostas(todasRespostas)
    setTextoAtual('')

    if (indice + 1 < perguntas.length) {
      setIndice(indice + 1)
    } else {
      finalizar(todasRespostas)
    }
  }

  async function finalizar(todasRespostas) {
    setEnviando(true)

    const primeiraNota = todasRespostas.find((r) => r.tipo !== 'texto')
    const textosCombinados = todasRespostas
      .filter((r) => r.tipo === 'texto' && r.resposta?.trim())
      .map((r) => r.resposta.trim())
      .join(' | ')

    await supabase.from('respostas').insert({
      totem_id: totem.id,
      pesquisa_id: pesquisa?.id,
      nota: primeiraNota ? primeiraNota.resposta : null,
      comentario: textosCombinados || null,
      respostas_detalhe: todasRespostas,
    })

    setEnviando(false)
    setEtapa(ETAPAS.OBRIGADO)
  }

  const corPrimaria = config?.cor_primaria || '#e8a33d'

  if (etapa === ETAPAS.CARREGANDO) return <TelaCentral>Carregando…</TelaCentral>

  if (etapa === ETAPAS.ERRO) {
    return (
      <TelaCentral>
        Este totem não está configurado corretamente.
        <div style={{ fontSize: 14, marginTop: 8, opacity: 0.6 }}>Avise o suporte do Satisfy.</div>
      </TelaCentral>
    )
  }

  return (
    <div style={estilos.tela}>
      {etapa === ETAPAS.BANNER && (
        <TelaBanner config={config} corPrimaria={corPrimaria} onIniciar={iniciar} />
      )}

      {etapa === ETAPAS.PERGUNTA && perguntaAtual && (
        <TelaPergunta
          pergunta={perguntaAtual}
          corPrimaria={corPrimaria}
          textoAtual={textoAtual}
          setTextoAtual={setTextoAtual}
          enviando={enviando}
          onResponder={responderEAvancar}
        />
      )}

      {etapa === ETAPAS.OBRIGADO && (
        <div style={estilos.obrigadoWrap}>
          <div style={{ ...estilos.check, background: corPrimaria }}>✓</div>
          <h1 style={estilos.titulo}>Obrigado pela sua avaliação!</h1>
        </div>
      )}
    </div>
  )
}

function TelaBanner({ config, corPrimaria, onIniciar }) {
  return (
    <button onClick={onIniciar} style={estilos.bannerBotao} aria-label="Toque para iniciar a avaliação">
      {config?.banner_url ? (
        <img src={config.banner_url} alt="" style={estilos.bannerImagem} />
      ) : (
        <div style={{ ...estilos.bannerPlaceholder, borderColor: corPrimaria }}>
          {config?.logo_url && <img src={config.logo_url} alt="" style={{ height: 56, marginBottom: 20 }} />}
          <h1 style={estilos.titulo}>{config?.texto_boas_vindas || 'Queremos saber sua opinião!'}</h1>
        </div>
      )}
      <span style={{ ...estilos.bannerCta, background: corPrimaria }}>
        {config?.texto_botao_iniciar || 'Toque para avaliar'}
      </span>
    </button>
  )
}

function TelaPergunta({ pergunta, corPrimaria, textoAtual, setTextoAtual, enviando, onResponder }) {
  return (
    <div style={{ width: '100%', maxWidth: 520 }}>
      <h1 style={estilos.titulo}>{pergunta.texto}</h1>

      {pergunta.tipo === 'estrelas' && (
        <div style={estilos.estrelasRow}>
          {[1, 2, 3, 4, 5].map((v) => (
            <button key={v} style={{ ...estilos.estrelaBotao, color: corPrimaria }} onClick={() => onResponder(v)} aria-label={`${v} estrelas`}>★</button>
          ))}
        </div>
      )}

      {pergunta.tipo === 'carinhas' && (
        <div style={estilos.carinhasRow}>
          {[{ v: 1, e: '😡' }, { v: 2, e: '😕' }, { v: 3, e: '😐' }, { v: 4, e: '🙂' }, { v: 5, e: '😄' }].map((o) => (
            <button key={o.v} style={estilos.carinhaBotao} onClick={() => onResponder(o.v)}>{o.e}</button>
          ))}
        </div>
      )}

      {pergunta.tipo === 'nps' && (
        <div style={estilos.npsGrid}>
          {Array.from({ length: 11 }, (_, i) => i).map((v) => (
            <button key={v} style={{ ...estilos.npsBotao, borderColor: corPrimaria }} onClick={() => onResponder(v)}>{v}</button>
          ))}
        </div>
      )}

      {pergunta.tipo === 'texto' && (
        <>
          <textarea
            style={estilos.textarea}
            value={textoAtual}
            onChange={(e) => setTextoAtual(e.target.value)}
            placeholder="Escreva sua resposta (opcional)"
            rows={4}
            autoFocus
          />
          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <button style={estilos.botaoPular} onClick={() => onResponder('')} disabled={enviando}>Pular</button>
            <button style={{ ...estilos.botaoEnviar, background: corPrimaria }} onClick={() => onResponder(textoAtual.trim())} disabled={enviando}>
              {enviando ? 'Enviando…' : 'Continuar'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function TelaCentral({ children }) {
  return <div style={{ ...estilos.tela, color: '#8a97a1' }}>{children}</div>
}

const estilos = {
  tela: {
    minHeight: '100vh',
    width: '100vw',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '40px 24px',
    background: '#fdfdfc',
    fontFamily: "'Inter', sans-serif",
  },
  titulo: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: 'clamp(24px, 4vw, 36px)',
    fontWeight: 700,
    color: '#16212b',
    marginBottom: 40,
    maxWidth: 640,
  },
  bannerBotao: {
    all: 'unset',
    cursor: 'pointer',
    width: '100%',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bannerImagem: { maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain' },
  bannerPlaceholder: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: 48,
    border: '2px dashed',
    borderRadius: 16,
  },
  bannerCta: {
    marginTop: 32,
    padding: '16px 40px',
    borderRadius: 999,
    color: '#fff',
    fontSize: 17,
    fontWeight: 700,
    fontFamily: "'Space Grotesk', sans-serif",
  },
  estrelasRow: { display: 'flex', gap: 12, justifyContent: 'center' },
  estrelaBotao: { fontSize: 56, background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1, padding: 8 },
  carinhasRow: { display: 'flex', gap: 16, justifyContent: 'center' },
  carinhaBotao: { fontSize: 52, background: 'none', border: 'none', cursor: 'pointer', padding: 8 },
  npsGrid: { display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', maxWidth: 560, margin: '0 auto' },
  npsBotao: { width: 48, height: 48, borderRadius: 8, border: '2px solid', background: '#fff', fontSize: 18, fontWeight: 600, cursor: 'pointer' },
  textarea: { width: '100%', padding: 16, borderRadius: 10, border: '1px solid #e1e6ea', fontSize: 16, fontFamily: "'Inter', sans-serif", resize: 'none' },
  botaoPular: { flex: 1, padding: '14px 0', borderRadius: 8, border: '1px solid #e1e6ea', background: '#fff', color: '#3d4f5c', fontSize: 15, fontWeight: 600, cursor: 'pointer' },
  botaoEnviar: { flex: 2, padding: '14px 0', borderRadius: 8, border: 'none', color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer' },
  obrigadoWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
  check: { width: 72, height: 72, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 34, marginBottom: 24 },
}
