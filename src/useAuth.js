import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

// Controla a sessão logada e busca o perfil (papel: mestre ou admin_cliente)
export function useAuth() {
  const [session, setSession] = useState(null)
  const [perfil, setPerfil] = useState(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (data.session) buscarPerfil(data.session.user.id)
      else setCarregando(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, novaSessao) => {
      setSession(novaSessao)
      if (novaSessao) buscarPerfil(novaSessao.user.id)
      else {
        setPerfil(null)
        setCarregando(false)
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  async function buscarPerfil(userId) {
    const { data } = await supabase.from('perfis').select('*').eq('id', userId).single()

    if (data?.papel === 'admin_cliente' && data.cliente_id) {
      const { data: cliente } = await supabase.from('clientes').select('status').eq('id', data.cliente_id).single()
      setPerfil({ ...data, cliente_status: cliente?.status })
    } else {
      setPerfil(data)
    }
    setCarregando(false)
  }

  return { session, perfil, carregando }
}
