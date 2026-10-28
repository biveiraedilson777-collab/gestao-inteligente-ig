import { useCallback, useEffect, useState } from 'react'
import { supabase, mt } from '../lib/supabase'
import { hoje, fmtData } from '../components/Registos.jsx'

export default function Emprestimos() {
  const [lista, setLista] = useState([])
  const [f, setF] = useState({ nome: '', contacto: '', valor: '', prazo: '' })
  const [ver, setVer] = useState('pendentes')
  const [erro, setErro] = useState('')

  const carregar = useCallback(async () => {
    const { data, error } = await supabase.from('emprestimos').select('*').order('prazo')
    if (error) setErro(error.message); else setLista(data)
  }, [])
  useEffect(() => { carregar() }, [carregar])

  async function adicionar(e) {
    e.preventDefault(); setErro('')
    const { error } = await supabase.from('emprestimos').insert({
      nome: f.nome.trim(), contacto: f.contacto.trim(), valor_pendente: Number(f.valor), prazo: f.prazo })
    if (error) return setErro(error.message)
    setF({ nome: '', contacto: '', valor: '', prazo: '' }); carregar()
  }

  async function confirmar(e) {
    if (!confirm(`Confirmar que ${e.nome} pagou ${mt(e.valor_pendente)}?`)) return
    const { error } = await supabase.from('emprestimos').update({ pago: true, pago_em: hoje() }).eq('id', e.id)
    if (error) setErro(error.message); else carregar()
  }

  const mostrados = lista.filter((e) => ver === 'todos' || !e.pago)
  const pendente = lista.filter((e) => !e.pago).reduce((s, e) => s + Number(e.valor_pendente), 0)
  const set = (k) => (ev) => setF({ ...f, [k]: ev.target.value })

  return (
    <section className="despesas" aria-label="Empréstimos">
      <h2>Empréstimos a clientes</h2>
      <form onSubmit={adicionar} className="linha-form reg-form nao-imprimir">
        <input placeholder="Nome do cliente" aria-label="Nome" value={f.nome} onChange={set('nome')} required minLength={2} />
        <input placeholder="Contacto" aria-label="Contacto" inputMode="tel" value={f.contacto} onChange={set('contacto')} required minLength={3} />
        <input type="number" min="0.01" step="any" inputMode="decimal" placeholder="Valor pendente"
          aria-label="Valor pendente" value={f.valor} onChange={set('valor')} required />
        <input type="date" aria-label="Prazo de pagamento" value={f.prazo} onChange={set('prazo')} required />
        <button className="primario">Adicionar</button>
      </form>
      {erro && <p role="alert" className="erro">{erro}</p>}
      <div className="abas nao-imprimir">
        <button className={ver === 'pendentes' ? 'ativa' : ''} onClick={() => setVer('pendentes')}>Pendentes</button>
        <button className={ver === 'todos' ? 'ativa' : ''} onClick={() => setVer('todos')}>Todos</button>
      </div>
      <p className="periodo">Lista de empréstimos ({ver}) · {fmtData(hoje())}</p>
      {mostrados.length === 0 ? <p className="vazio">Nenhum empréstimo nesta lista.</p> : (
        <div className="tabela"><table>
          <thead><tr><th>Nome</th><th>Contacto</th><th>Valor</th><th>Prazo</th><th>Estado</th></tr></thead>
          <tbody>{mostrados.map((e) => (
            <tr key={e.id} className={!e.pago && e.prazo < hoje() ? 'atrasado' : ''}>
              <td>{e.nome}</td><td>{e.contacto}</td><td>{mt(e.valor_pendente)}</td><td>{fmtData(e.prazo)}</td>
              <td>{e.pago ? '✓ Pago' : (
                <>{e.prazo < hoje() ? 'Em atraso ' : 'Pendente '}
                  <button className="nao-imprimir" onClick={() => confirmar(e)}>Confirmar pagamento</button></>)}</td>
            </tr>))}
          </tbody></table></div>)}
      <p className="total">Total pendente <strong>{mt(pendente)}</strong></p>
      <div className="linha-form nao-imprimir"><button onClick={() => window.print()}>Baixar PDF com os nomes</button></div>
    </section>
  )
}
