import { useState, useEffect, useRef } from 'react'
import { useOutletContext } from 'react-router-dom'
import {
  FiSend,
  FiUser,
  FiPhone,
  FiCpu,
  FiSearch,
  FiCheck,
  FiPause,
  FiPlay,
  FiTag,
  FiCalendar,
} from 'react-icons/fi'
import { sdrService } from '../../services/sdrService'

export default function SDRChatPage() {
  const { clienteId } = useOutletContext()
  const [conversations, setConversations] = useState([])
  const [activeConvId, setActiveConvId] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [inputText, setInputText] = useState('')
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (clienteId) {
      const list = sdrService.getConversations(clienteId)
      setConversations(list)
      if (list.length > 0 && !activeConvId) {
        setActiveConvId(list[0].id)
      }
    }
  }, [clienteId])

  const activeConv = conversations.find((c) => c.id === activeConvId) || conversations[0]

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeConv?.messages])

  const handleSendMessage = (e) => {
    e.preventDefault()
    if (!inputText.trim() || !activeConv) return

    const newMsg = {
      id: Date.now(),
      sender: 'human',
      text: inputText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    const updated = conversations.map((c) => {
      if (c.id === activeConv.id) {
        return {
          ...c,
          last_message: inputText,
          last_time: newMsg.time,
          messages: [...(c.messages || []), newMsg],
        }
      }
      return c
    })

    setConversations(updated)
    sdrService.saveConversations(clienteId, updated)
    setInputText('')

    // Simulate AI response after 1.5s if AI is active
    if (activeConv.status === 'ai_active') {
      setTimeout(() => {
        const aiMsg = {
          id: Date.now() + 1,
          sender: 'ai',
          text: 'Entendido! Estou registrando essas observações no atendimento e dando andamento.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
        setConversations((prev) => {
          const u = prev.map((conv) => {
            if (conv.id === activeConv.id) {
              return {
                ...conv,
                last_message: aiMsg.text,
                last_time: aiMsg.time,
                messages: [...conv.messages, aiMsg],
              }
            }
            return conv
          })
          sdrService.saveConversations(clienteId, u)
          return u
        })
      }, 1500)
    }
  }

  const toggleAiMode = () => {
    if (!activeConv) return
    const newStatus = activeConv.status === 'ai_active' ? 'human_takeover' : 'ai_active'
    const updated = conversations.map((c) =>
      c.id === activeConv.id ? { ...c, status: newStatus } : c
    )
    setConversations(updated)
    sdrService.saveConversations(clienteId, updated)
  }

  const filteredConvs = conversations.filter(
    (c) =>
      c.contact_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm)
  )

  return (
    <div className="sdr-root-container">
      <div className="sdr-header-row" style={{ marginBottom: 16 }}>
        <div className="sdr-page-title-group">
          <h1>
            <span style={{ color: '#06b6d4' }}>💬</span> Chat Ao Vivo (WhatsApp)
          </h1>
          <p>Acompanhe em tempo real as conversas do seu SDR virtual com intervenção manual instantânea.</p>
        </div>
      </div>

      <div className="sdr-chat-layout">
        {/* Left: Conversations List */}
        <div className="sdr-chat-sidebar">
          <div className="sdr-chat-search">
            <div style={{ position: 'relative' }}>
              <input
                className="sdr-input"
                placeholder="Buscar conversa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: 34, fontSize: 13 }}
              />
              <FiSearch style={{ position: 'absolute', left: 10, top: 12, color: '#64748b' }} />
            </div>
          </div>

          <div className="sdr-conv-list">
            {filteredConvs.map((c) => (
              <div
                key={c.id}
                className={`sdr-conv-item ${c.id === activeConv?.id ? 'active' : ''}`}
                onClick={() => setActiveConvId(c.id)}
              >
                <div className="sdr-conv-avatar">{c.avatar || c.contact_name.substring(0, 2).toUpperCase()}</div>
                <div className="sdr-conv-info">
                  <div className="sdr-conv-name-row">
                    <span className="sdr-conv-name">{c.contact_name}</span>
                    <span className="sdr-conv-time">{c.last_time}</span>
                  </div>
                  <div className="sdr-conv-preview">{c.last_message}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Center: Messages Thread */}
        <div className="sdr-chat-main">
          {activeConv ? (
            <>
              <div className="sdr-chat-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className="sdr-conv-avatar" style={{ width: 36, height: 36, fontSize: 12 }}>
                    {activeConv.avatar}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: '#ffffff', fontSize: 14 }}>
                      {activeConv.contact_name}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>{activeConv.phone}</div>
                  </div>
                </div>

                <div>
                  <button
                    className="sdr-btn-secondary"
                    onClick={toggleAiMode}
                    style={{ fontSize: 12, padding: '6px 12px' }}
                  >
                    {activeConv.status === 'ai_active' ? (
                      <>
                        <FiPause style={{ color: '#f59e0b' }} /> Pausar IA (Assumir)
                      </>
                    ) : (
                      <>
                        <FiPlay style={{ color: '#10b981' }} /> Reativar IA
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="sdr-chat-messages">
                {activeConv.messages?.map((msg) => (
                  <div key={msg.id} className={`sdr-bubble ${msg.sender}`}>
                    {msg.sender === 'ai' && (
                      <div className="sdr-bubble-badge" style={{ color: '#bae6fd' }}>
                        <FiCpu /> SDR Virtual (Nina)
                      </div>
                    )}
                    {msg.sender === 'human' && (
                      <div className="sdr-bubble-badge" style={{ color: '#cbd5e1' }}>
                        <FiUser /> Atendente Humano
                      </div>
                    )}
                    <div>{msg.text}</div>
                    <div className="sdr-bubble-time">{msg.time}</div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSendMessage} className="sdr-chat-input-area">
                <input
                  className="sdr-input"
                  placeholder={
                    activeConv.status === 'ai_active'
                      ? 'Digite uma mensagem (A IA responderá na sequência)...'
                      : 'Você está no controle manual deste chat...'
                  }
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                />
                <button type="submit" className="sdr-btn-primary" style={{ padding: '9px 16px' }}>
                  <FiSend />
                </button>
              </form>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--ink-soft)' }}>
              Selecione uma conversa para começar
            </div>
          )}
        </div>

        {/* Right: Lead Details Panel */}
        <div className="sdr-chat-info">
          {activeConv ? (
            <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <h4 style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-soft)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Dados do Lead
              </h4>

              <div style={{ background: '#ffffff', padding: 14, borderRadius: 8, border: '1px solid var(--line)' }}>
                <div style={{ fontSize: 11, color: 'var(--ink-soft)' }}>NOME</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', marginBottom: 8 }}>{activeConv.contact_name}</div>

                <div style={{ fontSize: 11, color: 'var(--ink-soft)' }}>WHATSAPP</div>
                <div style={{ fontSize: 13, color: 'var(--teal)', marginBottom: 8, fontWeight: 600 }}>{activeConv.phone}</div>

                <div style={{ fontSize: 11, color: 'var(--ink-soft)' }}>STATUS DO ATENDIMENTO</div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, marginTop: 4 }}>
                  <span
                    className="sdr-status-dot"
                    style={{ background: activeConv.status === 'ai_active' ? '#10b981' : '#f59e0b' }}
                  />
                  <span style={{ color: activeConv.status === 'ai_active' ? '#059669' : '#d97706', fontWeight: 600 }}>
                    {activeConv.status === 'ai_active' ? 'IA Ativa (Respondendo)' : 'Pausado / Atendimento Humano'}
                  </span>
                </div>
              </div>

              <div style={{ background: '#ffffff', padding: 14, borderRadius: 8, border: '1px solid var(--line)' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FiTag style={{ color: 'var(--ink-soft)' }} /> Tags do Lead
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <span className="sdr-deal-tag">WhatsApp Cloud</span>
                  <span className="sdr-deal-tag">Interessado</span>
                  <span className="sdr-deal-tag">Demonstração</span>
                </div>
              </div>

              <div style={{ background: '#ffffff', padding: 14, borderRadius: 8, border: '1px solid var(--line)' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FiCalendar style={{ color: 'var(--ink-soft)' }} /> Próxima Ação
                </div>
                <p style={{ fontSize: 12, color: 'var(--ink-soft)', margin: 0 }}>
                  Apresentação de demonstração agendada pela IA.
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
