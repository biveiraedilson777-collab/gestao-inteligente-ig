import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Utilizadores() {
  const [lista, setLista] = useState([])
  const [nome, setNome] = useState('')
  const [usuario, setUsuario] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [ok, setOk] = useState('')

  const carregar = useCallback(async () => {
    const { data } = await supabase.from('perfis').select('user_id,nome,papel').order('nome')
    setLista(data ?? [])
  }, [])
  useEffect(() => { carregar() }, [carregar])

  async function criar(e) {
    e.preventDefault(); setErro(''); setOk('')
    const { error } = await supabase.functions.invoke('criar-funcionario', {
      body: { nome, usuario: usuario.trim().toLowerCase(), senha },
    })
    if (error) {
      let m = 'Não foi possível criar o utilizador.'
      try { m = (await error.context.json()).erro || m } catch { /* mantém a mensagem */ }
      return setErro(m)
    }
    setOk(`Utilizador "${usuario}" criado. Entra com o nome da empresa, o utilizador e a senha.`)
    setNome(''); setUsuario(''); setSenha(''); carregar()
  }

  async function novaSenha(u) {
    const senha = prompt(`Nova senha para ${u.nome} (mínimo 8 caracteres):`)
    if (!senha) return
    setErro(''); setOk('')
    const { error } = await supabase.functions.invoke('redefinir-senha', { body: { user_id: u.user_id, senha } })
    if (error) {
      let m = 'Não foi possível alterar a senha.'
      try { m = (await error.context.json()).erro || m } catch { /* mantém a mensagem */ }
      return setErro(m)
    }
    setOk(`Senha de ${u.nome} alterada.`)
  }

  return (
    <section className="despesas" aria-label="Utilizadores">
      <h2>Utilizadores da empresa</h2>
      <form onSubmit={criar} className="linha-form salario-form">
        <input placeholder="Nome do funcionário" aria-label="Nome" value={nome}
          onChange={(e) => setNome(e.target.value)} required minLength={2} />
        <input placeholder="Utilizador (ex.: ana)" aria-label="Utilizador" value={usuario}
          onChange={(e) => setUsuario(e.target.value)} required pattern="[a-zA-Z0-9]{2,20}" />
        <input type="password" placeholder="Senha (mín. 8)" aria-label="Senha" value={senha}
          onChange={(e) => setSenha(e.target.value)} required minLength={8} autoComplete="new-password" />
        <button className="primario">Criar utilizador</button>
      </form>
      {erro && <p role="alert" className="erro">{erro}</p>}
      {ok && <p role="status">{ok}</p>}
      <ul>{lista.map((u) => (
        <li key={u.user_id} style={{ gridTemplateColumns: '1fr auto auto', alignItems: 'center' }}>
          <span>{u.nome}</span><span>{u.papel === 'dono' ? 'Dono' : 'Funcionário'}</span>
          {u.papel === 'funcionario' ? <button onClick={() => novaSenha(u)}>Nova senha</button> : <span />}
        </li>))}
      </ul>
    </section>
  )
}
