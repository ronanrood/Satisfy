import { useEffect } from 'react'
import { FiShield, FiX, FiCheckCircle, FiMail, FiExternalLink } from 'react-icons/fi'

export default function ModalPrivacidadeLGPD({ aberto, onClose, onVerMais }) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && aberto) {
        onClose?.()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [aberto, onClose])

  if (!aberto) return null

  return (
    <div className="modal-lgpd-overlay" onClick={onClose}>
      <div 
        className="modal-lgpd-container" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-lgpd-title"
      >
        {/* Header */}
        <div className="modal-lgpd-header">
          <div className="modal-lgpd-header-left">
            <div className="modal-lgpd-icon-badge">
              <FiShield />
            </div>
            <div>
              <h3 id="modal-lgpd-title" className="modal-lgpd-title">
                Privacidade & Proteção de Dados
              </h3>
              <p className="modal-lgpd-subtitle">
                Em conformidade com a LGPD (Lei nº 13.709/2018)
              </p>
            </div>
          </div>
          <button 
            type="button" 
            className="modal-lgpd-close-btn" 
            onClick={onClose}
            aria-label="Fechar modal"
          >
            <FiX />
          </button>
        </div>

        {/* Body */}
        <div className="modal-lgpd-body">
          <div className="modal-lgpd-highlight-card">
            <FiCheckCircle className="modal-lgpd-highlight-icon" />
            <div>
              <strong style={{ display: 'block', color: '#166534', marginBottom: 2 }}>
                Compromisso com a sua privacidade
              </strong>
              <span style={{ fontSize: 12.5, color: '#15803d', lineHeight: 1.4 }}>
                O Satisfy (desenvolvido pela <strong>Nuvdev</strong>) atua garantindo transparência, sigilo e segurança no tratamento de dados de avaliações e pesquisas de satisfação.
              </span>
            </div>
          </div>

          <div className="modal-lgpd-summary-list">
            <div className="modal-lgpd-summary-item">
              <span className="modal-lgpd-item-dot" />
              <div>
                <strong>Papéis na LGPD:</strong> Sua empresa atua como <em>Controladora</em> das pesquisas de satisfação, e a <strong>Nuvdev</strong> atua como <em>Operadora</em> tecnológica da plataforma.
              </div>
            </div>

            <div className="modal-lgpd-summary-item" style={{ marginTop: 10 }}>
              <span className="modal-lgpd-item-dot" />
              <div>
                <strong>Coleta Voluntária:</strong> As notas e opiniões são coletadas para aprimorar produtos e serviços. Dados pessoais como Nome e WhatsApp são fornecidos de forma voluntária pelo próprio titular.
              </div>
            </div>

            <div className="modal-lgpd-summary-item" style={{ marginTop: 10 }}>
              <span className="modal-lgpd-item-dot" />
              <div>
                <strong>Segurança:</strong> Todos os dados são transmitidos com criptografia SSL/TLS e armazenados com isolamento lógico por cliente e controle de acesso estrito.
              </div>
            </div>

            <div className="modal-lgpd-summary-item" style={{ marginTop: 10 }}>
              <span className="modal-lgpd-item-dot" />
              <div>
                <strong>Direitos do Titular:</strong> O titular pode solicitar a qualquer momento a confirmação, correção, anonimização ou exclusão dos seus dados cadastrados.
              </div>
            </div>
          </div>

          {/* Card de Contato Oficial */}
          <div className="modal-lgpd-contact-box">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                <FiMail />
              </div>
              <div>
                <span style={{ fontSize: 11, color: '#64748b', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>
                  Canal do Encarregado (DPO)
                </span>
                <a 
                  href="mailto:contato@nuvdev.com" 
                  className="modal-lgpd-contact-mail"
                >
                  contato@nuvdev.com
                </a>
              </div>
            </div>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>
              Atendimento em dias úteis
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-lgpd-footer">
          <button 
            type="button" 
            className="btn-ghost" 
            onClick={onClose}
          >
            Fechar
          </button>
          <button 
            type="button" 
            className="btn-action-primary"
            style={{ fontSize: 12, padding: '8px 18px' }}
            onClick={() => {
              onClose?.()
              onVerMais?.()
            }}
          >
            <span>Ver Política Completa</span>
            <FiExternalLink style={{ fontSize: 13 }} />
          </button>
        </div>
      </div>
    </div>
  )
}

