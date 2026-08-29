import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import Layout from '../components/Layout'
import EditorPesquisa from '../components/EditorPesquisa'
import MetricasCliente from '../components/MetricasCliente'

export default function ClienteDetalhe() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [cliente, setCliente] = useState(null)
  const [unidades, setUnidades] = useState([])
  const [totens, setTotens] = useState([])
  const [mostrarFormUnidade, setMostrarFormUnidade] = useState(false)
  const [mostrarFormTotem, setMostrarFormTotem] = useState(false)
  const [editandoCliente, setEditandoCliente] = useState(false)
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

  async function excluirCliente() {
    const confirmado = window.confirm(
      `Excluir "${cliente.nome}"? Isso apaga TODAS as unidades, totens, pesquisas e respostas desse cliente. Não pode ser desfeito.`
    )
    if (!confirmado) return
    await supabase.from('clientes').delete().eq('id', cliente.id)
    navigate('/')
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

        {editandoCliente ? (
          <EdicaoCliente
            cliente={cliente}
            onCancelar={() => setEditandoCliente(false)}
            onSalvo={() => {
              setEditandoCliente(false)
              buscarTudo()
            }}
          />
        ) : (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 10 }}>
            <div>
              <div className="page-eyebrow">{cliente.plano} · <span className={`pill ${cliente.status}`}>{cliente.status}</span></div>
              <h1 className="page-title">{cliente.nome}</h1>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-ghost" onClick={() => setEditandoCliente(true)}>Editar cliente</button>
              <button className="btn-ghost" style={{ color: 'var(--red)' }} onClick={excluirCliente}>Excluir cliente</button>
            </div>
          </div>
        )}
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
                <th style={{ width: 160 }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {unidades.map((u) => (
                <LinhaUnidade key={u.id} unidade={u} onMudou={buscarTudo} />
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
                <th>Ativo</th>
                <th style={{ width: 160 }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {totens.map((t) => (
                <LinhaTotem key={t.id} totem={t} unidades={unidades} onMudou={buscarTudo} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  )
}

function EdicaoCliente({ cliente, onCancelar, onSalvo }) {
  const [nome, setNome] = useState(cliente.nome)
  const [plano, setPlano] = useState(cliente.plano)
  const [status, setStatus] = useState(cliente.status)
  const [salvando, setSalvando] = useState(false)

  async function salvar() {
    setSalvando(true)
    await supabase.from('clientes').update({ nome, plano, status }).eq('id', cliente.id)
    setSalvando(false)
    onSalvo()
  }

  return (
    <div className="card" style={{ marginTop: 14, marginBottom: 0 }}>
      <div className="field">
        <label htmlFor="editNome">Nome do cliente</label>
        <input id="editNome" value={nome} onChange={(e) => setNome(e.target.value)} autoFocus />
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
        <div className="field" style={{ flex: 1 }}>
          <label htmlFor="editPlano">Plano</label>
          <select id="editPlano" value={plano} onChange={(e) => setPlano(e.target.value)}>
            <option value="trial">Trial</option>
            <option value="basico">Básico</option>
            <option value="pro">Pro</option>
          </select>
        </div>
        <div className="field" style={{ flex: 1 }}>
          <label htmlFor="editStatus">Status</label>
          <select id="editStatus" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="ativo">Ativo</option>
            <option value="suspenso">Suspenso</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-primary" onClick={salvar} disabled={salvando}>{salvando ? 'Salvando…' : 'Salvar'}</button>
        <button className="btn-ghost" onClick={onCancelar}>Cancelar</button>
      </div>
    </div>
  )
}

function LinhaUnidade({ unidade, onMudou }) {
  const [editando, setEditando] = useState(false)
  const [nome, setNome] = useState(unidade.nome)
  const [endereco, setEndereco] = useState(unidade.endereco || '')
  const [salvando, setSalvando] = useState(false)

  async function salvar() {
    setSalvando(true)
    await supabase.from('unidades').update({ nome, endereco }).eq('id', unidade.id)
    setSalvando(false)
    setEditando(false)
    onMudou()
  }

  async function excluir() {
    const confirmado = window.confirm(`Excluir a unidade "${unidade.nome}"? Isso apaga os totens e respostas dela também.`)
    if (!confirmado) return
    await supabase.from('unidades').delete().eq('id', unidade.id)
    onMudou()
  }

  if (editando) {
    return (
      <tr>
        <td><input value={nome} onChange={(e) => setNome(e.target.value)} style={estilos.inputInline} autoFocus /></td>
        <td><input value={endereco} onChange={(e) => setEndereco(e.target.value)} style={estilos.inputInline} /></td>
        <td style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" style={estilos.btnPequeno} onClick={salvar} disabled={salvando}>{salvando ? 'Salvando…' : 'Salvar'}</button>
          <button className="btn-ghost" style={estilos.btnPequeno} onClick={() => setEditando(false)}>Cancelar</button>
        </td>
      </tr>
    )
  }

  return (
    <tr>
      <td>{unidade.nome}</td>
      <td>{unidade.endereco || '—'}</td>
      <td style={{ display: 'flex', gap: 8 }}>
        <button className="btn-ghost" style={estilos.btnPequeno} onClick={() => setEditando(true)}>Editar</button>
        <button className="btn-ghost" style={{ ...estilos.btnPequeno, color: 'var(--red)' }} onClick={excluir}>Excluir</button>
      </td>
    </tr>
  )
}

function LinhaTotem({ totem, unidades, onMudou }) {
  const [editando, setEditando] = useState(false)
  const [nome, setNome] = useState(totem.nome || '')
  const [unidadeId, setUnidadeId] = useState(totem.unidade_id)
  const [ativo, setAtivo] = useState(totem.ativo)
  const [salvando, setSalvando] = useState(false)

  async function salvar() {
    setSalvando(true)
    await supabase.from('totens').update({ nome, unidade_id: unidadeId, ativo }).eq('id', totem.id)
    setSalvando(false)
    setEditando(false)
    onMudou()
  }

  async function excluir() {
    const confirmado = window.confirm(`Excluir o totem "${totem.nome || 'sem nome'}"? O link /totem/${totem.token} para de funcionar.`)
    if (!confirmado) return
    await supabase.from('totens').delete().eq('id', totem.id)
    onMudou()
  }

  if (editando) {
    return (
      <tr>
        <td><input value={nome} onChange={(e) => setNome(e.target.value)} style={estilos.inputInline} autoFocus /></td>
        <td>
          <select value={unidadeId} onChange={(e) => setUnidadeId(e.target.value)} style={estilos.inputInline}>
            {unidades.map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
          </select>
        </td>
        <td><code>/totem/{totem.token}</code></td>
        <td>
          <input type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} />
        </td>
        <td style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" style={estilos.btnPequeno} onClick={salvar} disabled={salvando}>{salvando ? 'Salvando…' : 'Salvar'}</button>
          <button className="btn-ghost" style={estilos.btnPequeno} onClick={() => setEditando(false)}>Cancelar</button>
        </td>
      </tr>
    )
  }

  return (
    <tr>
      <td>{totem.nome || '—'}</td>
      <td>{totem.unidades?.nome}</td>
      <td><code>/totem/{totem.token}</code></td>
      <td>{totem.ativo ? <span className="pill ativo">ativo</span> : <span className="pill cancelado">inativo</span>}</td>
      <td style={{ display: 'flex', gap: 8 }}>
        <button className="btn-ghost" style={estilos.btnPequeno} onClick={() => setEditando(true)}>Editar</button>
        <button className="btn-ghost" style={{ ...estilos.btnPequeno, color: 'var(--red)' }} onClick={excluir}>Excluir</button>
      </td>
    </tr>
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

const estilos = {
  inputInline: { width: '100%', padding: '6px 8px', border: '1px solid var(--line)', borderRadius: 6, fontSize: 13 },
  btnPequeno: { padding: '6px 12px', fontSize: 13 },
}
