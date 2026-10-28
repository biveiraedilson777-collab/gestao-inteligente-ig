import { useCallback, useEffect, useState } from 'react'
import { supabase, mt } from '../lib/supabase'

export const hoje = () => new Date().toLocaleDateString('sv-SE')
export const fmtData = (d) => new Date(d + 'T00:00').toLocaleDateString('pt-MZ') // dia/mês/ano

// Lista + formulário genérico (usado em Alimentação e Transporte)
export default function Registos({ titulo, tabela, campos, linha, valor }) {
  const [lista, setLista] = useState([])
  const [f, setF] = useState({})
  const [erro, setErro] = useState('')

  const carregar = useCallback(async () => {
    const { data, error } = await supabase.from(tabela).select('*')
      .order('data', { ascending: false }).order('criado_em', { ascending: false }).limit(100)
    if (error) setErro(error.message); else setLista(data)
  }, [tabela])
  useEffect(() => { carregar() }, [carregar])

  const val = (c) => f[c.k] ?? (c.tipo === 'date' ? hoje() : '')

  async function adicionar(e) {
    e.preventDefault(); setErro('')
    const row = Object.fromEntries(campos.map((c) => [c.k, c.tipo === 'number' ? Number(val(c)) : val(c)]))
    const { error } = await supabase.from(tabela).insert(row)
    if (error) return setErro(error.message)
    setF({}); carregar()
  }

  return (
    <section className="despesas" aria-label={titulo}>
      <h2>{titulo}</h2>
      <form onSubmit={adicionar} className="linha-form reg-form">
        {campos.map((c) => c.tipo === 'select' ? (
          <select key={c.k} aria-label={c.label} value={val(c)} required
            onChange={(e) => setF({ ...f, [c.k]: e.target.value })}>
            <option value="">{c.label}</option>
            {c.opcoes.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
          </select>
        ) : (
          <input key={c.k} type={c.tipo} aria-label={c.label} placeholder={c.label} required
            min={c.tipo === 'number' ? '0' : undefined} step={c.tipo === 'number' ? 'any' : undefined}
            inputMode={c.tipo === 'number' ? 'decimal' : undefined}
            value={val(c)} onChange={(e) => setF({ ...f, [c.k]: e.target.value })} />
        ))}
        <button className="primario">Adicionar</button>
      </form>
      {erro && <p role="alert" className="erro">{erro}</p>}
      {lista.length === 0 ? <p className="vazio">Sem registos ainda.</p> : (
        <ul>{lista.map((r) => (
          <li key={r.id} className="reg-li">{linha(r).map((c, i) => <span key={i}>{c}</span>)}</li>))}
        </ul>)}
      <p className="total">Total <strong>{mt(lista.reduce((s, r) => s + valor(r), 0))}</strong></p>
    </section>
  )
}
