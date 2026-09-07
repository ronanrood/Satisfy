import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import {
  FiSettings,
  FiCpu,
  FiMessageSquare,
  FiMic,
  FiClock,
  FiSave,
  FiRefreshCw,
  FiZap,
} from 'react-icons/fi'
import { sdrService } from '../../services/sdrService'
import { DEFAULT_NINA_PROMPT } from '../../services/defaultSDRPrompt'

export default function SDRConfiguracoesPage() {
  const { clienteId, openWizard } = useOutletContext()
  const [activeTab, setActiveTab] = useState('agent')
  const [savedSuccess, setSavedSuccess] = useState(false)

  // Settings state
  const [companyName, setCompanyName] = useState('')
  const [sdrName, setSdrName] = useState('Nina')
  const [aiModelMode, setAiModelMode] = useState('flash')
  const [systemPrompt, setSystemPrompt] = useState('')
  const [accessToken, setAccessToken] = useState('')
  const [phoneNumberId, setPhoneNumberId] = useState('')
  const [businessAccountId, setBusinessAccountId] = useState('')
  const [audioEnabled, setAudioEnabled] = useState(false)
  const [elevenLabsApiKey, setElevenLabsApiKey] = useState('')
  const [elevenLabsVoiceId, setElevenLabsVoiceId] = useState('33B4UnXyTNbgLmdEDh5P')
  const [businessHoursStart, setBusinessHoursStart] = useState('09:00')
  const [businessHoursEnd, setBusinessHoursEnd] = useState('18:00')

  useEffect(() => {
    if (clienteId) {
      const s = sdrService.getSettings(clienteId)
      if (s) {
        setCompanyName(s.company_name || '')
        setSdrName(s.sdr_name || 'Nina')
        setAiModelMode(s.ai_model_mode || 'flash')
        setSystemPrompt(s.system_prompt || DEFAULT_NINA_PROMPT)
        setAccessToken(s.whatsapp_access_token || '')
        setPhoneNumberId(s.whatsapp_phone_number_id || '')
        setBusinessAccountId(s.whatsapp_business_account_id || '')
        setAudioEnabled(s.audio_enabled || false)
        setElevenLabsApiKey(s.elevenlabs_api_key || '')
        setElevenLabsVoiceId(s.elevenlabs_voice_id || '33B4UnXyTNbgLmdEDh5P')
        setBusinessHoursStart(s.business_hours_start || '09:00')
        setBusinessHoursEnd(s.business_hours_end || '18:00')
      }
    }
  }, [clienteId])

  const handleSave = (e) => {
    e.preventDefault()
    const current = sdrService.getSettings(clienteId)
    const updated = {
      ...current,
      company_name: companyName,
      sdr_name: sdrName,
      ai_model_mode: aiModelMode,
      system_prompt: systemPrompt,
      whatsapp_access_token: accessToken,
      whatsapp_phone_number_id: phoneNumberId,
      whatsapp_business_account_id: businessAccountId,
      audio_enabled: audioEnabled,
      elevenlabs_api_key: elevenLabsApiKey,
      elevenlabs_voice_id: elevenLabsVoiceId,
      business_hours_start: businessHoursStart,
      business_hours_end: businessHoursEnd,
    }
    sdrService.saveSettings(clienteId, updated)
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 2500)
  }

  return (
    <div className="sdr-root-container">
      <div className="sdr-header-row">
        <div className="sdr-page-title-group">
          <h1>
            <FiSettings style={{ color: 'var(--ink)' }} /> Configurações do SDR
          </h1>
          <p>Personalize os prompts da inteligência artificial, canais de mensageria e integrações.</p>
        </div>

        <div className="sdr-header-actions">
          <button className="sdr-btn-secondary" onClick={() => openWizard && openWizard()}>
            <FiZap style={{ color: 'var(--amber-deep)' }} /> Assistente Inicial
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div
          style={{
            background: '#ecfdf5',
            border: '1px solid #bbf7d0',
            color: '#059669',
            padding: '12px 18px',
            borderRadius: 8,
            marginBottom: 20,
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          ✓ Configurações salvas com sucesso!
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '1px solid var(--line)', paddingBottom: 10 }}>
        {[
          { id: 'agent', label: 'Agente & IA', icon: FiCpu },
          { id: 'whatsapp', label: 'WhatsApp Cloud', icon: FiMessageSquare },
          { id: 'voice', label: 'Voz ElevenLabs', icon: FiMic },
          { id: 'hours', label: 'Horário de Atendimento', icon: FiClock },
        ].map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 16px',
                borderRadius: 8,
                border: 'none',
                background: isActive ? 'var(--ink)' : 'transparent',
                color: isActive ? '#ffffff' : 'var(--ink-soft)',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Icon /> {tab.label}
            </button>
          )
        })}
      </div>

      <form onSubmit={handleSave} className="sdr-panel" style={{ maxWidth: 720 }}>
        {activeTab === 'agent' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label className="sdr-label">Nome da Empresa</label>
                <input
                  className="sdr-input"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Ex: Minha Empresa"
                />
              </div>
              <div>
                <label className="sdr-label">Nome do Agente SDR</label>
                <input
                  className="sdr-input"
                  value={sdrName}
                  onChange={(e) => setSdrName(e.target.value)}
                  placeholder="Ex: Nina"
                />
              </div>
            </div>

            <div>
              <label className="sdr-label">Modelo de Linguagem (IA)</label>
              <select
                className="sdr-input"
                value={aiModelMode}
                onChange={(e) => setAiModelMode(e.target.value)}
              >
                <option value="flash">Gemini Flash (Rápido / Econômico)</option>
                <option value="pro">Gemini Pro 2.5 (Avançado)</option>
                <option value="adaptive">Modo Adaptativo</option>
              </select>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <label className="sdr-label" style={{ margin: 0 }}>System Prompt do Agente</label>
                <button
                  type="button"
                  className="sdr-btn-ghost"
                  style={{ fontSize: 11 }}
                  onClick={() => setSystemPrompt(DEFAULT_NINA_PROMPT)}
                >
                  Restaurar Padrão
                </button>
              </div>
              <textarea
                className="sdr-input"
                rows={10}
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                style={{ fontFamily: 'monospace', fontSize: 12, lineHeight: 1.5 }}
              />
            </div>
          </div>
        )}

        {activeTab === 'whatsapp' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label className="sdr-label">WhatsApp Cloud Access Token</label>
              <input
                type="password"
                className="sdr-input"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder="EAA..."
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label className="sdr-label">Phone Number ID</label>
                <input
                  className="sdr-input"
                  value={phoneNumberId}
                  onChange={(e) => setPhoneNumberId(e.target.value)}
                  placeholder="1084..."
                />
              </div>
              <div>
                <label className="sdr-label">Business Account ID</label>
                <input
                  className="sdr-input"
                  value={businessAccountId}
                  onChange={(e) => setBusinessAccountId(e.target.value)}
                  placeholder="8493..."
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'voice' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--paper)', padding: '14px 18px', borderRadius: 8, border: '1px solid var(--line)' }}>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--ink)', fontSize: 14 }}>Habilitar Respostas em Áudio</div>
                <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>Gera áudios automáticos via ElevenLabs</div>
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
                value={elevenLabsApiKey}
                onChange={(e) => setElevenLabsApiKey(e.target.value)}
                placeholder="sk_..."
              />
            </div>

            <div>
              <label className="sdr-label">Voz da IA</label>
              <select
                className="sdr-input"
                value={elevenLabsVoiceId}
                onChange={(e) => setElevenLabsVoiceId(e.target.value)}
              >
                <option value="33B4UnXyTNbgLmdEDh5P">Keren - Jovem Brasileira (Padrão)</option>
                <option value="9BWtsMINqrJLrRacOk9x">Aria - Expressiva</option>
                <option value="CwhRBWXzGAHq8TQ4Fs17">Roger - Executivo</option>
              </select>
            </div>
          </div>
        )}

        {activeTab === 'hours' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label className="sdr-label">Início do Atendimento</label>
                <input
                  type="time"
                  className="sdr-input"
                  value={businessHoursStart}
                  onChange={(e) => setBusinessHoursStart(e.target.value)}
                />
              </div>
              <div>
                <label className="sdr-label">Término do Atendimento</label>
                <input
                  type="time"
                  className="sdr-input"
                  value={businessHoursEnd}
                  onChange={(e) => setBusinessHoursEnd(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
          <button type="submit" className="sdr-btn-primary">
            <FiSave /> Salvar Alterações
          </button>
        </div>
      </form>
    </div>
  )
}
