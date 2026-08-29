import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../supabaseClient'

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
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <h2 className="card-title" style={{ marginBottom: 0 }}>Dispositivos ({totens.length})</h2>
        <button
          className="btn btn-primary"
          disabled={unidades.length === 0}
          onClick={() => setMostrarForm(!mostrarForm)}
          title={unidades.length === 0 ? 'Cadastre uma unidade primeiro' : ''}
        >
          {mostrarForm ? 'Cancelar' : '+ Novo totem'}
        </button>
      </div>

      {unidades.length === 0 && !carregando && (
        <p className="empty-state">Cadastre uma unidade antes de adicionar um totem.</p>
      )}

      {mostrarForm && (
        <NovoTotemForm unidades={unidades} onCriado={() => { setMostrarForm(false); buscar() }} />
      )}

      {carregando ? (
        <p className="empty-state">Carregando…</p>
      ) : totens.length > 0 && (
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
              <LinhaTotem key={t.id} totem={t} unidades={unidades} onMudou={buscar} />
            ))}
          </tbody>
        </table>
      )}
    </div>
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
        <td><input type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} /></td>
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
