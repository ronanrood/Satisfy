import { DEFAULT_NINA_PROMPT } from './defaultSDRPrompt'

const DEFAULT_STAGES = [
  { id: 'lead', name: 'Novo Lead', color: '#06b6d4' },
  { id: 'qualificado', name: 'Qualificado', color: '#3b82f6' },
  { id: 'proposta', name: 'Proposta Enviada', color: '#8b5cf6' },
  { id: 'negociacao', name: 'Negociação', color: '#f59e0b' },
  { id: 'fechado', name: 'Fechado Ganho', color: '#10b981' },
  { id: 'perdido', name: 'Perdido', color: '#ef4444' },
]

const INITIAL_DEALS = [
  {
    id: 'deal-1',
    title: 'Implementação IA Comercial',
    contact_name: 'Lucas Mendonça',
    company: 'TechBrasil Soluções',
    stage_id: 'lead',
    value: 12500,
    phone: '+55 11 98842-1209',
    tags: ['Inbound', 'WhatsApp'],
    updated_at: 'Hoje, 10:25',
  },
  {
    id: 'deal-2',
    title: 'Automação Atendimento SDR',
    contact_name: 'Camila Albuquerque',
    company: 'Albuquerque Imóveis',
    stage_id: 'qualificado',
    value: 8400,
    phone: '+55 21 99120-4491',
    tags: ['Imobiliária', 'Prioritário'],
    updated_at: 'Hoje, 09:14',
  },
  {
    id: 'deal-3',
    title: 'Plataforma Completa SDR + Voz',
    contact_name: 'Dr. Roberto Freire',
    company: 'Clínica Odonto Vida',
    stage_id: 'proposta',
    value: 19800,
    phone: '+55 31 98765-4321',
    tags: ['Saúde', 'ElevenLabs'],
    updated_at: 'Ontem, 16:40',
  },
  {
    id: 'deal-4',
    title: 'Piloto 3 Totens + IA WhatsApp',
    contact_name: 'Fernanda Diniz',
    company: 'Diniz Redes de Varejo',
    stage_id: 'negociacao',
    value: 34000,
    phone: '+55 41 97788-9900',
    tags: ['Varejo', 'Enterprise'],
    updated_at: 'Ontem, 14:10',
  },
  {
    id: 'deal-5',
    title: 'Licença Anual SDR Pro',
    contact_name: 'Marcos Vinícius',
    company: 'MV Logística',
    stage_id: 'fechado',
    value: 28000,
    phone: '+55 11 96543-2198',
    tags: ['Fechado', 'Anual'],
    updated_at: '05/09/2026',
  },
]

const INITIAL_CONTACTS = [
  {
    id: 'cont-1',
    name: 'Lucas Mendonça',
    company: 'TechBrasil Soluções',
    phone: '+55 11 98842-1209',
    email: 'lucas@techbrasil.com.br',
    status: 'Em Atendimento IA',
    stage: 'Novo Lead',
    deals_count: 1,
    last_interaction: 'Há 12 min',
  },
  {
    id: 'cont-2',
    name: 'Camila Albuquerque',
    company: 'Albuquerque Imóveis',
    phone: '+55 21 99120-4491',
    email: 'camila@albuquerque.com.br',
    status: 'Qualificado',
    stage: 'Qualificado',
    deals_count: 1,
    last_interaction: 'Há 45 min',
  },
  {
    id: 'cont-3',
    name: 'Dr. Roberto Freire',
    company: 'Clínica Odonto Vida',
    phone: '+55 31 98765-4321',
    email: 'roberto@odontovida.com.br',
    status: 'Aguardando Resposta',
    stage: 'Proposta Enviada',
    deals_count: 1,
    last_interaction: 'Ontem',
  },
  {
    id: 'cont-4',
    name: 'Fernanda Diniz',
    company: 'Diniz Redes de Varejo',
    phone: '+55 41 97788-9900',
    email: 'fernanda@grupodiniz.com.br',
    status: 'Reunião Agendada',
    stage: 'Negociação',
    deals_count: 1,
    last_interaction: 'Ontem',
  },
]

