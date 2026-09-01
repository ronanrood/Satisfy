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

// tipos que geram uma "nota" numérica pro resumo do dashboard
const TIPOS_NOTA = ['estrelas', 'carinhas', 'nps', 'nota', 'escala_opiniao']
// tipos de texto livre que entram no campo "comentário" do resumo
const TIPOS_TEXTO = ['comentario', 'texto_curto']

export default function Totem() {
  const { token } = useParams()
  const [etapa, setEtapa] = useState(ETAPAS.CARREGANDO)
  const [totem, setTotem] = useState(null)
  const [pesquisa, setPesquisa] = useState(null)
  const [config, setConfig] = useState(null)

  const [indice, setIndice] = useState(0)
  const [respostas, setRespostas] = useState([]) // [{ pergunta_id, tipo, resposta }]
  const [textoAtual, setTextoAtual] = useState('')
  const [selecoesAtuais, setSelecoesAtuais] = useState([])
  const [mensagemFinal, setMensagemFinal] = useState(null)
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
    setSelecoesAtuais([])
    setMensagemFinal(null)
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

  // Carrega estado anterior se o usuário voltar para uma pergunta já respondida
  useEffect(() => {
    if (etapa === ETAPAS.PERGUNTA && perguntaAtual) {
      const respAnterior = respostas.find((r) => r.pergunta_id === perguntaAtual.id)
      if (respAnterior) {
        if (Array.isArray(respAnterior.resposta)) {
          setSelecoesAtuais(respAnterior.resposta)
          setTextoAtual('')
        } else if (typeof respAnterior.resposta === 'string') {
          setTextoAtual(respAnterior.resposta)
          setSelecoesAtuais([])
        } else {
          setTextoAtual('')
          setSelecoesAtuais([])
        }
      } else {
        setTextoAtual('')
        setSelecoesAtuais([])
      }
    }
  }, [indice, etapa, perguntaAtual])

  function iniciar() {
    if (perguntas.length === 0) {
      finalizar([])
      return
    }
    setIndice(0)
    setEtapa(ETAPAS.PERGUNTA)
  }

  function voltarPergunta() {
    if (indice > 0) {
      setIndice(indice - 1)
    } else {
      reiniciar()
    }
  }

  function responderEAvancar(valor) {
    if (perguntaAtual.tipo === 'encerramento') {
      setMensagemFinal(perguntaAtual.texto)
    }

    const novaResposta = { pergunta_id: perguntaAtual.id, tipo: perguntaAtual.tipo, resposta: valor }
    
    // Substitui se já existia resposta para essa pergunta ou adiciona nova
    const respostasAtualizadas = respostas.filter((r) => r.pergunta_id !== perguntaAtual.id)
    const todasRespostas = [...respostasAtualizadas, novaResposta]
    
    setRespostas(todasRespostas)

    if (indice + 1 < perguntas.length) {
      setIndice(indice + 1)
    } else {
      finalizar(todasRespostas)
    }
  }

  async function finalizar(todasRespostas) {
    setEnviando(true)

    const primeiraNota = todasRespostas.find((r) => TIPOS_NOTA.includes(r.tipo))
    const textosCombinados = todasRespostas
      .filter((r) => TIPOS_TEXTO.includes(r.tipo) && typeof r.resposta === 'string' && r.resposta.trim())
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
        <div style={estilos.perguntaContainer}>
          {/* Barra superior de navegação e progresso */}
          <div style={estilos.barraProgressoWrap}>
            <button onClick={voltarPergunta} style={estilos.botaoVoltar} aria-label="Voltar pergunta">
              <span style={{ fontSize: 20 }}>←</span> Voltar
            </button>

            <span style={estilos.indicadorPassos}>
              {indice + 1} de {perguntas.length}
            </span>

            {/* Barra de progresso visual */}
            <div style={estilos.progressoTrack}>
              <div
                style={{
                  ...estilos.progressoFill,
                  width: `${((indice + 1) / perguntas.length) * 100}%`,
                  background: corPrimaria,
                }}
              />
            </div>
          </div>

          <TelaPergunta
            pergunta={perguntaAtual}
            corPrimaria={corPrimaria}
            respostaPrevia={respostas.find((r) => r.pergunta_id === perguntaAtual.id)?.resposta}
            textoAtual={textoAtual}
            setTextoAtual={setTextoAtual}
            selecoesAtuais={selecoesAtuais}
            setSelecoesAtuais={setSelecoesAtuais}
            enviando={enviando}
            onResponder={responderEAvancar}
          />
        </div>
      )}

      {etapa === ETAPAS.OBRIGADO && (
        <div style={estilos.obrigadoWrap}>
          <div style={{ ...estilos.check, background: corPrimaria }}>✓</div>
          <h1 style={estilos.titulo}>{mensagemFinal || 'Obrigado pela sua avaliação!'}</h1>
        </div>
      )}
    </div>
  )
}

