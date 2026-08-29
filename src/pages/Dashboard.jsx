import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import Layout from '../components/Layout'

export default function Dashboard() {
  const [clientes, setClientes] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    buscarClientes()
  }, [])

  async function buscarClientes() {
    setCarregando(true)
    const { data } = await supabase.from('clientes').select('*').order('created_at', { ascending: false })
    setClientes(data || [])
    setCarregando(false)
  }

  return (
    <Layout>
      <div className="page-header">
        <div className="page-eyebrow">Painel Mestre</div>
        <h1 className="page-title">Clientes</h1>
        <p className="page-subtitle">Empresas com licença ativa do Satisfy.</p>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="card-title" style={{ marginBottom: 0 }}>
            {clientes.length} cliente{clientes.length !== 1 ? 's' : ''}
          </h2>
          <button className="btn btn-primary" onClick={() => setMostrarForm(!mostrarForm)}>
            {mostrarForm ? 'Cancelar' : '+ Novo cliente'}
          </button>
        </div>

        {mostrarForm && (
          <NovoClienteForm
            onCriado={() => {
              setMostrarForm(false)
              buscarClientes()
            }}
          />
        )}
      </div>

      <div className="card">
        {carregando ? (
          <p className="empty-state">Carregando…</p>
        ) : clientes.length === 0 ? (
          <p className="empty-state">Nenhum cliente cadastrado ainda. Clique em "Novo cliente" para começar.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Plano</th>
                <th>Status</th>
                <th style={{ width: 160 }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((c) => (
                <LinhaCliente key={c.id} cliente={c} onMudou={buscarClientes} onAbrir={() => navigate(`/clientes/${c.id}`)} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  )
}

function LinhaCliente({ cliente, onMudou, onAbrir }) {
  const [editando, setEditando] = useState(false)
  const [nome, setNome] = useState(cliente.nome)
  const [plano, setPlano] = useState(cliente.plano)
  const [status, setStatus] = useState(cliente.status)
  const [salvando, setSalvando] = useState(false)
  const [excluindo, setExcluindo] = useState(false)

  async function salvar() {
    setSalvando(true)
    await supabase.from('clientes').update({ nome, plano, status }).eq('id', cliente.id)
    setSalvando(false)
    setEditando(false)
    onMudou()
  }

  async function excluir() {
    const confirmado = window.confirm(
      `Excluir "${cliente.nome}"? Isso apaga TODAS as unidades, totens, pesquisas e respostas desse cliente. Não pode ser desfeito.`
    )
    if (!confirmado) return
    setExcluindo(true)
    await supabase.from('clientes').delete().eq('id', cliente.id)
    onMudou()
  }

  if (editando) {
    return (
      <tr>
        <td><input value={nome} onChange={(e) => setNome(e.target.value)} style={estilos.inputInline} autoFocus /></td>
        <td>
          <select value={plano} onChange={(e) => setPlano(e.target.value)} style={estilos.inputInline}>
            <option value="trial">Trial</option>
            <option value="basico">Básico</option>
            <option value="pro">Pro</option>
          </select>
        </td>
        <td>
          <select value={status} onChange={(e) => setStatus(e.target.value)} style={estilos.inputInline}>
            <option value="ativo">Ativo</option>
            <option value="suspenso">Suspenso</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </td>
        <td style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" style={estilos.btnPequeno} onClick={salvar} disabled={salvando}>
            {salvando ? 'Salvando…' : 'Salvar'}
          </button>
          <button className="btn-ghost" style={estilos.btnPequeno} onClick={() => setEditando(false)}>Cancelar</button>
        </td>
      </tr>
    )
  }

  return (
    <tr className="clickable" onClick={onAbrir}>
      <td>{cliente.nome}</td>
      <td style={{ textTransform: 'capitalize' }}>{cliente.plano}</td>
      <td><span className={`pill ${cliente.status}`}>{cliente.status}</span></td>
      <td style={{ display: 'flex', gap: 8 }} onClick={(e) => e.stopPropagation()}>
        <button className="btn-ghost" style={estilos.btnPequeno} onClick={() => setEditando(true)}>Editar</button>
        <button className="btn-ghost" style={{ ...estilos.btnPequeno, color: 'var(--red)' }} onClick={excluir} disabled={excluindo}>
          {excluindo ? 'Excluindo…' : 'Excluir'}
        </button>
      </td>
    </tr>
  )
}

function NovoClienteForm({ onCriado }) {
  const [nome, setNome] = useState('')
  const [plano, setPlano] = useState('trial')
  const [erro, setErro] = useState(null)
  const [enviando, setEnviando] = useState(false)

  async function salvar(e) {
    e.preventDefault()
    setEnviando(true)
    setErro(null)
    const { error } = await supabase.from('clientes').insert({ nome, plano })
    setEnviando(false)
    if (error) setErro('Não foi possível criar o cliente.')
    else onCriado()
  }

  return (
    <form onSubmit={salvar} style={{ marginTop: 20, borderTop: '1px solid var(--line)', paddingTop: 20 }}>
      <div className="field">
        <label htmlFor="nome">Nome do cliente</label>
        <input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} required autoFocus />
      </div>
      <div className="field">
        <label htmlFor="plano">Plano</label>
        <select id="plano" value={plano} onChange={(e) => setPlano(e.target.value)}>
          <option value="trial">Trial</option>
          <option value="basico">Básico</option>
          <option value="pro">Pro</option>
        </select>
      </div>
      {erro && <div className="error-text">{erro}</div>}
      <button className="btn btn-primary" type="submit" disabled={enviando}>
        {enviando ? 'Salvando…' : 'Salvar cliente'}
      </button>
    </form>
  )
}

const estilos = {
  inputInline: { width: '100%', padding: '6px 8px', border: '1px solid var(--line)', borderRadius: 6, fontSize: 13 },
  btnPequeno: { padding: '6px 12px', fontSize: 13 },
}
