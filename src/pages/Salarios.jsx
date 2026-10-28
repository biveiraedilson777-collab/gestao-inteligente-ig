import { useCallback, useEffect, useState } from 'react'
import { supabase, mt } from '../lib/supabase'

export default function Salarios() {
  const [lista, setLista] = useState([])
  const [nome, setNome] = useState('')
  const [salario, setSalario] = useState('')
  const [dia, setDia] = useState('')
  const [erro, setErro] = useState('')

  const carregar = useCallback(async () => {
    const { data, error } = await supabase.from('funcionarios')
      .select('id,nome,salario,dia_pagamento').order('nome')
    if (error) setErro(error.message); else setLista(data)
  }, [])
  useEffect(() => { carregar() }, [carregar])

  async function adicionar(e) {
    e.preventDefault(); setErro('')
    const { error } = await supabase.from('funcionarios')
      .insert({ nome: nome.trim(), salario: Number(salario), dia_pagamento: Number(dia) })
    if (error) return setErro(error.message)
    setNome(''); setSalario(''); setDia(''); carregar()
  }

  async function remover(id) {
    if (!confirm('Remover este funcionário?')) return
    const { error } = await supabase.from('funcionarios').delete().eq('id', id)
    if (error) setErro(error.message); else carregar()
  }

  return (
    <section className="despesas" aria-label="Salários">
      <h2>Salários dos funcionários</h2>
      <form onSubmit={adicionar} className="linha-form salario-form">
        <input placeholder="Nome do funcionário" aria-label="Nome" value={nome}
          onChange={(e) => setNome(e.target.value)} required minLength={2} />
        <input type="number" min="0" step="any" inputMode="decimal" placeholder="Salário"
          aria-label="Salário" value={salario} onChange={(e) => setSalario(e.target.value)} required />
        <input type="number" min="1" max="31" inputMode="numeric" placeholder="Dia do salário"
          aria-label="Dia do salário" value={dia} onChange={(e) => setDia(e.target.value)} required />
        <button className="primario">Adicionar</button>
      </form>
      {erro && <p role="alert" className="erro">{erro}</p>}
      {lista.length === 0 ? <p className="vazio">Nenhum funcionário registado.</p> : (
        <ul>{lista.map((f) => (
          <li key={f.id} className="sal-li">
            <span>{f.nome}</span>
            <span>{mt(f.salario)} · dia {f.dia_pagamento}</span>
            <button onClick={() => remover(f.id)} aria-label={`Remover ${f.nome}`}>Remover</button>
          </li>))}
        </ul>)}
      <p className="total">Total mensal <strong>{mt(lista.reduce((s, f) => s + Number(f.salario), 0))}</strong></p>
    </section>
  )
}
