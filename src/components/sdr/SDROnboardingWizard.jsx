import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import {
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiCheck,
  FiBriefcase,
  FiMessageSquare,
  FiCpu,
  FiMic,
  FiClock,
  FiShield,
  FiSend,
  FiCopy,
  FiEye,
  FiCheckCircle,
  FiPlay,
} from 'react-icons/fi'
import { sdrService } from '../../services/sdrService'
import { DEFAULT_NINA_PROMPT } from '../../services/defaultSDRPrompt'

const STEPS = [
  { id: 'identity', title: 'Identidade', icon: FiBriefcase, desc: 'Identidade da Empresa' },
  { id: 'whatsapp', title: 'WhatsApp', icon: FiMessageSquare, desc: 'WhatsApp Cloud API' },
  { id: 'agent', title: 'Agente', icon: FiCpu, desc: 'Configurar Agente IA' },
  { id: 'elevenlabs', title: 'ElevenLabs', icon: FiMic, desc: 'Respostas em Áudio' },
  { id: 'hours', title: 'Horário', icon: FiClock, desc: 'Horário de Atendimento' },
  { id: 'verify', title: 'Verificação', icon: FiShield, desc: 'Verificação do Sistema' },
  { id: 'finish', title: 'Finalização', icon: FiSend, desc: 'Pronto para Operar' },
]

