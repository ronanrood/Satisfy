import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

// Cada tipo define se tem "opções" (múltipla escolha/seleção), se tem
// "imagem" (boas-vindas, imagem, encerramento) e se tem "escala" (escala de opinião)
const TIPOS = [
  { valor: 'boas_vindas', label: 'Boas-vindas', tag: 'Mensagem' },
  { valor: 'imagem', label: 'Imagem', tag: 'Mensagem', temImagem: true },
  { valor: 'escolha_unica', label: 'Múltipla-escolha (1 opção)', temOpcoes: true },
  { valor: 'escolha_multipla', label: 'Múltipla-seleção (várias opções)', temOpcoes: true },
  { valor: 'nps', label: 'NPS (0-10)' },
  { valor: 'comentario', label: 'Comentário (texto longo)' },
  { valor: 'texto_curto', label: 'Texto curto' },
  { valor: 'data', label: 'Data' },
  { valor: 'nota', label: 'Nota (0-10)' },
  { valor: 'estrelas', label: 'Estrelas (1-5)' },
  { valor: 'carinhas', label: 'Carinhas (1-5)' },
  { valor: 'escala_opiniao', label: 'Escala de opinião (numérica)', temEscala: true },
  { valor: 'encerramento', label: 'Encerramento', tag: 'Mensagem' },
]

function infoTipo(tipo) {
  return TIPOS.find((t) => t.valor === tipo) || TIPOS[5]
}

function novaPergunta() {
  return {
    id: crypto.randomUUID().slice(0, 8),
    tipo: 'comentario',
    texto: '',
    imagem_url: '',
    opcoes: [],
    escala_min: 1,
    escala_max: 5,
  }
}

