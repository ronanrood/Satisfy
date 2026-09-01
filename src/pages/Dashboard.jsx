import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import Layout from '../components/Layout'
import { FiPlus, FiSearch, FiEdit2, FiTrash2, FiExternalLink, FiUsers } from 'react-icons/fi'

export default function Dashboard() {
  const [clientes, setClientes] = useState([])
  const [busca, setBusca] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    buscarClientes()
  }, [])

  async function buscarClientes() {
    setCarregando(true)
    const { data } = await supabase
      .from('clientes')
      .select('*')
      .order('created_at', { ascending: false })
    setClientes(data || [])
    setCarregando(false)
  }

  const clientesFiltrados = useMemo(() => {
    return clientes.filter((c) =>
      c.nome?.toLowerCase().includes(busca.toLowerCase()) ||
      c.plano?.toLowerCase().includes(busca.toLowerCase()) ||
      c.status?.toLowerCase().includes(busca.toLowerCase())
    )
  }, [clientes, busca])

  return (
    <Layout>
      {/* Cabeçalho da Página */}
      <div className="page-header-container">
        <div className="page-title-group">
          <div className="page-eyebrow">Painel Mestre</div>
          <h1 className="page-title">
            <FiUsers style={{ marginRight: 8, verticalAlign: 'middle' }} />
            Clientes
          </h1>
          <p className="page-subtitle">Empresas com licença ativa do Satisfy.</p>
        </div>

        <button 
          className="btn-action-primary" 
          onClick={() => setMostrarForm(!mostrarForm)}
        >
          <FiPlus />
          {mostrarForm ? 'CANCELAR' : 'NOVO CLIENTE'}
        </button>
      </div>

      {/* Formulário Retrátil */}
      {mostrarForm && (
        <div className="panel-card form-card-box">
          <NovoClienteForm
            onCriado={() => {
              setMostrarForm(false)
              buscarClientes()
            }}
          />
        </div>
      )}

      {/* Barra de Filtro e Busca */}
      <div className="table-controls">
        <div className="filter-summary">
          <strong>{clientesFiltrados.length}</strong> {clientesFiltrados.length === 1 ? 'cliente cadastrado' : 'clientes cadastrados'}
        </div>

        <div className="search-box">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Buscar por nome ou plano..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
      </div>

      {/* Card da Tabela de Clientes */}
      <div className="panel-card table-wrapper">
        {carregando ? (
          <div className="empty-state">
            <p>Carregando clientes...</p>
          </div>
        ) : clientesFiltrados.length === 0 ? (
          <div className="empty-state">
            <p>Nenhum cliente encontrado.</p>
          </div>
        ) : (
          <table className="clean-table data-table">
            <thead>
              <tr>
                <th>NOME</th>
                <th>PLANO</th>
                <th>STATUS</th>
                <th style={{ textAlign: 'right', paddingRight: '20px' }}>AÇÕES</th>
              </tr>
            </thead>
            <tbody>
              {clientesFiltrados.map((c) => (
                <LinhaCliente
                  key={c.id}
                  cliente={c}
                  onMudou={buscarClientes}
                  onAbrir={() => navigate(`/clientes/${c.id}`)}
                />
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
  const [plano, setPlano] = useState(cliente.plano || 'trial')
  const [status, setStatus] = useState(cliente.status || 'ativo')
  const [salvando, setSalvando] = useState(false)
  const [excluindo, setExcluindo] = useState(false)

  async function salvar(e) {
    e.stopPropagation()
    setSalvando(true)
    await supabase.from('clientes').update({ nome, plano, status }).eq('id', cliente.id)
    setSalvando(false)
    setEditando(false)
    onMudou()
  }

  async function excluir(e) {
    e.stopPropagation()
    const confirmado = window.confirm(
      `Excluir "${cliente.nome}"? Isso apagará todas as unidades, totens e respostas associadas.`
    )
    if (!confirmado) return
    setExcluindo(true)
    await supabase.from('clientes').delete().eq('id', cliente.id)
    onMudou()
  }

  if (editando) {
    return (
      <tr className="editing-row">
        <td>
          <input
            className="input-inline"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            autoFocus
          />
        </td>
        <td>
          <select
            className="input-inline select-inline"
            value={plano}
            onChange={(e) => setPlano(e.target.value)}
          >
            <option value="trial">Trial</option>
            <option value="basico">Básico</option>
            <option value="pro">Pro</option>
          </select>
        </td>
        <td>
          <select
            className="input-inline select-inline"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="ativo">Ativo</option>
            <option value="suspenso">Suspenso</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </td>
        <td className="actions-cell">
          <button className="btn-sm btn-save" onClick={salvar} disabled={salvando}>
            {salvando ? 'Salvando...' : 'Salvar'}
          </button>
          <button className="btn-sm btn-cancel" onClick={() => setEditando(false)}>
            Cancelar
          </button>
        </td>
      </tr>
    )
  }

  return (
    <tr className="data-row clickable" onClick={onAbrir}>
      <td className="cell-primary">
        <div className="client-name">{cliente.nome}</div>
        <div className="client-sublink">
          <FiExternalLink className="sublink-icon" /> Abrir painel
        </div>
      </td>
      <td>
        <span className="badge-plan">{cliente.plano || 'trial'}</span>
      </td>
      <td>
        <span className={`pill ${cliente.status || 'ativo'}`}>{cliente.status || 'ativo'}</span>
      </td>
      <td className="actions-cell" onClick={(e) => e.stopPropagation()}>
        <button className="action-btn" title="Editar" onClick={() => setEditando(true)}>
          <FiEdit2 />
        </button>
        <button className="action-btn delete" title="Excluir" onClick={excluir} disabled={excluindo}>
          <FiTrash2 />
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
    const { error } = await supabase.from('clientes').insert({ nome, plano, status: 'ativo' })
    setEnviando(false)
    if (error) setErro('Não foi possível criar o cliente.')
    else {
      setNome('')
      onCriado()
    }
  }

  return (
    <form onSubmit={salvar} className="compact-form">
      <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', color: '#1e293b' }}>Cadastrar Novo Cliente</h3>
      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="nome">Nome da Empresa</label>
          <input
            id="nome"
            className="text-input"
            value={nome}
            placeholder="Ex: Locarti Soluções"
            onChange={(e) => setNome(e.target.value)}
            required
            autoFocus
          />
        </div>
        <div className="form-field">
          <label htmlFor="plano">Plano de Licença</label>
          <select
            id="plano"
            className="text-input"
            value={plano}
            onChange={(e) => setPlano(e.target.value)}
          >
            <option value="trial">Trial</option>
            <option value="basico">Básico</option>
            <option value="pro">Pro</option>
          </select>
        </div>
      </div>

      {erro && <div className="error-text">{erro}</div>}

      <div className="form-footer">
        <button className="btn-action-primary" type="submit" disabled={enviando}>
          {enviando ? 'Salvando…' : 'Salvar Empresa'}
        </button>
      </div>
    </form>
  )
}