const INITIAL_CONVERSATIONS = [
  {
    id: 'conv-1',
    contact_name: 'Lucas Mendonça',
    phone: '+55 11 98842-1209',
    avatar: 'LM',
    unread: 1,
    status: 'ai_active',
    last_message: 'Perfeito! Gostaria de agendar uma reunião amanhã às 14h para vermos a demonstração?',
    last_time: '10:25',
    messages: [
      { id: 1, sender: 'lead', text: 'Olá, vi o anúncio de vocês sobre automação de SDR com inteligência artificial.', time: '10:20' },
      { id: 2, sender: 'ai', text: 'Olá Lucas! Seja muito bem-vindo. Sou a IA de atendimento aqui. Que ótimo seu interesse! Você já tem equipe de vendas hoje ou está estruturando seu primeiro canal?', time: '10:21' },
      { id: 3, sender: 'lead', text: 'Já temos 3 vendedores, mas perdemos muito tempo qualificando os leads que chegam pelo WhatsApp.', time: '10:23' },
      { id: 4, sender: 'ai', text: 'Compreendo perfeitamente! Esse é justamente o maior gargalo. Nossa IA atende em menos de 10 segundos, qualifica e já entrega a reunião agendada na agenda do seu closer.', time: '10:24' },
      { id: 5, sender: 'ai', text: 'Perfeito! Gostaria de agendar uma demonstração amanhã às 14h para vermos isso funcionando na prática?', time: '10:25' },
    ],
  },
  {
    id: 'conv-2',
    contact_name: 'Camila Albuquerque',
    phone: '+55 21 99120-4491',
    avatar: 'CA',
    unread: 0,
    status: 'ai_active',
    last_message: 'Confirmado! Reunião adicionada à sua agenda para quinta-feira.',
    last_time: '09:14',
    messages: [
      { id: 1, sender: 'lead', text: 'Bom dia, gostaria de saber os valores do plano para imobiliárias.', time: '09:05' },
      { id: 2, sender: 'ai', text: 'Bom dia, Camila! Para imobiliárias temos modelos pré-treinados com simulação e agendamento de visitas.', time: '09:08' },
      { id: 3, sender: 'lead', text: 'Nossa, que rápido! Podemos agendar uma apresentação?', time: '09:10' },
      { id: 4, sender: 'ai', text: 'Confirmado! Reunião adicionada à sua agenda para quinta-feira.', time: '09:14' },
    ],
  },
  {
    id: 'conv-3',
    contact_name: 'Dr. Roberto Freire',
    phone: '+55 31 98765-4321',
    avatar: 'RF',
    unread: 0,
    status: 'human_takeover',
    last_message: 'Enviei a proposta detalhada em anexo. Aguardo seu retorno.',
    last_time: 'Ontem',
    messages: [
      { id: 1, sender: 'lead', text: 'Pode me enviar o contrato?', time: '16:30' },
      { id: 2, sender: 'human', text: 'Enviei a proposta detalhada em anexo. Aguardo seu retorno.', time: '16:40' },
    ],
  },
]

const INITIAL_APPOINTMENTS = [
  {
    id: 'app-1',
    title: 'Demonstração SDR + IA WhatsApp',
    contact_name: 'Lucas Mendonça',
    company: 'TechBrasil Soluções',
    date: 'Amanhã, 14:00',
    responsible: 'Pedro (SDR Closer)',
    status: 'Confirmado',
    link: 'https://meet.google.com/xyz-demo-sdr',
  },
  {
    id: 'app-2',
    title: 'Alinhamento Comercial Imobiliária',
    contact_name: 'Camila Albuquerque',
    company: 'Albuquerque Imóveis',
    date: 'Quinta-feira, 10:30',
    responsible: 'Ronan (Gestor)',
    status: 'Confirmado',
    link: 'https://meet.google.com/abc-sdr-reuniao',
  },
  {
    id: 'app-3',
    title: 'Apresentação Contrato Enterprise',
    contact_name: 'Fernanda Diniz',
    company: 'Diniz Redes de Varejo',
    date: 'Sexta-feira, 16:00',
    responsible: 'Pedro (SDR Closer)',
    status: 'Pendente',
    link: 'https://meet.google.com/ent-sdr-closing',
  },
]

