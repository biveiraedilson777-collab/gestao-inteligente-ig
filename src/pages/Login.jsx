import { useState } from 'react'
import Logo from '../components/Logo.jsx'
import { supabase, emailDaEmpresa, slugify } from '../lib/supabase'

export default function Login() {
  const [novo, setNovo] = useState(false)
  const [empresa, setEmpresa] = useState('')
  const [usuario, setUsuario] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [ocupado, setOcupado] = useState(false)

  async function enviar(e) {
    e.preventDefault()
    setErro(''); setOcupado(true)
    const email = emailDaEmpresa(empresa, novo ? '' : usuario)
    if (novo) {
      const { error } = await supabase.auth.signUp({ email, password: senha })
      if (error) { setOcupado(false); return setErro('Não foi possível criar a conta: ' + error.message) }
      const { error: e2 } = await supabase.rpc('registar_empresa', {
        p_nome: empresa, p_slug: slugify(empresa),
      })
      if (e2) setErro(e2.message.includes('duplicate')
        ? 'Esse nome de empresa já está em uso. Escolha outro.'
        : 'Não foi possível criar a empresa: ' + e2.message)
      else await supabase.auth.refreshSession() // recarrega o perfil e abre o painel
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
      if (error) setErro('Nome da empresa ou senha incorretos.')
    }
    setOcupado(false)
  }

  return (
    <main className="login">
      <h1><Logo tamanho={56} /></h1>
      <p className="sub">{novo ? 'Crie a conta da sua empresa' : 'Entre na sua empresa'}</p>
      <form onSubmit={enviar}>
        <label htmlFor="empresa">Nome da empresa</label>
        <input id="empresa" value={empresa} onChange={(e) => setEmpresa(e.target.value)}
          required minLength={2} autoComplete="username" />
        {!novo && (<>
          <label htmlFor="usuario">Utilizador (vazio se for o dono)</label>
          <input id="usuario" value={usuario} onChange={(e) => setUsuario(e.target.value)}
            autoCapitalize="none" autoComplete="off" />
        </>)}
        <label htmlFor="senha">Senha</label>
        <input id="senha" type="password" value={senha} onChange={(e) => setSenha(e.target.value)}
          required minLength={8} autoComplete={novo ? 'new-password' : 'current-password'} />
        {erro && <p role="alert" className="erro">{erro}</p>}
        <button className="primario" disabled={ocupado}>{novo ? 'Criar empresa' : 'Entrar'}</button>
      </form>
      <button className="link" onClick={() => { setNovo(!novo); setErro('') }}>
        {novo ? 'Já tenho conta' : 'Registar a minha empresa'}
      </button>
    </main>
  )
}
