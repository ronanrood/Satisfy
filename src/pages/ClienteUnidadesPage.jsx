import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../supabaseClient'

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
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <h2 className="card-title" style={{ marginBottom: 0 }}>Unidades ({unidades.length})</h2>
        <button className="btn btn-primary" onClick={() => setMostrarForm(!mostrarForm)}>
          {mostrarForm ? 'Cancelar' : '+ Nova unidade'}
        </button>
      </div>

      {mostrarForm && (
        <NovaUnidadeForm clienteId={clienteId} onCriado={() => { setMostrarForm(false); buscar() }} />
      )}

      {carregando ? (
        <p className="empty-state">Carregando…</p>
      ) : unidades.length === 0 ? (
        <p className="empty-state">Nenhuma unidade cadastrada ainda.</p>
      ) : (
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
              <LinhaUnidade key={u.id} unidade={u} onMudou={buscar} />
            ))}
          </tbody>
        </table>
      )}
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

const estilos = {
  inputInline: { width: '100%', padding: '6px 8px', border: '1px solid var(--line)', borderRadius: 6, fontSize: 13 },
  btnPequeno: { padding: '6px 12px', fontSize: 13 },
}
