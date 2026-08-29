import { useState } from "react";
import { supabase } from "../supabaseClient";
import logo from "../img/logo.png";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState(null);
  const [enviando, setEnviando] = useState(false);

  async function entrar(e) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    setEnviando(false);

    if (error) {
      setErro("E-mail ou senha inválidos.");
    }
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        {/* Logo */}
        <div className="login-brand">
          <img src={logo} alt="Satisfy" />
        </div>

        <div className="login-header">
          <h1>Bem-vindo de volta</h1>
          <p>Entre no painel para continuar</p>
        </div>

        <form onSubmit={entrar}>
          {/* E-mail */}
          <div className="field">
            <label htmlFor="email">E-mail</label>

            <div className="input-wrapper">
              <span className="input-icon">✉</span>

              <input
                placeholder="Digite seu e-mail"
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
          </div>

          {/* Senha */}
          <div className="field">
            <label htmlFor="senha">Senha</label>

            <div className="input-wrapper">
              <span className="input-icon">●</span>

              <input
                placeholder="Digite sua senha"
                id="senha"
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Erro */}
          {erro && <div className="error-text">{erro}</div>}

          {/* Botão */}
          <button
            className="btn btn-primary login-button"
            type="submit"
            disabled={enviando}
          >
            {enviando ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <div className="login-footer">
          <span>© 2026 Satisfy</span>
          <span>Pesquisa & satisfação</span>
        </div>
      </div>
    </div>
  );
}