function TelaBanner({ config, corPrimaria, onIniciar }) {
  return (
    <div style={estilos.bannerContainer} onClick={onIniciar}>
      {config?.banner_url ? (
        <img src={config.banner_url} alt="Banner" style={estilos.bannerImagemFull} />
      ) : (
        <div style={{ ...estilos.bannerPlaceholder, borderColor: corPrimaria }}>
          {config?.logo_url && <img src={config.logo_url} alt="" style={{ height: 64, marginBottom: 24 }} />}
          <h1 style={estilos.titulo}>{config?.texto_boas_vindas || 'Queremos saber sua opinião!'}</h1>
        </div>
      )}

      {/* Camada sobreposta com botão chamativo */}
      <div style={estilos.bannerOverlay}>
        <button
          style={{ ...estilos.bannerCta, background: corPrimaria }}
          onClick={(e) => {
            e.stopPropagation()
            onIniciar()
          }}
        >
          {config?.texto_botao_iniciar || 'Toque para começar'}
        </button>
      </div>
    </div>
  )
}

function TelaPergunta({
  pergunta,
  corPrimaria,
  respostaPrevia,
  textoAtual,
  setTextoAtual,
  selecoesAtuais,
  setSelecoesAtuais,
  enviando,
  onResponder,
}) {
  const tipo = pergunta.tipo

  if (['boas_vindas', 'imagem', 'encerramento'].includes(tipo)) {
    return (
      <div style={{ width: '100%', maxWidth: 580, margin: '0 auto' }}>
        {pergunta.imagem_url && (
          <img
            src={pergunta.imagem_url}
            alt=""
            style={{ maxWidth: '100%', maxHeight: 320, borderRadius: 12, marginBottom: 28, objectFit: 'contain' }}
          />
        )}
        <h1 style={estilos.titulo}>{pergunta.texto}</h1>
        <button
          style={{ ...estilos.botaoEnviar, background: corPrimaria, flex: 'none', padding: '16px 48px' }}
          onClick={() => onResponder(null)}
          disabled={enviando}
        >
          {tipo === 'encerramento' ? (enviando ? 'Enviando…' : 'Concluir') : 'Continuar'}
        </button>
      </div>
    )
  }

  return (
    <div style={{ width: '100%', maxWidth: 540, margin: '0 auto' }}>
      <h1 style={estilos.titulo}>{pergunta.texto}</h1>

      {tipo === 'estrelas' && (
        <div style={estilos.estrelasRow}>
          {[1, 2, 3, 4, 5].map((v) => {
            const selecionado = respostaPrevia !== undefined && v <= respostaPrevia
            return (
              <button
                key={v}
                style={{
                  ...estilos.estrelaBotao,
                  color: selecionado ? corPrimaria : '#d1d8de',
                  transform: selecionado ? 'scale(1.1)' : 'none',
                }}
                onClick={() => onResponder(v)}
                aria-label={`${v} estrelas`}
              >
                ★
              </button>
            )
          })}
        </div>
      )}

      {tipo === 'carinhas' && (
        <div style={estilos.carinhasRow}>
          {[
            { v: 1, e: '😡' },
            { v: 2, e: '😕' },
            { v: 3, e: '😐' },
            { v: 4, e: '🙂' },
            { v: 5, e: '😄' },
          ].map((o) => (
            <button
              key={o.v}
              style={{
                ...estilos.carinhaBotao,
                transform: respostaPrevia === o.v ? 'scale(1.25)' : 'none',
              }}
              onClick={() => onResponder(o.v)}
            >
              {o.e}
            </button>
          ))}
        </div>
      )}

      {(tipo === 'nps' || tipo === 'nota') && (
        <div style={estilos.npsGrid}>
          {Array.from({ length: 11 }, (_, i) => i).map((v) => {
            const marcado = respostaPrevia === v
            return (
              <button
                key={v}
                style={{
                  ...estilos.npsBotao,
                  borderColor: corPrimaria,
                  background: marcado ? corPrimaria : '#fff',
                  color: marcado ? '#fff' : '#16212b',
                }}
                onClick={() => onResponder(v)}
              >
                {v}
              </button>
            )
          })}
        </div>
      )}

      {tipo === 'escala_opiniao' && (
        <div style={estilos.npsGrid}>
          {Array.from(
            { length: (pergunta.escala_max ?? 5) - (pergunta.escala_min ?? 1) + 1 },
            (_, i) => (pergunta.escala_min ?? 1) + i
          ).map((v) => {
            const marcado = respostaPrevia === v
            return (
              <button
                key={v}
                style={{
                  ...estilos.npsBotao,
                  borderColor: corPrimaria,
                  background: marcado ? corPrimaria : '#fff',
                  color: marcado ? '#fff' : '#16212b',
                }}
                onClick={() => onResponder(v)}
              >
                {v}
              </button>
            )
          })}
        </div>
      )}

      {(tipo === 'comentario' || tipo === 'texto_curto') && (
        <>
          {tipo === 'comentario' ? (
            <textarea
              style={estilos.textarea}
              value={textoAtual}
              onChange={(e) => setTextoAtual(e.target.value)}
              placeholder="Escreva sua resposta (opcional)"
              rows={4}
              autoFocus
            />
          ) : (
            <input
              style={estilos.inputCurto}
              value={textoAtual}
              onChange={(e) => setTextoAtual(e.target.value)}
              placeholder="Escreva sua resposta (opcional)"
              autoFocus
            />
          )}
          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <button style={estilos.botaoPular} onClick={() => onResponder('')} disabled={enviando}>
              Pular
            </button>
            <button
              style={{ ...estilos.botaoEnviar, background: corPrimaria }}
              onClick={() => onResponder(textoAtual.trim())}
              disabled={enviando}
            >
              {enviando ? 'Enviando…' : 'Continuar'}
            </button>
          </div>
        </>
      )}

      {tipo === 'data' && (
        <>
          <input
            type="date"
            style={estilos.inputCurto}
            value={textoAtual}
            onChange={(e) => setTextoAtual(e.target.value)}
            autoFocus
          />
          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <button style={estilos.botaoPular} onClick={() => onResponder(null)} disabled={enviando}>
              Pular
            </button>
            <button
              style={{ ...estilos.botaoEnviar, background: corPrimaria }}
              onClick={() => onResponder(textoAtual || null)}
              disabled={enviando || !textoAtual}
            >
              {enviando ? 'Enviando…' : 'Continuar'}
            </button>
          </div>
        </>
      )}

      {tipo === 'escolha_unica' && (
        <div style={estilos.opcoesColuna}>
          {(pergunta.opcoes || []).map((opcao) => {
            const marcado = respostaPrevia === opcao
            return (
              <button
                key={opcao}
                style={{
                  ...estilos.opcaoBotao,
                  borderColor: corPrimaria,
                  background: marcado ? corPrimaria : '#fff',
                  color: marcado ? '#fff' : '#16212b',
                  fontWeight: marcado ? 700 : 500,
                }}
                onClick={() => onResponder(opcao)}
              >
                {opcao}
              </button>
            )
          })}
        </div>
      )}

      {tipo === 'escolha_multipla' && (
        <>
          <div style={estilos.opcoesColuna}>
            {(pergunta.opcoes || []).map((opcao) => {
              const marcada = selecoesAtuais.includes(opcao)
              return (
                <button
                  key={opcao}
                  style={{
                    ...estilos.opcaoBotao,
                    borderColor: corPrimaria,
                    background: marcada ? corPrimaria : '#fff',
                    color: marcada ? '#fff' : '#16212b',
                  }}
                  onClick={() =>
                    setSelecoesAtuais((prev) =>
                      prev.includes(opcao) ? prev.filter((o) => o !== opcao) : [...prev, opcao]
                    )
                  }
                >
                  {marcada ? '✓ ' : ''}{opcao}
                </button>
              )
            })}
          </div>
          <button
            style={{ ...estilos.botaoEnviar, background: corPrimaria, flex: 'none', padding: '16px 48px', marginTop: 24 }}
            onClick={() => onResponder(selecoesAtuais)}
            disabled={enviando}
          >
            {enviando ? 'Enviando…' : 'Continuar'}
          </button>
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
    margin: 0,
    padding: 0,
    overflow: 'hidden',
    position: 'relative',
    background: '#f8fafc',
    fontFamily: "'Inter', sans-serif",
  },
  bannerContainer: {
    position: 'relative',
    width: '100vw',
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    background: '#0f172a',
    overflow: 'hidden',
  },
  bannerImagemFull: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    objectPosition: 'center',
  },
  bannerOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.1) 40%, transparent 100%)',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingBottom: '8vh',
    zIndex: 2,
  },
  bannerPlaceholder: {
    zIndex: 2,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: 48,
    border: '2px dashed',
    borderRadius: 20,
    background: 'rgba(255,255,255,0.9)',
    maxWidth: '80vw',
  },
  bannerCta: {
    padding: '20px 48px',
    borderRadius: 999,
    color: '#fff',
    fontSize: 'clamp(18px, 2.5vw, 24px)',
    fontWeight: 700,
    fontFamily: "'Space Grotesk', sans-serif",
    border: 'none',
    boxShadow: '0 12px 30px rgba(0, 0, 0, 0.35)',
    cursor: 'pointer',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  },
  perguntaContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px 24px',
    boxSizing: 'border-box',
    position: 'relative',
  },
  barraProgressoWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: '20px 32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  botaoVoltar: {
    background: 'transparent',
    border: '1px solid #d1d8de',
    color: '#475569',
    fontSize: 15,
    fontWeight: 600,
    borderRadius: 8,
    padding: '8px 16px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    transition: 'all 0.2s ease',
  },
  indicadorPassos: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: 600,
  },
  progressoTrack: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: 6,
    background: '#e2e8f0',
  },
  progressoFill: {
    height: '100%',
    transition: 'width 0.3s ease',
  },
  titulo: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: 'clamp(24px, 3.5vw, 38px)',
    fontWeight: 700,
    color: '#0f172a',
    marginBottom: 36,
    lineHeight: 1.25,
    textAlign: 'center',
  },
  estrelasRow: { display: 'flex', gap: 14, justifyContent: 'center' },
  estrelaBotao: {
    fontSize: 'clamp(52px, 8vw, 76px)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    lineHeight: 1,
    padding: 6,
    transition: 'all 0.2s ease',
  },
  carinhasRow: { display: 'flex', gap: 18, justifyContent: 'center' },
  carinhaBotao: {
    fontSize: 'clamp(48px, 7vw, 68px)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 6,
    transition: 'transform 0.2s ease',
  },
  npsGrid: { display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', maxWidth: 560, margin: '0 auto' },
  npsBotao: {
    width: 52,
    height: 52,
    borderRadius: 10,
    border: '2px solid',
    fontSize: 18,
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  textarea: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    border: '1px solid #cbd5e1',
    fontSize: 16,
    fontFamily: "'Inter', sans-serif",
    resize: 'none',
    boxSizing: 'border-box',
    background: '#fff',
  },
  inputCurto: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    border: '1px solid #cbd5e1',
    fontSize: 16,
    fontFamily: "'Inter', sans-serif",
    boxSizing: 'border-box',
    background: '#fff',
  },
  botaoPular: {
    flex: 1,
    padding: '16px 0',
    borderRadius: 10,
    border: '1px solid #cbd5e1',
    background: '#fff',
    color: '#475569',
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
  },
  botaoEnviar: {
    flex: 2,
    padding: '16px 0',
    borderRadius: 10,
    border: 'none',
    color: '#fff',
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
  },
  obrigadoWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' },
  check: {
    width: 84,
    height: 84,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: 40,
    marginBottom: 24,
    boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
  },
  opcoesColuna: { display: 'flex', flexDirection: 'column', gap: 12, width: '100%' },
  opcaoBotao: {
    padding: '16px 22px',
    borderRadius: 12,
    border: '2px solid',
    fontSize: 16,
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.2s ease',
  },
}