const INITIAL_TEAM = [
  {
    id: 'team-1',
    name: 'Pedro Silva',
    email: 'pedro@empresa.com.br',
    role: 'Administrador / Closer',
    status: 'online',
    deals_closed: 14,
    conversion_rate: '28%',
  },
  {
    id: 'team-2',
    name: 'Nina (Agente IA)',
    email: 'sdr-ia@satisfy.com.br',
    role: 'SDR Virtual 24/7',
    status: 'online',
    deals_closed: 42,
    conversion_rate: '36%',
  },
  {
    id: 'team-3',
    name: 'Ronan Castro',
    email: 'ronan@locarti.com.br',
    role: 'Gestor Comercial',
    status: 'online',
    deals_closed: 22,
    conversion_rate: '31%',
  },
]

export const sdrService = {
  // Settings
  getSettings(clienteId) {
    const key = `sdr_settings_${clienteId}`
    const stored = localStorage.getItem(key)
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch (e) {
        console.error('Error parsing sdr_settings', e)
      }
    }
    return {
      is_configured: false,
      company_name: '',
      sdr_name: 'Nina',
      whatsapp_access_token: '',
      whatsapp_phone_number_id: '',
      whatsapp_business_account_id: '',
      whatsapp_verify_token: 'satisfy-sdr-' + Math.random().toString(36).substring(2, 10),
      system_prompt: DEFAULT_NINA_PROMPT,
      ai_model_mode: 'flash',
      elevenlabs_api_key: '',
      elevenlabs_voice_id: '33B4UnXyTNbgLmdEDh5P',
      elevenlabs_model: 'eleven_turbo_v2_5',
      audio_enabled: false,
      timezone: 'America/Sao_Paulo',
      business_hours_start: '09:00',
      business_hours_end: '18:00',
      business_days: [1, 2, 3, 4, 5],
    }
  },

  saveSettings(clienteId, settings) {
    const key = `sdr_settings_${clienteId}`
    localStorage.setItem(key, JSON.stringify(settings))
  },

  // Pipeline Deals
  getDeals(clienteId) {
    const key = `sdr_deals_${clienteId}`
    const stored = localStorage.getItem(key)
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch (e) {
        console.error(e)
      }
    }
    return INITIAL_DEALS
  },

  saveDeals(clienteId, deals) {
    localStorage.setItem(`sdr_deals_${clienteId}`, JSON.stringify(deals))
  },

  getStages() {
    return DEFAULT_STAGES
  },

  // Contacts
  getContacts(clienteId) {
    const key = `sdr_contacts_${clienteId}`
    const stored = localStorage.getItem(key)
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch (e) {
        console.error(e)
      }
    }
    return INITIAL_CONTACTS
  },

  saveContacts(clienteId, contacts) {
    localStorage.setItem(`sdr_contacts_${clienteId}`, JSON.stringify(contacts))
  },

  // Conversations
  getConversations(clienteId) {
    const key = `sdr_conversations_${clienteId}`
    const stored = localStorage.getItem(key)
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch (e) {
        console.error(e)
      }
    }
    return INITIAL_CONVERSATIONS
  },

  saveConversations(clienteId, convs) {
    localStorage.setItem(`sdr_conversations_${clienteId}`, JSON.stringify(convs))
  },

  // Appointments
  getAppointments(clienteId) {
    const key = `sdr_appointments_${clienteId}`
    const stored = localStorage.getItem(key)
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch (e) {
        console.error(e)
      }
    }
    return INITIAL_APPOINTMENTS
  },

  saveAppointments(clienteId, appointments) {
    localStorage.setItem(`sdr_appointments_${clienteId}`, JSON.stringify(appointments))
  },

  // Team
  getTeam(clienteId) {
    const key = `sdr_team_${clienteId}`
    const stored = localStorage.getItem(key)
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch (e) {
        console.error(e)
      }
    }
    return INITIAL_TEAM
  },

  saveTeam(clienteId, team) {
    localStorage.setItem(`sdr_team_${clienteId}`, JSON.stringify(team))
  },
}