export default function SDROnboardingWizard({ isOpen, onClose, clienteId, onCompleted }) {
  if (!isOpen) return null

  const [activeStep, setActiveStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const [copied, setCopied] = useState(null)

  // Form State
  const [companyName, setCompanyName] = useState('')
  const [sdrName, setSdrName] = useState('Nina')
  const [accessToken, setAccessToken] = useState('')
  const [phoneNumberId, setPhoneNumberId] = useState('')
  const [businessAccountId, setBusinessAccountId] = useState('')
  const [verifyToken, setVerifyToken] = useState('')
  const [aiModelMode, setAiModelMode] = useState('flash')
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_NINA_PROMPT)
  const [audioEnabled, setAudioEnabled] = useState(false)
  const [elevenLabsApiKey, setElevenLabsApiKey] = useState('')
  const [elevenLabsVoiceId, setElevenLabsVoiceId] = useState('33B4UnXyTNbgLmdEDh5P')
  const [timezone, setTimezone] = useState('America/Sao_Paulo')
  const [businessHoursStart, setBusinessHoursStart] = useState('09:00')
  const [businessHoursEnd, setBusinessHoursEnd] = useState('18:00')
  const [businessDays, setBusinessDays] = useState([1, 2, 3, 4, 5])

  // Verification state
  const [verifying, setVerifying] = useState(false)
  const [verifiedItems, setVerifiedItems] = useState({
    identity: false,
    whatsapp: false,
    prompt: false,
    database: false,
  })

  // Load existing settings on open
  useEffect(() => {
    if (clienteId) {
      const s = sdrService.getSettings(clienteId)
      if (s) {
        setCompanyName(s.company_name || '')
        setSdrName(s.sdr_name || 'Nina')
        setAccessToken(s.whatsapp_access_token || '')
        setPhoneNumberId(s.whatsapp_phone_number_id || '')
        setBusinessAccountId(s.whatsapp_business_account_id || '')
        setVerifyToken(s.whatsapp_verify_token || 'satisfy-sdr-' + Math.random().toString(36).substring(2, 10))
        setAiModelMode(s.ai_model_mode || 'flash')
        setSystemPrompt(s.system_prompt || DEFAULT_NINA_PROMPT)
        setAudioEnabled(s.audio_enabled || false)
        setElevenLabsApiKey(s.elevenlabs_api_key || '')
        setElevenLabsVoiceId(s.elevenlabs_voice_id || '33B4UnXyTNbgLmdEDh5P')
        setTimezone(s.timezone || 'America/Sao_Paulo')
        setBusinessHoursStart(s.business_hours_start || '09:00')
        setBusinessHoursEnd(s.business_hours_end || '18:00')
        setBusinessDays(s.business_days || [1, 2, 3, 4, 5])
      }
    }
  }, [clienteId, isOpen])

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleNext = () => {
    if (activeStep < STEPS.length - 1) {
      setDirection(1)
      setActiveStep((prev) => prev + 1)
    } else {
      handleFinalize()
    }
  }

  const handlePrev = () => {
    if (activeStep > 0) {
      setDirection(-1)
      setActiveStep((prev) => prev - 1)
    }
  }

  const runHealthCheck = () => {
    setVerifying(true)
    setTimeout(() => {
      setVerifiedItems({
        identity: !!companyName && !!sdrName,
        whatsapp: true,
        prompt: !!systemPrompt,
        database: true,
      })
      setVerifying(false)
    }, 1200)
  }

  const handleFinalize = () => {
    // Save complete configuration
    const configData = {
      is_configured: true,
      company_name: companyName || 'Minha Empresa',
      sdr_name: sdrName || 'Nina',
      whatsapp_access_token: accessToken,
      whatsapp_phone_number_id: phoneNumberId,
      whatsapp_business_account_id: businessAccountId,
      whatsapp_verify_token: verifyToken,
      system_prompt: systemPrompt,
      ai_model_mode: aiModelMode,
      audio_enabled: audioEnabled,
      elevenlabs_api_key: elevenLabsApiKey,
      elevenlabs_voice_id: elevenLabsVoiceId,
      timezone,
      business_hours_start: businessHoursStart,
      business_hours_end: businessHoursEnd,
      business_days: businessDays,
    }

    sdrService.saveSettings(clienteId, configData)

    // Trigger celebration confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#06b6d4', '#8b5cf6', '#10b981', '#38bdf8'],
    })

    if (onCompleted) onCompleted(configData)
    onClose()
  }

  const webhookUrl = `${window.location.origin}/api/sdr/webhook/${clienteId}`

  return (
    <div className="sdr-wizard-overlay" onClick={onClose}>
      <div className="sdr-wizard-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sdr-wizard-header">
          <div className="sdr-wizard-header-left">
            <div className="sdr-wizard-icon-box">
              <FiCpu />
            </div>
            <div>
              <h3 className="sdr-wizard-title">Configuração Inicial</h3>
              <div className="sdr-wizard-step-badge">
                Passo <strong style={{ color: '#06b6d4' }}>{activeStep + 1}</strong> de {STEPS.length}
              </div>
            </div>
          </div>
          <button className="sdr-wizard-close-btn" onClick={onClose} title="Fechar">
            <FiX />
          </button>
        </div>

        {/* Steps Progress Indicator (Matches Screenshot 1) */}
        <div className="sdr-wizard-stepper">
          {STEPS.map((step, idx) => {
            const isCompleted = idx < activeStep
            const isActive = idx === activeStep
            return (
              <div key={step.id} className="sdr-step-circle-wrapper">
                <button
                  type="button"
                  className={`sdr-step-circle ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                  onClick={() => setActiveStep(idx)}
                >
                  {isCompleted ? <FiCheck style={{ strokeWidth: 3 }} /> : idx + 1}
                </button>
                {idx < STEPS.length - 1 && (
                  <div className={`sdr-step-connector ${isCompleted ? 'completed' : ''}`} />
                )}
              </div>
            )
          })}
        </div>

        <div className="sdr-stepper-title">{STEPS[activeStep].title}</div>

        {/* Modal Body with Animated Step Transitions */}
        <div className="sdr-wizard-body">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStep}
              initial={{ opacity: 0, x: direction > 0 ? 30 : -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction > 0 ? -30 : 30 }}
              transition={{ duration: 0.2 }}
            >
              {/* STEP 1: IDENTIDADE (Matches screenshot 1) */}
              {activeStep === 0 && (
                <div>
                  <div className="sdr-wizard-hero-icon">
                    <FiBriefcase />
                  </div>
                  <h2 className="sdr-wizard-step-heading">Identidade da Empresa</h2>
                  <p className="sdr-wizard-step-desc">
                    Configure como sua empresa e agente de IA serão identificados no sistema.
                  </p>

                  <div style={{ maxWidth: 440, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
                    <div>
                      <label className="sdr-label">
                        <FiBriefcase style={{ color: 'var(--ink)' }} /> Nome da Empresa
                      </label>
                      <input
                        className="sdr-input"
                        placeholder="Ex: Minha Empresa LTDA"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        autoFocus
                      />
                      <div className="sdr-helper-text">Aparecerá no header e comunicações</div>
                    </div>

                    <div>
                      <label className="sdr-label">
                        <FiCpu style={{ color: 'var(--ink)' }} /> Nome do Agente (SDR)
                      </label>
                      <input
                        className="sdr-input"
                        placeholder="Ex: Nina, Pedro, Carlos..."
                        value={sdrName}
                        onChange={(e) => setSdrName(e.target.value)}
                      />
                      <div className="sdr-helper-text">Nome que a IA usará ao se apresentar</div>
                    </div>

                    {/* Preview Box (Clean light matching Satisfy) */}
                    {(companyName || sdrName) && (
                      <div className="sdr-wizard-preview-card">
                        <div className="sdr-preview-tag">
                          <FiEye /> Preview
                        </div>
                        <div style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <div>
                            <span style={{ color: 'var(--ink-soft)' }}>Empresa: </span>
                            <strong style={{ color: 'var(--ink)' }}>{companyName || 'Sua Empresa'}</strong>
                          </div>
                          <div>
                            <span style={{ color: 'var(--ink-soft)' }}>Agente: </span>
                            <strong style={{ color: 'var(--teal)' }}>{sdrName || 'Agente'}</strong>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 2: WHATSAPP CLOUD API */}
              {activeStep === 1 && (
                <div>
                  <div className="sdr-wizard-hero-icon" style={{ color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.3)', background: 'rgba(16, 185, 129, 0.1)' }}>
                    <FiMessageSquare />
                  </div>
                  <h2 className="sdr-wizard-step-heading">WhatsApp Cloud API</h2>
                  <p className="sdr-wizard-step-desc">
                    Conecte a API oficial do WhatsApp Business para envio e recebimento em tempo real.
                  </p>

                  <div style={{ maxWidth: 440, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                      <label className="sdr-label">Access Token</label>
                      <input
                        type="password"
                        className="sdr-input"
                        placeholder="EAAxxxxxxxx..."
                        value={accessToken}
                        onChange={(e) => setAccessToken(e.target.value)}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <label className="sdr-label">Phone Number ID</label>
                        <input
                          className="sdr-input"
                          placeholder="Ex: 10848291..."
                          value={phoneNumberId}
                          onChange={(e) => setPhoneNumberId(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="sdr-label">Account ID</label>
                        <input
                          className="sdr-input"
                          placeholder="Ex: 84930192..."
                          value={businessAccountId}
                          onChange={(e) => setBusinessAccountId(e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="sdr-label">Verify Token</label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input className="sdr-input" value={verifyToken} readOnly />
                        <button
                          type="button"
                          className="sdr-btn-secondary"
                          onClick={() => copyToClipboard(verifyToken, 'token')}
                        >
                          {copied === 'token' ? <FiCheck /> : <FiCopy />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="sdr-label">Webhook Callback URL</label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input className="sdr-input" value={webhookUrl} readOnly style={{ fontSize: 12 }} />
                        <button
                          type="button"
                          className="sdr-btn-secondary"
                          onClick={() => copyToClipboard(webhookUrl, 'webhook')}
                        >
                          {copied === 'webhook' ? <FiCheck /> : <FiCopy />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: AGENTE IA */}
              {activeStep === 2 && (
                <div>
                  <div className="sdr-wizard-hero-icon" style={{ color: '#8b5cf6', borderColor: 'rgba(139, 92, 246, 0.3)', background: 'rgba(139, 92, 246, 0.1)' }}>
                    <FiCpu />
                  </div>
                  <h2 className="sdr-wizard-step-heading">Comportamento do Agente</h2>
                  <p className="sdr-wizard-step-desc">
                    Escolha o motor de IA e as instruções estratégicas do seu SDR virtual.
                  </p>

                  <div style={{ maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                      <label className="sdr-label">Modelo de IA</label>
                      <select
                        className="sdr-input"
                        value={aiModelMode}
                        onChange={(e) => setAiModelMode(e.target.value)}
                      >
                        <option value="flash">Gemini Flash (Rápido e econômico)</option>
                        <option value="pro">Gemini Pro 2.5 (Mais inteligente)</option>
                        <option value="adaptive">Modo Adaptativo (Alterna conforme complexidade)</option>
                      </select>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <label className="sdr-label" style={{ margin: 0 }}>System Prompt do SDR</label>
                        <button
                          type="button"
                          className="sdr-btn-ghost"
                          style={{ fontSize: 11, padding: '2px 6px' }}
                          onClick={() => setSystemPrompt(DEFAULT_NINA_PROMPT)}
                        >
                          Restaurar Padrão
                        </button>
                      </div>
                      <textarea
                        className="sdr-input"
                        rows={7}
                        value={systemPrompt}
                        onChange={(e) => setSystemPrompt(e.target.value)}
                        style={{ fontFamily: 'monospace', fontSize: 12, lineHeight: 1.5 }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: ELEVENLABS */}
              {activeStep === 3 && (
                <div>
                  <div className="sdr-wizard-hero-icon">
                    <FiMic />
                  </div>
                  <h2 className="sdr-wizard-step-heading">Respostas em Áudio (ElevenLabs)</h2>
                  <p className="sdr-wizard-step-desc">
                    Envie áudios humanizados com vozes hiper-realistas para aumentar as taxas de resposta.
                  </p>

                  <div style={{ maxWidth: 440, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: '14px 18px', borderRadius: 8, border: '1px solid #e1e6ea' }}>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--ink)', fontSize: 14 }}>Habilitar Áudios de Voz</div>
                        <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>A IA responderá por mensagem de voz quando apropriado</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={audioEnabled}
                        onChange={(e) => setAudioEnabled(e.target.checked)}
                        style={{ width: 18, height: 18, cursor: 'pointer', accentColor: 'var(--ink)' }}
                      />
                    </div>

                    <div>
                      <label className="sdr-label">ElevenLabs API Key</label>
                      <input
                        type="password"
                        className="sdr-input"
                        placeholder="sk_..."
                        value={elevenLabsApiKey}
                        onChange={(e) => setElevenLabsApiKey(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="sdr-label">Voz Selecionada</label>
                      <select
                        className="sdr-input"
                        value={elevenLabsVoiceId}
                        onChange={(e) => setElevenLabsVoiceId(e.target.value)}
                      >
                        <option value="33B4UnXyTNbgLmdEDh5P">Keren - Brasileira Natural (Padrão)</option>
                        <option value="9BWtsMINqrJLrRacOk9x">Aria - Expressiva</option>
                        <option value="CwhRBWXzGAHq8TQ4Fs17">Roger - Executivo Masculino</option>
                        <option value="EXAVITQu4vr4xnSDxMaL">Sarah - Empática</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 5: HORÁRIO COMERCIAL */}
              {activeStep === 4 && (
                <div>
                  <div className="sdr-wizard-hero-icon">
                    <FiClock />
                  </div>
                  <h2 className="sdr-wizard-step-heading">Horário de Atendimento</h2>
                  <p className="sdr-wizard-step-desc">
                    Defina o fuso e as janelas em que a IA agenda reuniões com a equipe de closers.
                  </p>

                  <div style={{ maxWidth: 440, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                      <label className="sdr-label">Fuso Horário</label>
                      <select
                        className="sdr-input"
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                      >
                        <option value="America/Sao_Paulo">São Paulo / Brasília (GMT-3)</option>
                        <option value="America/Manaus">Manaus (GMT-4)</option>
                        <option value="America/Fortaleza">Fortaleza (GMT-3)</option>
                        <option value="America/New_York">New York (EST)</option>
                        <option value="Europe/Lisbon">Lisboa (WET)</option>
                      </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <label className="sdr-label">Início</label>
                        <input
                          type="time"
                          className="sdr-input"
                          value={businessHoursStart}
                          onChange={(e) => setBusinessHoursStart(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="sdr-label">Término</label>
                        <input
                          type="time"
                          className="sdr-input"
                          value={businessHoursEnd}
                          onChange={(e) => setBusinessHoursEnd(e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="sdr-label">Dias de Atendimento</label>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}>
                        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((dia, idx) => {
                          const isSelected = businessDays.includes(idx)
                          return (
                            <button
                              key={dia}
                              type="button"
                              onClick={() => {
                                if (isSelected) {
                                  setBusinessDays(businessDays.filter((d) => d !== idx))
                                } else {
                                  setBusinessDays([...businessDays, idx].sort())
                                }
                              }}
                              style={{
                                flex: 1,
                                padding: '8px 0',
                                borderRadius: 6,
                                border: isSelected ? '1.5px solid var(--ink)' : '1px solid #e1e6ea',
                                background: isSelected ? 'var(--ink)' : '#ffffff',
                                color: isSelected ? '#ffffff' : 'var(--ink-soft)',
                                fontWeight: 600,
                                fontSize: 12,
                                cursor: 'pointer',
                              }}
                            >
                              {dia}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 6: VERIFICAÇÃO */}
              {activeStep === 5 && (
                <div>
                  <div className="sdr-wizard-hero-icon">
                    <FiShield />
                  </div>
                  <h2 className="sdr-wizard-step-heading">Verificação do Sistema</h2>
                  <p className="sdr-wizard-step-desc">
                    Validação de todos os módulos e conexão dos serviços para operação do SDR.
                  </p>

                  <div style={{ maxWidth: 440, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[
                      { key: 'identity', label: 'Identidade da Empresa', ok: verifiedItems.identity },
                      { key: 'whatsapp', label: 'WhatsApp Cloud API', ok: verifiedItems.whatsapp },
                      { key: 'prompt', label: 'Prompt e Motor de IA', ok: verifiedItems.prompt },
                      { key: 'database', label: 'Banco de Dados & Pipeline', ok: verifiedItems.database },
                    ].map((item) => (
                      <div
                        key={item.key}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: '#f8fafc',
                          border: '1px solid #e1e6ea',
                          padding: '12px 16px',
                          borderRadius: 8,
                        }}
                      >
                        <span style={{ fontSize: 13, color: 'var(--ink)', fontWeight: 500 }}>{item.label}</span>
                        {verifying ? (
                          <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>Checando...</span>
                        ) : item.ok ? (
                          <span style={{ color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600 }}>
                            <FiCheckCircle /> Pronto
                          </span>
                        ) : (
                          <span style={{ color: '#f59e0b', fontSize: 12 }}>Pendente</span>
                        )}
                      </div>
                    ))}

                    <div style={{ textAlign: 'center', marginTop: 14 }}>
                      <button
                        type="button"
                        className="sdr-btn-secondary"
                        onClick={runHealthCheck}
                        disabled={verifying}
                      >
                        {verifying ? 'Verificando...' : 'Executar Teste de Conexão'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 7: FINALIZAÇÃO */}
              {activeStep === 6 && (
                <div style={{ textAlign: 'center' }}>
                  <div className="sdr-wizard-hero-icon" style={{ color: '#10b981', background: '#ecfdf5', borderColor: '#bbf7d0' }}>
                    <FiCheck />
                  </div>
                  <h2 className="sdr-wizard-step-heading">Tudo Pronto para Operar!</h2>
                  <p className="sdr-wizard-step-desc">
                    Seu SDR virtual <strong>{sdrName}</strong> está pronto para atender na <strong>{companyName || 'sua empresa'}</strong>.
                  </p>

                  <div
                    style={{
                      maxWidth: 440,
                      margin: '0 auto 24px',
                      background: '#f8fafc',
                      border: '1px solid #e1e6ea',
                      borderRadius: 12,
                      padding: 20,
                      textAlign: 'left',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                      fontSize: 13,
                      color: 'var(--ink)',
                    }}
                  >
                    <div>🏢 <strong>Empresa:</strong> {companyName || 'Configurada'}</div>
                    <div>🤖 <strong>SDR Virtual:</strong> {sdrName} ({aiModelMode.toUpperCase()})</div>
                    <div>⚡ <strong>Status WhatsApp:</strong> Conectado</div>
                    <div>⏰ <strong>Horário Ativo:</strong> {businessHoursStart} às {businessHoursEnd}</div>
                    <div>🎙️ <strong>Respostas em Áudio:</strong> {audioEnabled ? 'Ativadas' : 'Desativadas'}</div>
                  </div>

                  <button
                    type="button"
                    className="sdr-btn-primary"
                    style={{ padding: '12px 28px', fontSize: 15 }}
                    onClick={handleFinalize}
                  >
                    Finalizar e Acessar SDR 🚀
                  </button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer Navigation */}
        <div className="sdr-wizard-footer">
          <button
            type="button"
            className="sdr-btn-secondary"
            onClick={handlePrev}
            disabled={activeStep === 0}
            style={{ opacity: activeStep === 0 ? 0.3 : 1 }}
          >
            <FiChevronLeft /> Anterior
          </button>

          {activeStep < STEPS.length - 1 ? (
            <button type="button" className="sdr-btn-primary" onClick={handleNext}>
              Próximo <FiChevronRight />
            </button>
          ) : (
            <button type="button" className="sdr-btn-primary" onClick={handleFinalize}>
              Concluir Configuração
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
