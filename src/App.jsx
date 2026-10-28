import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import Login from './pages/Login.jsx'
import Painel from './pages/Painel.jsx'

export default function App() {
  const [sessao, setSessao] = useState(undefined)
  const [perfil, setPerfil] = useState(null)
  const [falhou, setFalhou] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSessao(data.session))
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSessao(s))
    return () => data.subscription.unsubscribe()
  }, [])

  // Procura o perfil da empresa. Tenta algumas vezes porque, logo a seguir ao
  // registo, a empresa ainda pode estar a ser criada.
  useEffect(() => {
    if (!sessao) { setPerfil(null); setFalhou(false); return }
    let ativo = true
    ;(async () => {
      setFalhou(false)
      for (let i = 0; i < 8 && ativo; i++) {
        const { data } = await supabase.from('perfis').select('nome, papel, empresas(nome)')
          .eq('user_id', sessao.user.id).maybeSingle()
        if (data) { if (ativo) setPerfil(data); return }
        await new Promise((r) => setTimeout(r, 700))
      }
      if (ativo) setFalhou(true)
    })()
    return () => { ativo = false }
  }, [sessao])

  if (sessao === undefined) return <p className="centro">A carregar…</p>
  if (!sessao) return <Login />
  if (!perfil && falhou) return (
    <main className="centro">
      <p>Não foi possível abrir a empresa. Saia e tente entrar de novo.</p>
      <button className="primario" onClick={() => supabase.auth.signOut()}>Sair</button>
    </main>
  )
  if (!perfil) return <p className="centro">A abrir a sua empresa…</p>
  return <Painel perfil={perfil} />
}
