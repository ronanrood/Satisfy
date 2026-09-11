import { useNavigate } from 'react-router-dom'
import { 
  FiShield, 
  FiArrowLeft, 
  FiLock, 
  FiFileText, 
  FiCheckCircle, 
  FiMail, 
  FiUserCheck, 
  FiDatabase, 
  FiUsers, 
  FiSmartphone, 
  FiPrinter 
} from 'react-icons/fi'

export default function PrivacidadePage() {
  const navigate = useNavigate()

  return (
    <div className="privacy-page-container">
      {/* Barra Superior com Voltar e Ações */}
      <div className="privacy-topbar metricas-ocultar-impressao">
        <button 
          type="button" 
          className="btn-ghost" 
          onClick={() => navigate(-1)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <FiArrowLeft /> Voltar
        </button>

        <button 
          type="button" 
          className="btn-ghost" 
          onClick={() => window.print()}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <FiPrinter /> Imprimir Política
        </button>
      </div>

      {/* Cabeçalho do Documento */}
      <div className="privacy-doc-header">
        <div className="privacy-badge">
          <FiShield />
          <span>Segurança & Conformidade Legal</span>
        </div>
        <h1 className="privacy-title">
          Política de Privacidade & Proteção de Dados (LGPD)
        </h1>
        <p className="privacy-subtitle">
          Termos de Governança, Transparência e Tratamento de Dados Pessoais da Plataforma Satisfy
        </p>
        <div className="privacy-meta-row">
          <span>Última atualização: Setembro de 2026</span>
          <span>•</span>
          <span>Versão 2.4</span>
          <span>•</span>
          <span>Nuvdev Tecnologia</span>
        </div>
      </div>

      {/* Caixa de Destaque / DPO */}
      <div className="privacy-callout-card">
        <div className="privacy-callout-icon">
          <FiMail />
        </div>
        <div className="privacy-callout-content">
          <h4>Canal Oficial do Encarregado de Dados (DPO)</h4>
          <p>
            Para exercer seus direitos de titular (confirmação, acesso, correção ou exclusão de dados) ou tirar dúvidas sobre o tratamento de suas informações, entre em contato diretamente pelo e-mail:
          </p>
          <a href="mailto:contato@nuvdev.com" className="privacy-dpo-email">
            contato@nuvdev.com
          </a>
        </div>
      </div>

      {/* Conteúdo Estruturado */}
      <div className="privacy-sections-wrapper">
        {/* Seção 1 */}
        <section className="privacy-section">
          <div className="privacy-section-heading">
            <span className="privacy-section-num">1</span>
            <h2>Apresentação e Compromisso Institucional</h2>
          </div>
          <p>
            O <strong>Satisfy</strong>, software desenvolvido e mantido pela <strong>Nuvdev</strong> (acessível pelo e-mail <strong>contato@nuvdev.com</strong>), foi projetado com base no princípio de <em>Privacy by Design</em> e <em>Privacy by Default</em>, assegurando que a coleta e o processamento de pesquisas de satisfação estejam em estrita conformidade com a <strong>Lei Geral de Proteção de Dados Pessoais (Lei Federal nº 13.709/2018 — LGPD)</strong>.
          </p>
          <p>
            Esta política tem por objetivo informar com clareza, transparência e objetividade aos clientes, parceiros, funcionários e consumidores finais as diretrizes que regem a custódia, segurança e tratamento de dados dentro do ecossistema Satisfy.
          </p>
        </section>

        {/* Seção 2 */}
        <section className="privacy-section">
          <div className="privacy-section-heading">
            <span className="privacy-section-num">2</span>
            <h2>Agentes de Tratamento (Papéis na LGPD)</h2>
          </div>
          <p>
            Conforme estabelecido pelo Artigo 5º da LGPD, os papéis na operação do sistema são definidos da seguinte forma:
          </p>
          <div className="privacy-grid-cards">
            <div className="privacy-info-card">
              <div className="privacy-info-header">
                <FiUsers className="privacy-info-icon" />
                <strong>Controladora dos Dados</strong>
              </div>
              <p>
                A <strong>Empresa Contratante</strong> (cliente do Satisfy) que disponibiliza os totens e questionários aos consumidores. É a Controladora quem define as perguntas, unidades participantes e finalidades de negócio do feedback coletado.
              </p>
            </div>

            <div className="privacy-info-card">
              <div className="privacy-info-header">
                <FiDatabase className="privacy-info-icon" />
                <strong>Operadora dos Dados</strong>
              </div>
              <p>
                A <strong>Nuvdev</strong>, na qualidade de desenvolvedora e operadora tecnológica, fornece a infraestrutura de software em nuvem, banco de dados, painel administrativo e serviços de inteligência artificial (SDR), tratando dados sob instruções da Controladora.
              </p>
            </div>
          </div>
        </section>

        {/* Seção 3 */}
        <section className="privacy-section">
          <div className="privacy-section-heading">
            <span className="privacy-section-num">3</span>
            <h2>Quais Dados São Coletados e Finalidades</h2>
          </div>
          <p>
            O Satisfy coleta apenas o estritamente necessário para as finalidades legítimas declaradas:
          </p>
          <ul className="privacy-bullet-list">
            <li>
              <strong>Métricas Quantitativas de Satisfação:</strong> Notas numéricas (NPS de 0 a 10, estrelas de 1 a 5, emojis ou escalas de opinião). <em>Finalidade:</em> Análise estatística e mensuração da qualidade de atendimento.
            </li>
            <li>
              <strong>Comentários e Feedbacks Qualitativos:</strong> Opiniões em texto espontaneamente digitadas pelo usuário no totem. <em>Finalidade:</em> Aprimoramento de produtos e resolução de problemas operacionais.
            </li>
            <li>
              <strong>Dados de Contato (Nome e WhatsApp / Telefone):</strong> Coletados unicamente quando o cliente preenche voluntariamente a etapa de identificação na pesquisa. <em>Finalidade:</em> Contato de suporte, acompanhamento de insatisfações (SAC) e abordagem comercial qualificada através do módulo SDR da empresa.
            </li>
            <li>
              <strong>Metadados Técnicos:</strong> Identificação do totem de origem, unidade/filial física, data e hora da resposta. Não são gravados dados biométricos, sensíveis ou de geolocalização exata sem consentimento.
            </li>
          </ul>
        </section>

        {/* Seção 4 */}
        <section className="privacy-section">
          <div className="privacy-section-heading">
            <span className="privacy-section-num">4</span>
            <h2>Bases Legais para o Tratamento (Art. 7º da LGPD)</h2>
          </div>
          <p>
            Todo o tratamento de dados pessoais no Satisfy encontra respaldo em bases legais válidas:
          </p>
          <div className="privacy-grid-cards">
            <div className="privacy-info-card">
              <div className="privacy-info-header">
                <FiCheckCircle className="privacy-info-icon" style={{ color: '#10b981' }} />
                <strong>Consentimento (Art. 7º, I)</strong>
              </div>
              <p>
                Fornecido de maneira livre, informada e inequívoca pelo titular no momento em que opta por preencher seu Nome e Telefone/WhatsApp no totem para ser contatado.
              </p>
            </div>

            <div className="privacy-info-card">
              <div className="privacy-info-header">
                <FiLock className="privacy-info-icon" style={{ color: '#0284c7' }} />
                <strong>Legítimo Interesse (Art. 7º, IX)</strong>
              </div>
              <p>
                Utilizado para o aprimoramento contínuo dos serviços e suporte ao cliente, sempre respeitando as expectativas e os direitos fundamentais do titular.
              </p>
            </div>
          </div>
        </section>

        {/* Seção 5 */}
        <section className="privacy-section">
          <div className="privacy-section-heading">
            <span className="privacy-section-num">5</span>
            <h2>Segurança da Informação e Armazenamento</h2>
          </div>
          <p>
            Adotamos medidas técnicas e organizacionais rígidas para salvaguardar todos os registros:
          </p>
          <ul className="privacy-bullet-list">
            <li><strong>Criptografia em Trânsito:</strong> Toda comunicação entre os totens, a API do backend e o painel administrativo é criptografada utilizando o protocolo TLS 1.3 (HTTPS).</li>
            <li><strong>Banco de Dados Protegido:</strong> Infraestrutura Supabase com bancos de dados PostgreSQL gerenciados, backups redundantes e políticas de isolamento lógico (RLS).</li>
            <li><strong>Controle de Acesso Restrito:</strong> Apenas operadores autenticados com credenciais seguras têm acesso aos dados operacionais de cada cliente respectivo.</li>
            <li><strong>Não-Comercialização:</strong> A Nuvdev não vende, aluga ou cede os dados dos clientes a terceiros para fins de marketing ou publicidade não autorizada.</li>
          </ul>
        </section>

        {/* Seção 6 */}
        <section className="privacy-section">
          <div className="privacy-section-heading">
            <span className="privacy-section-num">6</span>
            <h2>Direitos dos Titulares de Dados (Art. 18 da LGPD)</h2>
          </div>
          <p>
            Em cumprimento ao Artigo 18 da Lei Federal nº 13.709/2018, qualquer titular de dados cujas informações foram registradas nos totens pode solicitar:
          </p>
          <div className="privacy-rights-grid">
            <div className="privacy-right-item">✓ Confirmação da existência de tratamento</div>
            <div className="privacy-right-item">✓ Acesso aos dados pessoais existentes</div>
            <div className="privacy-right-item">✓ Correção de dados incompletos ou inexatos</div>
            <div className="privacy-right-item">✓ Anonimização, bloqueio ou eliminação de dados</div>
            <div className="privacy-right-item">✓ Revogação do consentimento concedido</div>
            <div className="privacy-right-item">✓ Informação sobre eventuais compartilhamentos</div>
          </div>
        </section>

        {/* Seção 7 */}
        <section className="privacy-section">
          <div className="privacy-section-heading">
            <span className="privacy-section-num">7</span>
            <h2>Canal do Encarregado (DPO) e Atendimento</h2>
          </div>
          <p>
            Para exercer quaisquer direitos de privacidade ou submeter dúvidas, solicitações ou notificações relacionadas à presente Política de Privacidade, disponibilizamos nosso canal oficial:
          </p>
          <div className="privacy-contact-card">
            <div className="privacy-contact-icon">
              <FiMail />
            </div>
            <div>
              <strong>Encarregado pelo Tratamento de Dados Pessoais (DPO)</strong>
              <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Nuvdev Tecnologia & Satisfy</div>
              <a href="mailto:contato@nuvdev.com" className="privacy-contact-link">
                contato@nuvdev.com
              </a>
            </div>
          </div>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 14 }}>
            As requisições serão recepcionadas, protocoladas e respondidas dentro dos prazos estabelecidos pela Autoridade Nacional de Proteção de Dados (ANPD).
          </p>
        </section>
      </div>

      {/* Rodapé da Página */}
      <div className="privacy-footer">
        <p>© 2026 Satisfy — Uma solução desenvolvida por Nuvdev Tecnologia (contato@nuvdev.com). Todos os direitos reservados.</p>
      </div>
    </div>
  )
}

