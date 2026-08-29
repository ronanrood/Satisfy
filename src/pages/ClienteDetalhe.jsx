import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import Layout from '../components/Layout'
import EditorPesquisa from '../components/EditorPesquisa'
import MetricasCliente from '../components/MetricasCliente'

export default function ClienteDetalhe() {
  const { id } = useParams()
  const [cliente, setCliente] = useState(null)
  const [unidades, setUnidades] = useState([])
  const [totens, setTotens] = useState([])
  const [mostrarFormUnidade, setMostrarFormUnidade] = useState(false)
  const [mostrarFormTotem, setMostrarFormTotem] = useState(false)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    buscarTudo()
  }, [id])

  async function buscarTudo() {
    setCarregando(true)
    const [{ data: c }, { data: u }] = await Promise.all([
      supabase.from('clientes').select('*').eq('id', id).single(),
      supabase.from('unidades').select('*').eq('cliente_id', id).order('created_at'),
    ])
    setCliente(c)
    setUnidades(u || [])

    if (u && u.length > 0) {
      const { data: t } = await supabase
        .from('totens')
        .select('*, unidades(nome)')
        .in('unidade_id', u.map((un) => un.id))
        .order('created_at')
      setTotens(t || [])
    } else {
      setTotens([])
    }
    setCarregando(false)
  }

  if (carregando) {
    return (
      <Layout>
        <p className="empty-state">Carregando…</p>
      </Layout>
    )
  }

  if (!cliente) {
    return (
      <Layout>
        <p className="empty-state">Cliente não encontrado.</p>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="page-header">
        <Link to="/" style={{ fontSize: 13, color: 'var(--ink-soft)' }}>← Clientes</Link>
        <div className="page-eyebrow" style={{ marginTop: 10 }}>{cliente.plano}</div>
        <h1 className="page-title">{cliente.nome}</h1>
      </div>

      {/* Métricas */}
      <div className="card">
        <h2 className="card-title">Métricas</h2>
        <MetricasCliente clienteId={id} />
      </div>

      {/* Pesquisa e banner */}
      <div className="card">
        <h2 className="card-title">Pesquisa e banner de abertura</h2>
        <EditorPesquisa clienteId={id} />
      </div>

      {/* Unidades */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="card-title" style={{ marginBottom: 0 }}>Unidades ({unidades.length})</h2>
          <button className="btn btn-primary" onClick={() => setMostrarFormUnidade(!mostrarFormUnidade)}>
            {mostrarFormUnidade ? 'Cancelar' : '+ Nova unidade'}
          </button>
        </div>

        {mostrarFormUnidade && (
          <NovaUnidadeForm
            clienteId={id}
            onCriado={() => {
              setMostrarFormUnidade(false)
              buscarTudo()
            }}
          />
        )}

        {unidades.length > 0 && (
          <table style={{ marginTop: 20 }}>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Endereço</th>
              </tr>
            </thead>
            <tbody>
              {unidades.map((u) => (
                <tr key={u.id}>
                  <td>{u.nome}</td>
                  <td>{u.endereco || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Totens */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="card-title" style={{ marginBottom: 0 }}>Totens ({totens.length})</h2>
          <button
            className="btn btn-primary"
            disabled={unidades.length === 0}
            onClick={() => setMostrarFormTotem(!mostrarFormTotem)}
            title={unidades.length === 0 ? 'Cadastre uma unidade primeiro' : ''}
          >
            {mostrarFormTotem ? 'Cancelar' : '+ Novo totem'}
          </button>
        </div>

        {unidades.length === 0 && (
          <p className="empty-state">Cadastre uma unidade antes de adicionar um totem.</p>
        )}

        {mostrarFormTotem && (
          <NovoTotemForm
            unidades={unidades}
            onCriado={() => {
              setMostrarFormTotem(false)
              buscarTudo()
            }}
          />
        )}

        {totens.length > 0 && (
          <table style={{ marginTop: 20 }}>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Unidade</th>
                <th>Token (URL do totem)</th>
              </tr>
            </thead>
            <tbody>
              {totens.map((t) => (
                <tr key={t.id}>
                  <td>{t.nome || '—'}</td>
                  <td>{t.unidades?.nome}</td>
                  <td><code>/totem/{t.token}</code></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  )
}

function NovaUnidadeForm({ clienteId, onCriado }) {
  const [nome, setNome] = useState('')
  const [endereco, setEndereco] = useState('')
  const [erro, setErro] = useState(null)
  const [enviando, setEnviando] = useState(false)

  async function salvar(e) {
    e.preventDefault()
    setEnviando(true)
    setErro(null)
    const { error } = await supabase.from('unidades').insert({ cliente_id: clienteId, nome, endereco })
    setEnviando(false)
    if (error) setErro('Não foi possível criar a unidade.')
    else onCriado()
  }

  return (
    <form onSubmit={salvar} style={{ marginTop: 20, borderTop: '1px solid var(--line)', paddingTop: 20 }}>
      <div className="field">
        <label htmlFor="nomeUnidade">Nome da unidade</label>
        <input id="nomeUnidade" value={nome} onChange={(e) => setNome(e.target.value)} required autoFocus />
      </div>
      <div className="field">
        <label htmlFor="endereco">Endereço (opcional)</label>
        <input id="endereco" value={endereco} onChange={(e) => setEndereco(e.target.value)} />
      </div>
      {erro && <div className="error-text">{erro}</div>}
      <button className="btn btn-primary" type="submit" disabled={enviando}>
        {enviando ? 'Salvando…' : 'Salvar unidade'}
      </button>
    </form>
  )
}

function NovoTotemForm({ unidades, onCriado }) {
  const [nome, setNome] = useState('')
  const [unidadeId, setUnidadeId] = useState(unidades[0]?.id || '')
  const [erro, setErro] = useState(null)
  const [enviando, setEnviando] = useState(false)

  async function salvar(e) {
    e.preventDefault()
    setEnviando(true)
    setErro(null)
    const { error } = await supabase.from('totens').insert({ unidade_id: unidadeId, nome })
    setEnviando(false)
    if (error) setErro('Não foi possível criar o totem.')
    else onCriado()
  }

  return (
    <form onSubmit={salvar} style={{ marginTop: 20, borderTop: '1px solid var(--line)', paddingTop: 20 }}>
      <div className="field">
        <label htmlFor="nomeTotem">Nome do totem</label>
        <input
          id="nomeTotem"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Ex: Totem Entrada"
          required
          autoFocus
        />
      </div>
      <div className="field">
        <label htmlFor="unidade">Unidade</label>
        <select id="unidade" value={unidadeId} onChange={(e) => setUnidadeId(e.target.value)}>
          {unidades.map((u) => (
            <option key={u.id} value={u.id}>{u.nome}</option>
          ))}
        </select>
      </div>
      {erro && <div className="error-text">{erro}</div>}
      <button className="btn btn-primary" type="submit" disabled={enviando}>
        {enviando ? 'Gerando…' : 'Gerar totem'}
      </button>
    </form>
  )
}
