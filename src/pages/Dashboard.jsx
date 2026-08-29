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
              </tr>
            </thead>
            <tbody>
              {clientes.map((c) => (
                <tr key={c.id} className="clickable" onClick={() => navigate(`/clientes/${c.id}`)}>
                  <td>{c.nome}</td>
                  <td style={{ textTransform: 'capitalize' }}>{c.plano}</td>
                  <td>
                    <span className={`pill ${c.status}`}>{c.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
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
