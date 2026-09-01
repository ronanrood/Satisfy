import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { FiPlus, FiEdit2, FiTrash2, FiMapPin, FiGrid } from 'react-icons/fi'

export default function ClienteUnidadesPage() {
  const { clienteId } = useOutletContext()
  const [unidades, setUnidades] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)

  useEffect(() => {
    buscar()
  }, [clienteId])

  async function buscar() {
    setCarregando(true)
    const { data } = await supabase.from('unidades').select('*').eq('cliente_id', clienteId).order('created_at')
    setUnidades(data || [])
    setCarregando(false)
  }

  return (
    <div>
      <div className="page-header-container">
        <div className="page-title-group">
          <div className="page-eyebrow">Gestão de Estrutura</div>
          <h1 className="page-title">
            <FiGrid style={{ marginRight: 8, verticalAlign: 'middle' }} />
            Unidades
          </h1>
          <p className="page-subtitle">Locais físicos e filiais cadastrados para coleta de satisfação.</p>
        </div>

        <button className="btn-action-primary" onClick={() => setMostrarForm(!mostrarForm)}>
          <FiPlus />
          {mostrarForm ? 'CANCELAR' : 'NOVA UNIDADE'}
        </button>
      </div>

      {mostrarForm && (
        <div className="panel-card form-card-box">
          <NovaUnidadeForm clienteId={clienteId} onCriado={() => { setMostrarForm(false); buscar() }} />
        </div>
      )}

      <div className="panel-card table-wrapper">
        {carregando ? (
          <div className="empty-state">
            <p>Carregando unidades...</p>
          </div>
        ) : unidades.length === 0 ? (
          <div className="empty-state">
            <p>Nenhuma unidade cadastrada ainda. Clique em "Nova unidade" para começar.</p>
          </div>
        ) : (
          <table className="clean-table data-table">
            <thead>
              <tr>
                <th>NOME DA UNIDADE</th>
                <th>ENDEREÇO</th>
                <th style={{ textAlign: 'right', paddingRight: '20px' }}>AÇÕES</th>
              </tr>
            </thead>
            <tbody>
              {unidades.map((u) => (
                <LinhaUnidade key={u.id} unidade={u} onMudou={buscar} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function LinhaUnidade({ unidade, onMudou }) {
  const [editando, setEditando] = useState(false)
  const [nome, setNome] = useState(unidade.nome)
  const [endereco, setEndereco] = useState(unidade.endereco || '')
  const [salvando, setSalvando] = useState(false)

  async function salvar(e) {
    e.stopPropagation()
    setSalvando(true)
    await supabase.from('unidades').update({ nome, endereco }).eq('id', unidade.id)
    setSalvando(false)
    setEditando(false)
    onMudou()
  }

  async function excluir(e) {
    e.stopPropagation()
    const confirmado = window.confirm(`Excluir a unidade "${unidade.nome}"? Isso apaga os totens e respostas dela também.`)
    if (!confirmado) return
    await supabase.from('unidades').delete().eq('id', unidade.id)
    onMudou()
  }

  if (editando) {
    return (
      <tr className="editing-row">
        <td>
          <input className="input-inline" value={nome} onChange={(e) => setNome(e.target.value)} autoFocus />
        </td>
        <td>
          <input className="input-inline" value={endereco} onChange={(e) => setEndereco(e.target.value)} placeholder="Endereço..." />
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
    <tr className="data-row">
      <td className="cell-primary">
        <div className="client-name">{unidade.nome}</div>
      </td>
      <td>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#64748b' }}>
          <FiMapPin style={{ fontSize: 13, color: '#94a3b8' }} />
          {unidade.endereco || '—'}
        </span>
      </td>
      <td className="actions-cell">
        <button className="action-btn" title="Editar" onClick={() => setEditando(true)}>
          <FiEdit2 />
        </button>
        <button className="action-btn delete" title="Excluir" onClick={excluir}>
          <FiTrash2 />
        </button>
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
    <form onSubmit={salvar} className="compact-form">
      <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', color: '#1e293b' }}>Cadastrar Nova Unidade</h3>
      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="nomeUnidade">Nome da unidade</label>
          <input
            id="nomeUnidade"
            className="text-input"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex: Matriz Centro"
            required
            autoFocus
          />
        </div>
        <div className="form-field">
          <label htmlFor="endereco">Endereço (opcional)</label>
          <input
            id="endereco"
            className="text-input"
            value={endereco}
            onChange={(e) => setEndereco(e.target.value)}
            placeholder="Ex: Av. Principal, 100"
          />
        </div>
      </div>

      {erro && <div className="error-text">{erro}</div>}

      <div className="form-footer">
        <button className="btn-action-primary" type="submit" disabled={enviando}>
          {enviando ? 'Salvando…' : 'Salvar Unidade'}
        </button>
      </div>
    </form>
  )
}