// Editor completo: banner de abertura + lista de perguntas em ordem,
// tudo salvo em `configuracoes` (banner) e `pesquisas.perguntas` (perguntas).
export default function EditorPesquisa({ clienteId }) {
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState(null)
  const [salvo, setSalvo] = useState(false)

  const [configId, setConfigId] = useState(null)
  const [bannerUrl, setBannerUrl] = useState('')
  const [enviandoImagem, setEnviandoImagem] = useState(false)
  const [erroImagem, setErroImagem] = useState(null)
  const [textoBotao, setTextoBotao] = useState('Toque para avaliar')
  const [corPrimaria, setCorPrimaria] = useState('#e8a33d')
  const [textoBoasVindas, setTextoBoasVindas] = useState('Como foi sua experiência hoje?')

  const [pesquisaId, setPesquisaId] = useState(null)
  const [nomePesquisa, setNomePesquisa] = useState('Pesquisa padrão')
  const [perguntas, setPerguntas] = useState([novaPergunta()])

  useEffect(() => {
    carregar()
  }, [clienteId])

  async function carregar() {
    setCarregando(true)

    const { data: config } = await supabase
      .from('configuracoes')
      .select('*')
      .eq('cliente_id', clienteId)
      .is('unidade_id', null)
      .maybeSingle()

    if (config) {
      setConfigId(config.id)
      setBannerUrl(config.banner_url || '')
      setTextoBotao(config.texto_botao_iniciar || 'Toque para avaliar')
      setCorPrimaria(config.cor_primaria || '#e8a33d')
      setTextoBoasVindas(config.texto_boas_vindas || 'Como foi sua experiência hoje?')
    }

    const { data: pesquisa } = await supabase
      .from('pesquisas')
      .select('*')
      .eq('cliente_id', clienteId)
      .eq('ativa', true)
      .maybeSingle()

    if (pesquisa) {
      setPesquisaId(pesquisa.id)
      setNomePesquisa(pesquisa.nome)
      setPerguntas(pesquisa.perguntas?.length ? pesquisa.perguntas.map(normalizarPergunta) : [novaPergunta()])
    }

    setCarregando(false)
  }

  function atualizarPergunta(id, campo, valor) {
    setPerguntas((prev) => prev.map((p) => (p.id === id ? { ...p, [campo]: valor } : p)))
  }

  function atualizarOpcoesTexto(id, textoBruto) {
    const opcoes = textoBruto.split('\n')
    atualizarPergunta(id, 'opcoes', opcoes)
  }

  function removerPergunta(id) {
    setPerguntas((prev) => prev.filter((p) => p.id !== id))
  }

  function moverPergunta(indice, direcao) {
    setPerguntas((prev) => {
      const nova = [...prev]
      const alvo = indice + direcao
      if (alvo < 0 || alvo >= nova.length) return prev
      ;[nova[indice], nova[alvo]] = [nova[alvo], nova[indice]]
      return nova
    })
  }

  async function enviarImagemBanner(arquivo) {
    if (!arquivo) return
    setErroImagem(null)
    if (arquivo.size > 3 * 1024 * 1024) {
      setErroImagem('Imagem muito grande — envie um arquivo de até 3MB.')
      return
    }
    setEnviandoImagem(true)
    const extensao = arquivo.name.split('.').pop()
    const caminho = `${clienteId}/banner-${Date.now()}.${extensao}`
    const { error } = await supabase.storage.from('banners').upload(caminho, arquivo, { upsert: true })
    if (error) {
      setErroImagem('Não foi possível enviar a imagem.')
      setEnviandoImagem(false)
      return
    }
    const { data } = supabase.storage.from('banners').getPublicUrl(caminho)
    setBannerUrl(data.publicUrl)
    setEnviandoImagem(false)
  }

  async function enviarImagemPergunta(id, arquivo) {
    if (!arquivo) return
    if (arquivo.size > 3 * 1024 * 1024) {
      setErro('Imagem muito grande — envie um arquivo de até 3MB.')
      return
    }
    const extensao = arquivo.name.split('.').pop()
    const caminho = `${clienteId}/pergunta-${id}-${Date.now()}.${extensao}`
    const { error } = await supabase.storage.from('banners').upload(caminho, arquivo, { upsert: true })
    if (error) {
      setErro('Não foi possível enviar a imagem da pergunta.')
      return
    }
    const { data } = supabase.storage.from('banners').getPublicUrl(caminho)
    atualizarPergunta(id, 'imagem_url', data.publicUrl)
  }

  async function salvar() {
    setSalvando(true)
    setErro(null)
    setSalvo(false)

    const payloadConfig = {
      cliente_id: clienteId,
      unidade_id: null,
      banner_url: bannerUrl || null,
      texto_botao_iniciar: textoBotao,
      cor_primaria: corPrimaria,
      texto_boas_vindas: textoBoasVindas,
    }

    const resultConfig = configId
      ? await supabase.from('configuracoes').update(payloadConfig).eq('id', configId)
      : await supabase.from('configuracoes').insert(payloadConfig).select().single()

    if (resultConfig.error) {
      setErro('Não foi possível salvar a configuração visual.')
      setSalvando(false)
      return
    }
    if (!configId && resultConfig.data) setConfigId(resultConfig.data.id)

    const perguntasValidas = perguntas
      .filter((p) => p.texto.trim() !== '')
      .map((p) => ({ ...p, opcoes: (p.opcoes || []).map((o) => o.trim()).filter(Boolean) }))

    const payloadPesquisa = {
      cliente_id: clienteId,
      nome: nomePesquisa,
      perguntas: perguntasValidas,
      ativa: true,
    }

    const resultPesquisa = pesquisaId
      ? await supabase.from('pesquisas').update(payloadPesquisa).eq('id', pesquisaId)
      : await supabase.from('pesquisas').insert(payloadPesquisa).select().single()

    setSalvando(false)

    if (resultPesquisa.error) {
      setErro('Não foi possível salvar as perguntas.')
      return
    }
    if (!pesquisaId && resultPesquisa.data) setPesquisaId(resultPesquisa.data.id)

    setSalvo(true)
    setTimeout(() => setSalvo(false), 2500)
  }

  if (carregando) return <p className="empty-state">Carregando…</p>

  return (
    <div>
      {/* Banner de abertura */}
      <div style={{ marginBottom: 28 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Tela de abertura (banner)</h3>
        <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 14 }}>
          É a primeira coisa que aparece no totem. O visitante toca no banner (ou no botão) pra iniciar a pesquisa.
        </p>
        <div className="field">
          <label htmlFor="bannerArquivo">Enviar imagem do banner</label>
          <input id="bannerArquivo" type="file" accept="image/*" onChange={(e) => enviarImagemBanner(e.target.files?.[0])} disabled={enviandoImagem} />
          {enviandoImagem && <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 6 }}>Enviando…</div>}
          {erroImagem && <div className="error-text">{erroImagem}</div>}
        </div>
        <div className="field">
          <label htmlFor="bannerUrl">Ou cole a URL de uma imagem já hospedada</label>
          <input id="bannerUrl" value={bannerUrl} onChange={(e) => setBannerUrl(e.target.value)} placeholder="https://…" />
        </div>
        <div className="field">
          <label htmlFor="textoBotao">Texto do botão</label>
          <input id="textoBotao" value={textoBotao} onChange={(e) => setTextoBotao(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <div className="field" style={{ flex: 1 }}>
            <label htmlFor="corPrimaria">Cor principal</label>
            <input id="corPrimaria" type="color" value={corPrimaria} onChange={(e) => setCorPrimaria(e.target.value)} style={{ height: 40, padding: 4 }} />
          </div>
          <div className="field" style={{ flex: 2 }}>
            <label htmlFor="boasVindas">Frase da tela de nota (padrão)</label>
            <input id="boasVindas" value={textoBoasVindas} onChange={(e) => setTextoBoasVindas(e.target.value)} />
          </div>
        </div>
        {bannerUrl && (
          <div style={{ marginTop: 8 }}>
            <img src={bannerUrl} alt="Pré-visualização do banner" style={{ maxWidth: '100%', maxHeight: 140, borderRadius: 8, border: '1px solid var(--line)' }} />
          </div>
        )}
      </div>

      {/* Perguntas */}
      <div>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Perguntas da pesquisa</h3>
        <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 14 }}>
          Cada pergunta aparece em uma tela, na ordem abaixo. Escolha o formato de cada uma.
        </p>

        <div className="field">
          <label htmlFor="nomePesquisa">Nome da pesquisa (interno, só pra organização)</label>
          <input id="nomePesquisa" value={nomePesquisa} onChange={(e) => setNomePesquisa(e.target.value)} />
        </div>

        {perguntas.map((p, indice) => {
          const info = infoTipo(p.tipo)
          return (
            <div key={p.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 14, borderBottom: '1px solid var(--line)', paddingBottom: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, paddingTop: 8 }}>
                <button className="btn-ghost" style={{ padding: '2px 8px' }} onClick={() => moverPergunta(indice, -1)} disabled={indice === 0} type="button">↑</button>
                <button className="btn-ghost" style={{ padding: '2px 8px' }} onClick={() => moverPergunta(indice, 1)} disabled={indice === perguntas.length - 1} type="button">↓</button>
              </div>

              <div style={{ flex: 1 }}>
                <input
                  value={p.texto}
                  onChange={(e) => atualizarPergunta(p.id, 'texto', e.target.value)}
                  placeholder={
                    info.tag === 'Mensagem'
                      ? `Texto da tela ${indice + 1}, ex: "Obrigado pela visita!"`
                      : `Pergunta ${indice + 1}, ex: "Como foi o atendimento?"`
                  }
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--line)', borderRadius: 7, fontSize: 14, marginBottom: 8 }}
                />

                <select
                  value={p.tipo}
                  onChange={(e) => atualizarPergunta(p.id, 'tipo', e.target.value)}
                  style={{ padding: '8px 10px', border: '1px solid var(--line)', borderRadius: 7, fontSize: 13, marginBottom: 8 }}
                >
                  {TIPOS.map((t) => (
                    <option key={t.valor} value={t.valor}>{t.label}</option>
                  ))}
                </select>

                {info.temImagem && (
                  <div style={{ marginTop: 6 }}>
                    <input type="file" accept="image/*" onChange={(e) => enviarImagemPergunta(p.id, e.target.files?.[0])} style={{ fontSize: 13 }} />
                    {p.imagem_url && (
                      <img src={p.imagem_url} alt="" style={{ display: 'block', marginTop: 8, maxHeight: 100, borderRadius: 6, border: '1px solid var(--line)' }} />
                    )}
                  </div>
                )}

                {info.temOpcoes && (
                  <div style={{ marginTop: 6 }}>
                    <label style={{ fontSize: 12, color: 'var(--ink-soft)', display: 'block', marginBottom: 4 }}>
                      Uma opção por linha
                    </label>
                    <textarea
                      value={(p.opcoes || []).join('\n')}
                      onChange={(e) => atualizarOpcoesTexto(p.id, e.target.value)}
                      rows={3}
                      placeholder={'Ótimo\nBom\nRegular\nRuim'}
                      style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--line)', borderRadius: 7, fontSize: 13, fontFamily: 'inherit', resize: 'vertical' }}
                    />
                  </div>
                )}

                {info.temEscala && (
                  <div style={{ display: 'flex', gap: 12, marginTop: 6, alignItems: 'center' }}>
                    <label style={{ fontSize: 12, color: 'var(--ink-soft)' }}>De</label>
                    <input
                      type="number"
                      value={p.escala_min}
                      onChange={(e) => atualizarPergunta(p.id, 'escala_min', Number(e.target.value))}
                      style={{ width: 60, padding: '6px 8px', border: '1px solid var(--line)', borderRadius: 7, fontSize: 13 }}
                    />
                    <label style={{ fontSize: 12, color: 'var(--ink-soft)' }}>até</label>
                    <input
                      type="number"
                      value={p.escala_max}
                      onChange={(e) => atualizarPergunta(p.id, 'escala_max', Number(e.target.value))}
                      style={{ width: 60, padding: '6px 8px', border: '1px solid var(--line)', borderRadius: 7, fontSize: 13 }}
                    />
                  </div>
                )}
              </div>

              <button className="btn-ghost" onClick={() => removerPergunta(p.id)} type="button" style={{ marginTop: 8 }}>
                Remover
              </button>
            </div>
          )
        })}

        <button className="btn-ghost" type="button" onClick={() => setPerguntas((prev) => [...prev, novaPergunta()])}>
          + Adicionar pergunta
        </button>
      </div>

      {erro && <div className="error-text">{erro}</div>}
      {salvo && <div style={{ color: 'var(--teal)', fontSize: 13, marginTop: 12 }}>Salvo com sucesso.</div>}

      <button className="btn btn-primary" onClick={salvar} disabled={salvando} style={{ marginTop: 20 }}>
        {salvando ? 'Salvando…' : 'Salvar pesquisa'}
      </button>
    </div>
  )
}

// garante que perguntas antigas (salvas antes dessa versão) tenham todos os campos
function normalizarPergunta(p) {
  return {
    id: p.id,
    tipo: p.tipo === 'texto' ? 'comentario' : p.tipo, // compatibilidade com o tipo antigo
    texto: p.texto || '',
    imagem_url: p.imagem_url || '',
    opcoes: p.opcoes || [],
    escala_min: p.escala_min ?? 1,
    escala_max: p.escala_max ?? 5,
  }
}
