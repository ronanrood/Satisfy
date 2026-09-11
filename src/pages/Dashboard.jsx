import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import Layout from '../components/Layout'
import { FiPlus, FiSearch, FiEdit2, FiTrash2, FiExternalLink, FiUsers, FiMail } from 'react-icons/fi'

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
                <th>RELATÓRIO SEMANAL</th>
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
  const [emailRelatorio, setEmailRelatorio] = useState(cliente.email_relatorio || '')
  const [receberRelatorioSemanal, setReceberRelatorioSemanal] = useState(cliente.receber_relatorio_semanal !== false)
  const [salvando, setSalvando] = useState(false)
  const [excluindo, setExcluindo] = useState(false)

  async function salvar(e) {
    e.stopPropagation()
    setSalvando(true)
    const payload = {
      nome: nome.trim(),
      plano,
      status,
      email_relatorio: emailRelatorio.trim() || null,
      receber_relatorio_semanal: Boolean(receberRelatorioSemanal),
    }

    let { error } = await supabase.from('clientes').update(payload).eq('id', cliente.id)

    // Tratamento caso a coluna ainda não exista no Supabase
    if (error && error.code === 'PGRST204') {
      const fallback = await supabase.from('clientes').update({ nome: nome.trim(), plano, status }).eq('id', cliente.id)
      if (!fallback.error) {
        alert('Dados básicos atualizados!\n\nNota: Para persistir o e-mail de relatório semanal, execute o script "supabase_migration_relatorios.sql" no SQL Editor do Supabase.')
        setSalvando(false)
        setEditando(false)
        onMudou()
        return
      }
    }

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
        <td>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <input
              type="email"
              className="input-inline"
              placeholder="E-mail de relatório..."
              value={emailRelatorio}
              onChange={(e) => setEmailRelatorio(e.target.value)}
              style={{ fontSize: 12 }}
            />
            <label style={{ fontSize: 11, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={receberRelatorioSemanal}
                onChange={(e) => setReceberRelatorioSemanal(e.target.checked)}
              />
              Envio 1x/semana
            </label>
          </div>
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
        <button
          type="button"
          className="btn-open-panel"
          onClick={(e) => {
            e.stopPropagation()
            onAbrir()
          }}
          title={`Abrir painel de ${cliente.nome}`}
        >
          <span>Abrir painel</span>
          <FiExternalLink className="sublink-icon" />
        </button>
      </td>
      <td>
        <span className="badge-plan">{cliente.plano || 'trial'}</span>
      </td>
      <td>
        <span className={`pill ${cliente.status || 'ativo'}`}>{cliente.status || 'ativo'}</span>
      </td>
      <td>
        {cliente.email_relatorio ? (
          cliente.receber_relatorio_semanal !== false ? (
            <span className="badge-report-active" title={`Envio automático 1x por semana ativo para ${cliente.email_relatorio}`}>
              <FiMail style={{ fontSize: 12 }} />
              <span className="badge-report-email">{cliente.email_relatorio}</span>
              <span className="badge-report-freq">1x/sem</span>
            </span>
          ) : (
            <span className="badge-report-paused" title={`Envio cancelado pelo cliente (e-mail cadastrado: ${cliente.email_relatorio})`}>
              <FiMail style={{ fontSize: 12 }} />
              <span>Cancelado</span>
            </span>
          )
        ) : (
          <span style={{ color: '#94a3b8', fontSize: 12 }}>Não configurado</span>
        )}
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
  const [emailRelatorio, setEmailRelatorio] = useState('')
  const [receberRelatorioSemanal, setReceberRelatorioSemanal] = useState(true)
  const [erro, setErro] = useState(null)
  const [enviando, setEnviando] = useState(false)

  async function salvar(e) {
    e.preventDefault()
    setEnviando(true)
    setErro(null)

    const payload = {
      nome: nome.trim(),
      plano,
      status: 'ativo',
      email_relatorio: emailRelatorio.trim() || null,
      receber_relatorio_semanal: Boolean(receberRelatorioSemanal),
    }

    let { error } = await supabase.from('clientes').insert(payload)

    // Tratamento resiliente caso a tabela ainda não tenha a nova coluna
    if (error && error.code === 'PGRST204') {
      const fallback = await supabase.from('clientes').insert({ nome: nome.trim(), plano, status: 'ativo' })
      if (!fallback.error) {
        alert('Cliente criado com sucesso!\n\nNota: Para persistir o e-mail de relatório semanal automático, execute o script "supabase_migration_relatorios.sql" no SQL Editor do seu Supabase.')
        setNome('')
        setEmailRelatorio('')
        setEnviando(false)
        onCriado()
        return
      }
      error = fallback.error
    }

    setEnviando(false)
    if (error) setErro('Não foi possível criar o cliente.')
    else {
      setNome('')
      setEmailRelatorio('')
      setReceberRelatorioSemanal(true)
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
        <div className="form-field" style={{ gridColumn: '1 / -1' }}>
          <label htmlFor="emailRelatorio" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <FiMail style={{ color: '#0284c7' }} />
            E-mail do Cliente para Relatório de Pesquisas
          </label>
          <input
            id="emailRelatorio"
            type="email"
            className="text-input"
            value={emailRelatorio}
            placeholder="Ex: diretoria@empresa.com.br ou contato@empresa.com.br"
            onChange={(e) => setEmailRelatorio(e.target.value)}
          />
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#334155', cursor: 'pointer', fontWeight: 500 }}>
              <input
                type="checkbox"
                checked={receberRelatorioSemanal}
                onChange={(e) => setReceberRelatorioSemanal(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: '#0284c7', cursor: 'pointer' }}
              />
              Receber relatório das pesquisas automaticamente 1x por semana
            </label>
          </div>
          <span style={{ fontSize: 11, color: '#64748b', display: 'block', marginTop: 4 }}>
            Você ou o cliente podem cancelar o envio automático a qualquer momento.
          </span>
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