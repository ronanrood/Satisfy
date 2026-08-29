import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Login() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState(null)
  const [enviando, setEnviando] = useState(false)

  async function entrar(e) {
    e.preventDefault()
    setErro(null)
    setEnviando(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
    setEnviando(false)
    if (error) setErro('E-mail ou senha inválidos.')
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-brand"><span className="dot" />Satisfy</div>
        <div className="login-subtitle">Painel Mestre — pesquisa e satisfação</div>

        <form onSubmit={entrar}>
          <div className="field">
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="field">
            <label htmlFor="senha">Senha</label>
            <input
              id="senha"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
          </div>
          {erro && <div className="error-text">{erro}</div>}
          <button className="btn btn-primary" type="submit" disabled={enviando} style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
            {enviando ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
