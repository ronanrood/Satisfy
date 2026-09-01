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

const TEMPO_RESET_MS = 2000
const TIPOS_NOTA = ['estrelas', 'carinhas', 'nps', 'nota', 'escala_opiniao']
const TIPOS_TEXTO = ['comentario', 'texto_curto']

export default function Totem() {
  const { token } = useParams()
  const [etapa, setEtapa] = useState(ETAPAS.CARREGANDO)
  const [totem, setTotem] = useState(null)
  const [pesquisa, setPesquisa] = useState(null)
  const [config, setConfig] = useState(null)

  const [indice, setIndice] = useState(0)
  const [respostas, setRespostas] = useState([])
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
      setIndice((prev) => prev - 1)
    } else {
      reiniciar()
    }
  }

  function avancarPerguntaSemAlterar() {
    if (indice + 1 < perguntas.length) {
      setIndice((prev) => prev + 1)
    } else {
      finalizar(respostas)
    }
  }

  function responderEAvancar(valor) {
    if (perguntaAtual.tipo === 'encerramento') {
      setMensagemFinal(perguntaAtual.texto)
    }

    const novaResposta = { pergunta_id: perguntaAtual.id, tipo: perguntaAtual.tipo, resposta: valor }
    const respostasAtualizadas = respostas.filter((r) => r.pergunta_id !== perguntaAtual.id)
    const todasRespostas = [...respostasAtualizadas, novaResposta]

    setRespostas(todasRespostas)

    if (indice + 1 < perguntas.length) {
      setIndice((prev) => prev + 1)
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
  const temRespostaAtual = respostas.some((r) => r.pergunta_id === perguntaAtual?.id)

  if (etapa === ETAPAS.CARREGANDO) {
    return <div className="totem-root" style={{ justifyContent: 'center', alignItems: 'center', color: '#64748b' }}>Carregando…</div>
  }

  if (etapa === ETAPAS.ERRO) {
    return (
      <div className="totem-root" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: 24, color: '#64748b' }}>
        <h2 style={{ color: '#0f172a', marginBottom: 8 }}>Totem não configurado ou inativo.</h2>
        <p style={{ margin: 0, opacity: 0.7 }}>Verifique a conexão ou a URL do dispositivo.</p>
      </div>
    )
  }

  return (
    <div className="totem-root">
      {etapa === ETAPAS.BANNER && (
        <div className="totem-banner-wrap" onClick={iniciar}>
          {config?.banner_url ? (
            <img src={config.banner_url} alt="Banner" className="totem-banner-img" />
          ) : (
            <div style={{ zIndex: 2, padding: 32, textAlign: 'center', background: 'rgba(255,255,255,0.95)', borderRadius: 24, maxWidth: '85vw' }}>
              {config?.logo_url && <img src={config.logo_url} alt="Logo" style={{ height: 80, marginBottom: 24 }} />}
              <h1 className="totem-question-title" style={{ marginBottom: 0 }}>
                {config?.texto_boas_vindas || 'Sua opinião é fundamental!'}
              </h1>
            </div>
          )}

          <div className="totem-banner-overlay">
            <button
              className="totem-cta-btn"
              style={{ backgroundColor: corPrimaria }}
              onClick={(e) => {
                e.stopPropagation()
                onIniciar(iniciar)
              }}
            >
              {config?.texto_botao_iniciar || 'Toque para avaliar'}
            </button>
          </div>
        </div>
      )}

      {etapa === ETAPAS.PERGUNTA && perguntaAtual && (
        <>
          <div className="totem-nav-bar">
            <button onClick={voltarPergunta} className="totem-nav-btn" aria-label="Voltar">
              <span style={{ fontSize: '1.2em' }}>←</span>
              <span>{indice === 0 ? 'Início' : 'Voltar'}</span>
            </button>

            <span className="totem-step-counter">
              {indice + 1} / {perguntas.length}
            </span>

            <button
              onClick={avancarPerguntaSemAlterar}
              className="totem-nav-btn"
              style={{
                visibility: temRespostaAtual || indice + 1 === perguntas.length ? 'visible' : 'hidden',
              }}
              aria-label="Avançar"
            >
              <span>{indice + 1 === perguntas.length ? 'Finalizar' : 'Prosseguir'}</span>
              <span style={{ fontSize: '1.2em' }}>→</span>
            </button>
          </div>

          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 6, background: '#e2e8f0', zIndex: 11 }}>
            <div
              style={{
                height: '100%',
                width: `${((indice + 1) / perguntas.length) * 100}%`,
                background: corPrimaria,
                transition: 'width 0.3s ease',
              }}
            />
          </div>

          <div className="totem-content-area">
            <div className="totem-card-body">
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
          </div>
        </>
      )}

      {etapa === ETAPAS.OBRIGADO && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 24, textAlign: 'center' }}>
          <div
            style={{
              width: 90,
              height: 90,
              borderRadius: '50%',
              background: corPrimaria,
              color: '#fff',
              fontSize: 44,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 24,
              boxShadow: '0 12px 28px rgba(0,0,0,0.15)',
            }}
          >
            ✓
          </div>
          <h1 className="totem-question-title" style={{ margin: 0 }}>
            {mensagemFinal || 'Obrigado pela sua avaliação!'}
          </h1>
        </div>
      )}
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
      <div style={{ width: '100%' }}>
        {pergunta.imagem_url && (
          <img
            src={pergunta.imagem_url}
            alt=""
            style={{ maxWidth: '100%', maxHeight: '40vh', borderRadius: 16, marginBottom: 24, objectFit: 'contain' }}
          />
        )}
        <h1 className="totem-question-title">{pergunta.texto}</h1>
        <button
          className="totem-cta-btn"
          style={{ backgroundColor: corPrimaria, width: '100%', maxWidth: 420 }}
          onClick={() => onResponder(null)}
          disabled={enviando}
        >
          {tipo === 'encerramento' ? (enviando ? 'Enviando…' : 'Finalizar') : 'Continuar'}
        </button>
      </div>
    )
  }

  return (
    <div style={{ width: '100%' }}>
      <h1 className="totem-question-title">{pergunta.texto}</h1>

      {tipo === 'estrelas' && (
        <div className="totem-stars-row">
          {[1, 2, 3, 4, 5].map((v) => {
            const ativo = respostaPrevia !== undefined && v <= respostaPrevia
            return (
              <button
                key={v}
                className="totem-star-btn"
                style={{
                  color: ativo ? corPrimaria : '#cbd5e1',
                  transform: ativo ? 'scale(1.15)' : 'none',
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
        <div className="totem-emojis-row">
          {[
            { v: 1, e: '😡' },
            { v: 2, e: '😕' },
            { v: 3, e: '😐' },
            { v: 4, e: '🙂' },
            { v: 5, e: '😍' },
          ].map((o) => (
            <button
              key={o.v}
              className="totem-emoji-btn"
              style={{
                transform: respostaPrevia === o.v ? 'scale(1.25)' : 'none',
                filter: respostaPrevia && respostaPrevia !== o.v ? 'grayscale(0.7) opacity(0.5)' : 'none',
              }}
              onClick={() => onResponder(o.v)}
            >
              {o.e}
            </button>
          ))}
        </div>
      )}

      {(tipo === 'nps' || tipo === 'nota') && (
        <div className="totem-nps-grid">
          {Array.from({ length: 11 }, (_, i) => i).map((v) => {
            const marcado = respostaPrevia === v
            return (
              <button
                key={v}
                className="totem-nps-btn"
                style={{
                  borderColor: corPrimaria,
                  backgroundColor: marcado ? corPrimaria : '#ffffff',
                  color: marcado ? '#ffffff' : '#0f172a',
                  transform: marcado ? 'scale(1.08)' : 'none',
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
        <div className="totem-nps-grid">
          {Array.from(
            { length: (pergunta.escala_max ?? 5) - (pergunta.escala_min ?? 1) + 1 },
            (_, i) => (pergunta.escala_min ?? 1) + i
          ).map((v) => {
            const marcado = respostaPrevia === v
            return (
              <button
                key={v}
                className="totem-nps-btn"
                style={{
                  borderColor: corPrimaria,
                  backgroundColor: marcado ? corPrimaria : '#ffffff',
                  color: marcado ? '#ffffff' : '#0f172a',
                  transform: marcado ? 'scale(1.08)' : 'none',
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
        <div style={{ width: '100%', maxWidth: 540, margin: '0 auto' }}>
          {tipo === 'comentario' ? (
            <textarea
              style={{
                width: '100%',
                padding: 16,
                borderRadius: 14,
                border: '2px solid #cbd5e1',
                fontSize: 18,
                boxSizing: 'border-box',
                outline: 'none',
                fontFamily: 'inherit',
              }}
              value={textoAtual}
              onChange={(e) => setTextoAtual(e.target.value)}
              placeholder="Digite seu feedback aqui..."
              rows={4}
              autoFocus
            />
          ) : (
            <input
              style={{
                width: '100%',
                padding: 16,
                borderRadius: 14,
                border: '2px solid #cbd5e1',
                fontSize: 18,
                boxSizing: 'border-box',
                outline: 'none',
                fontFamily: 'inherit',
              }}
              value={textoAtual}
              onChange={(e) => setTextoAtual(e.target.value)}
              placeholder="Digite sua resposta..."
              autoFocus
            />
          )}
          <div style={{ display: 'flex', gap: 14, marginTop: 20 }}>
            <button
              style={{ flex: 1, padding: '16px 0', borderRadius: 12, border: '1px solid #cbd5e1', background: '#fff', color: '#64748b', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}
              onClick={() => onResponder('')}
              disabled={enviando}
            >
              Pular
            </button>
            <button
              style={{ flex: 2, padding: '16px 0', borderRadius: 12, border: 'none', background: corPrimaria, color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}
              onClick={() => onResponder(textoAtual.trim())}
              disabled={enviando}
            >
              {enviando ? 'Enviando…' : 'Continuar'}
            </button>
          </div>
        </div>
      )}

      {tipo === 'escolha_unica' && (
        <div className="totem-options-list" style={{ maxWidth: 580, margin: '0 auto' }}>
          {(pergunta.opcoes || []).map((opcao) => {
            const marcado = respostaPrevia === opcao
            return (
              <button
                key={opcao}
                className="totem-option-btn"
                style={{
                  borderColor: marcado ? corPrimaria : '#e2e8f0',
                  backgroundColor: marcado ? corPrimaria : '#ffffff',
                  color: marcado ? '#ffffff' : '#0f172a',
                  transform: marcado ? 'scale(1.02)' : 'none',
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
        <div style={{ width: '100%', maxWidth: 580, margin: '0 auto' }}>
          <div className="totem-options-list">
            {(pergunta.opcoes || []).map((opcao) => {
              const marcada = selecoesAtuais.includes(opcao)
              return (
                <button
                  key={opcao}
                  className="totem-option-btn"
                  style={{
                    borderColor: marcada ? corPrimaria : '#e2e8f0',
                    backgroundColor: marcada ? corPrimaria : '#ffffff',
                    color: marcada ? '#ffffff' : '#0f172a',
                  }}
                  onClick={() =>
                    setSelecoesAtuais((prev) =>
                      prev.includes(opcao) ? prev.filter((o) => o !== opcao) : [...prev, opcao]
                    )
                  }
                >
                  <span style={{ marginRight: 12 }}>{marcada ? '☑' : '☐'}</span>
                  {opcao}
                </button>
              )
            })}
          </div>
          <button
            className="totem-cta-btn"
            style={{ backgroundColor: corPrimaria, width: '100%', marginTop: 28 }}
            onClick={() => onResponder(selecoesAtuais)}
            disabled={enviando}
          >
            {enviando ? 'Enviando…' : 'Confirmar Seleção'}
          </button>
        </div>
      )}
    </div>
  )
}