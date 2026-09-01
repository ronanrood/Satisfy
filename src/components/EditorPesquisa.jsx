import { useEffect, useState, useRef } from 'react'
import { supabase } from '../supabaseClient'
import { 
  FiPlus, 
  FiTrash2, 
  FiArrowUp, 
  FiArrowDown, 
  FiImage, 
  FiType, 
  FiCheck, 
  FiStar, 
  FiSmile, 
  FiSliders, 
  FiList, 
  FiSmartphone,
  FiUploadCloud,
  FiRefreshCw
} from 'react-icons/fi'

const TIPOS_PERGUNTA = [
  { id: 'nps', label: 'NPS (0 a 10)', icon: <FiSliders /> },
  { id: 'estrelas', label: 'Estrelas (1 a 5)', icon: <FiStar /> },
  { id: 'carinhas', label: 'Carinhas / Emojis', icon: <FiSmile /> },
  { id: 'nota', label: 'Comentário (Texto)', icon: <FiType /> },
  { id: 'escolha_unica', label: 'Múltipla Escolha', icon: <FiList /> },
]

export default function EditorPesquisa({ clienteId }) {
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [enviandoImagem, setEnviandoImagem] = useState(false)
  const [bannerUrl, setBannerUrl] = useState('')
  const [textoBotao, setTextoBotao] = useState('Toque para avaliar')
  const [fraseAbertura, setFraseAbertura] = useState('Como foi sua experiência hoje?')
  const [corPrimaria, setCorPrimaria] = useState('#e8a33d')
  const [nomePesquisa, setNomePesquisa] = useState('Pesquisa de Satisfação')
  const [perguntas, setPerguntas] = useState([])
  const [etapaPreview, setEtapaPreview] = useState(0)
  
  const fileInputRef = useRef(null)

  useEffect(() => {
    buscarDados()
  }, [clienteId])

  async function buscarDados() {
    setCarregando(true)
    const { data } = await supabase
      .from('pesquisas')
      .select('*')
      .eq('cliente_id', clienteId)
      .eq('ativa', true)
      .maybeSingle()

    if (data) {
      setNomePesquisa(data.nome || 'Pesquisa de Satisfação')
      setBannerUrl(data.banner_url || '')
      setTextoBotao(data.texto_botao || 'Toque para avaliar')
      setFraseAbertura(data.frase_abertura || 'Como foi sua experiência hoje?')
      setCorPrimaria(data.cor_primaria || '#e8a33d')
      setPerguntas(data.perguntas || [])
    }
    setCarregando(false)
  }

  // Upload direto para o bucket do Supabase Storage
  async function handleUploadBanner(e) {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setEnviandoImagem(true)
      const fileExt = file.name.split('.').pop()
      const fileName = `${clienteId}-${Date.now()}.${fileExt}`
      const filePath = `banners/${fileName}`

      // Envia para o bucket 'banners' (crie o bucket público no Supabase caso ainda não exista)
      const { error: uploadError } = await supabase.storage
        .from('banners')
        .upload(filePath, file, { upsert: true })

      if (uploadError) {
        throw uploadError
      }

      // Obtém a URL pública gerada
      const { data } = supabase.storage.from('banners').getPublicUrl(filePath)
      setBannerUrl(data.publicUrl)
    } catch (err) {
      alert('Erro ao enviar imagem. Verifique se o bucket "banners" está criado no Supabase ou use o campo de URL abaixo.')
      console.error(err)
    } finally {
      setEnviandoImagem(false)
    }
  }

  const adicionarPergunta = () => {
    const nova = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      texto: 'Qual é seu grau de satisfação?',
      tipo: 'nps',
      opcoes: ['Ótimo', 'Regular', 'Ruim'],
    }
    setPerguntas([...perguntas, nova])
  }

  const removerPergunta = (index) => {
    setPerguntas(perguntas.filter((_, i) => i !== index))
  }

  const moverPergunta = (index, direcao) => {
    const novoIndex = index + direcao
    if (novoIndex < 0 || novoIndex >= perguntas.length) return
    const lista = [...perguntas]
    const item = lista.splice(index, 1)[0]
    lista.splice(novoIndex, 0, item)
    setPerguntas(lista)
  }

  const atualizarPergunta = (index, campo, valor) => {
    const lista = [...perguntas]
    lista[index] = { ...lista[index], [campo]: valor }
    setPerguntas(lista)
  }

  async function salvarPesquisa(e) {
    e?.preventDefault()
    setSalvando(true)

    const payload = {
      cliente_id: clienteId,
      nome: nomePesquisa,
      banner_url: bannerUrl,
      texto_botao: textoBotao,
      frase_abertura: fraseAbertura,
      cor_primaria: corPrimaria,
      perguntas,
      ativa: true,
    }

    const { data: existente } = await supabase
      .from('pesquisas')
      .select('id')
      .eq('cliente_id', clienteId)
      .eq('ativa', true)
      .maybeSingle()

    if (existente?.id) {
      await supabase.from('pesquisas').update(payload).eq('id', existente.id)
    } else {
      await supabase.from('pesquisas').insert(payload)
    }

    setSalvando(false)
    alert('Pesquisa e banners salvos com sucesso!')
  }

  if (carregando) {
    return <div className="empty-state"><p>Carregando editor...</p></div>
  }

  return (
    <div className="survey-editor-layout">
      {/* Coluna 1: Formulário e Configurações */}
      <div className="editor-controls-col">
        {/* Seção Identidade & Banner */}
        <div className="editor-section-card">
          <div className="section-card-header">
            <h3 className="section-card-title">
              <FiImage style={{ marginRight: 8 }} /> Identidade & Tela Inicial
            </h3>
          </div>

          <div className="form-grid" style={{ gridTemplateColumns: '1fr', gap: 14 }}>
            <div className="form-field">
              <label>Nome Interno da Pesquisa</label>
              <input
                className="text-input"
                value={nomePesquisa}
                onChange={(e) => setNomePesquisa(e.target.value)}
                placeholder="Ex: Pesquisa de Satisfação Geral"
              />
            </div>

            {/* Upload de Imagem com Dropzone */}
            <div className="form-field">
              <label>Imagem do Banner</label>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleUploadBanner} 
                accept="image/*" 
                style={{ display: 'none' }} 
              />
              
              <div 
                className="banner-upload-dropzone" 
                onClick={() => fileInputRef.current?.click()}
              >
                {enviandoImagem ? (
                  <div className="upload-loading">
                    <FiRefreshCw className="spin-icon" />
                    <span>Fazendo upload da imagem...</span>
                  </div>
                ) : (
                  <div className="upload-content">
                    <FiUploadCloud className="upload-icon" />
                    <div className="upload-text-group">
                      <strong>Clique para escolher uma imagem</strong>
                      <span>PNG, JPG ou WEBP recomendados (resolução padrão de totem)</span>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ marginTop: 10 }}>
                <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>
                  Ou informe a URL direta da imagem:
                </span>
                <input
                  className="text-input"
                  value={bannerUrl}
                  onChange={(e) => setBannerUrl(e.target.value)}
                  placeholder="https://exemplo.com/banner.png"
                />
              </div>
            </div>
          </div>

          <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', marginTop: 14 }}>
            <div className="form-field">
              <label>Texto do Botão Iniciar</label>
              <input
                className="text-input"
                value={textoBotao}
                onChange={(e) => setTextoBotao(e.target.value)}
              />
            </div>

            <div className="form-field">
              <label>Cor Principal de Destaque</label>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <input
                  type="color"
                  value={corPrimaria}
                  onChange={(e) => setCorPrimaria(e.target.value)}
                  style={{
                    width: 44,
                    height: 40,
                    padding: 0,
                    border: '1px solid #e2e8f0',
                    borderRadius: 8,
                    cursor: 'pointer'
                  }}
                />
                <input
                  className="text-input"
                  value={corPrimaria}
                  onChange={(e) => setCorPrimaria(e.target.value)}
                  style={{ flex: 1 }}
                />
              </div>
            </div>
          </div>

          <div className="form-field" style={{ marginTop: 14 }}>
            <label>Frase da Tela Inicial (abaixo do banner)</label>
            <input
              className="text-input"
              value={fraseAbertura}
              onChange={(e) => setFraseAbertura(e.target.value)}
            />
          </div>
        </div>

        {/* Seção Construtor de Perguntas */}
        <div className="editor-section-card">
          <div className="section-card-header">
            <h3 className="section-card-title">
              <FiType style={{ marginRight: 8 }} /> Perguntas ({perguntas.length})
            </h3>
            <button className="btn-action-primary" type="button" onClick={adicionarPergunta}>
              <FiPlus /> Adicionar Pergunta
            </button>
          </div>

          {perguntas.length === 0 ? (
            <div className="empty-state">
              <p>Nenhuma pergunta adicionada. Clique no botão acima para criar a primeira.</p>
            </div>
          ) : (
            <div className="questions-editor-list">
              {perguntas.map((p, idx) => (
                <div key={p.id || idx} className="question-item-card">
                  <div className="question-card-topbar">
                    <div className="question-order-badges">
                      <span className="question-index-tag">#{idx + 1}</span>
                      <button
                        className="order-btn"
                        type="button"
                        disabled={idx === 0}
                        onClick={() => moverPergunta(idx, -1)}
                      >
                        <FiArrowUp />
                      </button>
                      <button
                        className="order-btn"
                        type="button"
                        disabled={idx === perguntas.length - 1}
                        onClick={() => moverPergunta(idx, 1)}
                      >
                        <FiArrowDown />
                      </button>
                    </div>

                    <button
                      className="action-btn delete"
                      type="button"
                      title="Excluir pergunta"
                      onClick={() => removerPergunta(idx)}
                    >
                      <FiTrash2 />
                    </button>
                  </div>

                  <div className="form-field" style={{ marginBottom: 12 }}>
                    <input
                      className="text-input"
                      value={p.texto}
                      placeholder="Digite o enunciado da pergunta..."
                      onChange={(e) => atualizarPergunta(idx, 'texto', e.target.value)}
                    />
                  </div>

                  <div className="form-field">
                    <label style={{ fontSize: 11, marginBottom: 6, color: '#64748b' }}>Tipo de Resposta</label>
                    <div className="type-selector-pill-row">
                      {TIPOS_PERGUNTA.map((tp) => (
                        <button
                          key={tp.id}
                          type="button"
                          className={`type-pill-btn ${p.tipo === tp.id ? 'active' : ''}`}
                          onClick={() => atualizarPergunta(idx, 'tipo', tp.id)}
                        >
                          {tp.icon}
                          <span>{tp.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {p.tipo === 'escolha_unica' && (
                    <div className="form-field" style={{ marginTop: 12 }}>
                      <label style={{ fontSize: 11, color: '#64748b' }}>Opções (uma por linha)</label>
                      <textarea
                        className="text-input"
                        rows={3}
                        value={Array.isArray(p.opcoes) ? p.opcoes.join('\n') : (p.opcoes || '')}
                        onChange={(e) =>
                          atualizarPergunta(
                            idx,
                            'opcoes',
                            e.target.value.split('\n').filter((l) => l.trim().length > 0)
                          )
                        }
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Botão de Ação Salvar */}
        <div style={{ marginTop: 10 }}>
          <button
            className="btn-action-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: 14 }}
            onClick={salvarPesquisa}
            disabled={salvando}
          >
            <FiCheck /> {salvando ? 'Salvando alterações...' : 'Salvar Todas as Configurações'}
          </button>
        </div>
      </div>

      {/* Coluna 2: Live Preview */}
      <div className="live-preview-sticky">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center', gap: 6 }}>
            <FiSmartphone /> Live Preview
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              className={`preview-tab-pill ${etapaPreview === 0 ? 'active' : ''}`}
              onClick={() => setEtapaPreview(0)}
            >
              Capa
            </button>
            {perguntas.map((_, i) => (
              <button
                key={i}
                className={`preview-tab-pill ${etapaPreview === i + 1 ? 'active' : ''}`}
                onClick={() => setEtapaPreview(i + 1)}
              >
                P{i + 1}
              </button>
            ))}
          </div>
        </div>

        <div className="tablet-frame">
          <div className="tablet-screen">
            {etapaPreview === 0 ? (
              <>
                {bannerUrl ? (
                  <img src={bannerUrl} alt="Banner Preview" className="preview-banner-img" />
                ) : (
                  <div className="preview-banner-placeholder">
                    <FiImage style={{ fontSize: 32, color: '#94a3b8', marginBottom: 6 }} />
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>Banner da Pesquisa</span>
                  </div>
                )}
                <h4 style={{ margin: '14px 0 20px 0', fontSize: 14, color: '#1e293b' }}>
                  {fraseAbertura}
                </h4>
                <button
                  className="preview-start-btn"
                  style={{ backgroundColor: corPrimaria }}
                  onClick={() => perguntas.length > 0 && setEtapaPreview(1)}
                >
                  {textoBotao}
                </button>
              </>
            ) : (
              <div className="preview-question-content" style={{ width: '100%' }}>
                <span className="preview-tag">Pergunta {etapaPreview} de {perguntas.length}</span>
                <h4 style={{ margin: '12px 0 20px 0', fontSize: 14, color: '#0f172a' }}>
                  {perguntas[etapaPreview - 1]?.texto}
                </h4>

                {perguntas[etapaPreview - 1]?.tipo === 'nps' && (
                  <div className="preview-nps-row">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                      <span key={n} className="nps-ball">{n}</span>
                    ))}
                  </div>
                )}

                {perguntas[etapaPreview - 1]?.tipo === 'estrelas' && (
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'center', fontSize: 24, color: '#eab308' }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <FiStar key={s} />
                    ))}
                  </div>
                )}

                {perguntas[etapaPreview - 1]?.tipo === 'carinhas' && (
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'center', fontSize: 26 }}>
                    <span>😡</span>
                    <span>🙁</span>
                    <span>😐</span>
                    <span>🙂</span>
                    <span>😍</span>
                  </div>
                )}

                {perguntas[etapaPreview - 1]?.tipo === 'nota' && (
                  <textarea
                    placeholder="Digite sua resposta..."
                    disabled
                    style={{ width: '100%', height: 60, borderRadius: 8, border: '1px solid #e2e8f0', padding: 8, fontSize: 11 }}
                  />
                )}

                {perguntas[etapaPreview - 1]?.tipo === 'escolha_unica' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
                    {(perguntas[etapaPreview - 1]?.opcoes || []).map((op, i) => (
                      <div key={i} className="preview-option-chip">
                        {op}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}