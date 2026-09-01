import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { FiPlus, FiEdit2, FiTrash2, FiTablet, FiLink, FiCopy } from 'react-icons/fi'

export default function ClienteDispositivosPage() {
  const { clienteId } = useOutletContext()
  const [unidades, setUnidades] = useState([])
  const [totens, setTotens] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)

  useEffect(() => {
    buscar()
  }, [clienteId])

  async function buscar() {
    setCarregando(true)
    const { data: u } = await supabase.from('unidades').select('*').eq('cliente_id', clienteId).order('created_at')
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

  return (
    <div>
      <div className="page-header-container">
        <div className="page-title-group">
          <div className="page-eyebrow">Totens e Tablets</div>
          <h1 className="page-title">
            <FiTablet style={{ marginRight: 8, verticalAlign: 'middle' }} />
            Dispositivos
          </h1>
          <p className="page-subtitle">Totens cadastrados e links diretos para exibição do formulário de pesquisa.</p>
        </div>

        <button
          className="btn-action-primary"
          disabled={unidades.length === 0}
          onClick={() => setMostrarForm(!mostrarForm)}
          title={unidades.length === 0 ? 'Cadastre uma unidade primeiro' : ''}
        >
          <FiPlus />
          {mostrarForm ? 'CANCELAR' : 'NOVO DISPOSITIVO'}
        </button>
      </div>

      {mostrarForm && (
        <div className="panel-card form-card-box">
          <NovoTotemForm unidades={unidades} onCriado={() => { setMostrarForm(false); buscar() }} />
        </div>
      )}

      <div className="panel-card table-wrapper">
        {carregando ? (
          <div className="empty-state">
            <p>Carregando dispositivos...</p>
          </div>
        ) : unidades.length === 0 ? (
          <div className="empty-state">
            <p>Cadastre uma unidade antes de adicionar um totem.</p>
          </div>
        ) : totens.length === 0 ? (
          <div className="empty-state">
            <p>Nenhum totem cadastrado ainda.</p>
          </div>
        ) : (
          <table className="clean-table data-table">
            <thead>
              <tr>
                <th>NOME DO DISPOSITIVO</th>
                <th>UNIDADE</th>
                <th>URL DO TOTEM</th>
                <th>STATUS</th>
                <th style={{ textAlign: 'right', paddingRight: '20px' }}>AÇÕES</th>
              </tr>
            </thead>
            <tbody>
              {totens.map((t) => (
                <LinhaTotem key={t.id} totem={t} unidades={unidades} onMudou={buscar} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function LinhaTotem({ totem, unidades, onMudou }) {
  const [editando, setEditando] = useState(false)
  const [nome, setNome] = useState(totem.nome || '')
  const [unidadeId, setUnidadeId] = useState(totem.unidade_id)
  const [ativo, setAtivo] = useState(totem.ativo)
  const [salvando, setSalvando] = useState(false)

  async function salvar(e) {
    e.stopPropagation()
    setSalvando(true)
    await supabase.from('totens').update({ nome, unidade_id: unidadeId, ativo }).eq('id', totem.id)
    setSalvando(false)
    setEditando(false)
    onMudou()
  }

  async function excluir(e) {
    e.stopPropagation()
    const confirmado = window.confirm(`Excluir o totem "${totem.nome || 'sem nome'}"? O link /totem/${totem.token} para de funcionar.`)
    if (!confirmado) return
    await supabase.from('totens').delete().eq('id', totem.id)
    onMudou()
  }

  function copiarLink(e) {
    e.stopPropagation()
    const url = `${window.location.origin}/totem/${totem.token}`
    navigator.clipboard.writeText(url)
    alert('Link copiado para a área de transferência!')
  }

  if (editando) {
    return (
      <tr className="editing-row">
        <td>
          <input className="input-inline" value={nome} onChange={(e) => setNome(e.target.value)} autoFocus />
        </td>
        <td>
          <select className="input-inline select-inline" value={unidadeId} onChange={(e) => setUnidadeId(e.target.value)}>
            {unidades.map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
          </select>
        </td>
        <td><code style={{ fontSize: 12 }}>/totem/{totem.token}</code></td>
        <td>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}>
            <input type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} />
            Ativo
          </label>
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
        <div className="client-name">{totem.nome || 'Sem nome'}</div>
      </td>
      <td>
        <span className="badge-plan">{totem.unidades?.nome || '—'}</span>
      </td>
      <td>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <code style={{ fontSize: 12, background: '#f1f5f9', padding: '3px 8px', borderRadius: 4, color: '#0f172a' }}>
            /totem/{totem.token}
          </code>
          <button className="action-btn" title="Copiar link" onClick={copiarLink} style={{ padding: 4 }}>
            <FiCopy style={{ fontSize: 13 }} />
          </button>
        </div>
      </td>
      <td>
        <span className={`pill ${totem.ativo ? 'ativo' : 'cancelado'}`}>
          {totem.ativo ? 'ativo' : 'inativo'}
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
    <form onSubmit={salvar} className="compact-form">
      <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', color: '#1e293b' }}>Novo Totem / Dispositivo</h3>
      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="nomeTotem">Identificação do totem</label>
          <input
            id="nomeTotem"
            className="text-input"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex: Totem Recepção"
            required
            autoFocus
          />
        </div>
        <div className="form-field">
          <label htmlFor="unidade">Unidade Vinculada</label>
          <select
            id="unidade"
            className="text-input"
            value={unidadeId}
            onChange={(e) => setUnidadeId(e.target.value)}
          >
            {unidades.map((u) => (
              <option key={u.id} value={u.id}>{u.nome}</option>
            ))}
          </select>
        </div>
      </div>

      {erro && <div className="error-text">{erro}</div>}

      <div className="form-footer">
        <button className="btn-action-primary" type="submit" disabled={enviando}>
          {enviando ? 'Gerando…' : 'Gerar Totem'}
        </button>
      </div>
    </form>
  )
}