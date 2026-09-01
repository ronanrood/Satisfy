import { useState } from "react";
import { supabase } from "../supabaseClient";
import logo from "../img/logo.png";
import { FiMail, FiLock, FiEye, FiEyeOff, FiAlertCircle, FiArrowRight } from "react-icons/fi";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
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
      <div className="login-bg-glow login-bg-glow-1"></div>
      <div className="login-bg-glow login-bg-glow-2"></div>
      
      <div className="login-card">
        {/* Logo */}
        <div className="login-brand">
          <img src={logo} alt="Satisfy" />
        </div>

        <div className="login-header">
          <h1>Bem-vindo de volta</h1>
          <p>Entre no painel para continuar</p>
        </div>

        <form onSubmit={entrar} className="login-form">
          {/* E-mail */}
          <div className="field">
            <label htmlFor="email">E-mail</label>

            <div className="input-wrapper">
              <span className="input-icon">
                <FiMail size={18} />
              </span>

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
              <span className="input-icon">
                <FiLock size={18} />
              </span>

              <input
                placeholder="Digite sua senha"
                id="senha"
                type={mostrarSenha ? "text" : "password"}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
              />

              <button
                type="button"
                className="toggle-password-btn"
                onClick={() => setMostrarSenha(!mostrarSenha)}
                title={mostrarSenha ? "Ocultar senha" : "Ver senha"}
              >
                {mostrarSenha ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>
          </div>

          {/* Erro */}
          {erro && (
            <div className="error-text">
              <FiAlertCircle size={16} />
              <span>{erro}</span>
            </div>
          )}

          {/* Botão */}
          <button
            className="btn btn-primary login-button"
            type="submit"
            disabled={enviando}
          >
            <span>{enviando ? "Entrando..." : "Entrar no Painel"}</span>
            {!enviando && <FiArrowRight size={18} />}
          </button>
        </form>

        <div className="login-footer">
          <span>© 2026 Satisfy</span>
          <span className="dot">•</span>
          <span>Pesquisa & satisfação</span>
        </div>
      </div>
    </div>
  );
}

