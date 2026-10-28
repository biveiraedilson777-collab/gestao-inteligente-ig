import { useEffect, useState } from 'react'
import { supabase, mt } from '../lib/supabase'

const iso = (d) => d.toLocaleDateString('sv-SE')
function intervalo(p) {
  const h = new Date(), ini = new Date(h)
  if (p === 'semana') ini.setDate(h.getDate() - ((h.getDay() + 6) % 7))
  if (p === 'mes') ini.setDate(1)
  return [iso(ini), iso(h)]
}
const PERIODOS = [['hoje', 'Hoje'], ['semana', 'Semanal'], ['mes', 'Mensal'], ['custom', 'Personalizado']]

export default function Relatorios() {
  const [per, setPer] = useState('hoje')
  const [de, setDe] = useState(iso(new Date()))
  const [ate, setAte] = useState(iso(new Date()))
  const [tipo, setTipo] = useState('todos')
  const [bebida, setBebida] = useState('')
  const [movs, setMovs] = useState([])
  const [desp, setDesp] = useState([])
  const [al, setAl] = useState([])
  const [tr, setTr] = useState([])
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (per !== 'custom') { const [a, b] = intervalo(per); setDe(a); setAte(b) }
  }, [per])

  useEffect(() => {
    (async () => {
      const [m, d, a, t] = await Promise.all([
        supabase.from('movimentos').select('id,tipo,quantidade,preco_unitario,data,produtos(nome)')
          .gte('data', de).lte('data', ate).order('data'),
        supabase.from('despesas').select('id,descricao,valor,data')
          .gte('data', de).lte('data', ate).order('data'),
        supabase.from('alimentacao').select('id,data,turno,quantidade,preco_unitario')
          .gte('data', de).lte('data', ate).order('data'),
        supabase.from('transporte').select('id,data,preco,quantidade_produtos')
          .gte('data', de).lte('data', ate).order('data'),
      ])
      const e = m.error || d.error || a.error || t.error
      if (e) return setErro(e.message)
      setErro(''); setMovs(m.data); setDesp(d.data); setAl(a.data); setTr(t.data)
    })()
  }, [de, ate])

  const q = bebida.trim().toLowerCase()
  const linhas = [
    ...movs.filter((m) => (tipo === 'todos' || tipo === m.tipo) &&
      (!q || m.produtos?.nome.toLowerCase().includes(q)))
      .map((m) => ({ id: m.id, data: m.data, tipo: m.tipo === 'stock' ? 'Stock' : 'Levantamento',
        desc: m.produtos?.nome, qtd: m.quantidade, preco: m.preco_unitario, total: m.quantidade * m.preco_unitario })),
    ...(!q && (tipo === 'todos' || tipo === 'despesas') ? desp.map((d) => ({
      id: d.id, data: d.data, tipo: 'Despesa', desc: d.descricao, qtd: '', preco: '', total: Number(d.valor) })) : []),
    ...(!q && (tipo === 'todos' || tipo === 'alimentacao') ? al.map((r) => ({
      id: r.id, data: r.data, tipo: 'Alimentação', desc: { manha: 'Manhã', tarde: 'Tarde', noite: 'Noite' }[r.turno],
      qtd: r.quantidade, preco: r.preco_unitario, total: r.quantidade * r.preco_unitario })) : []),
    ...(!q && (tipo === 'todos' || tipo === 'transporte') ? tr.map((r) => ({
      id: r.id, data: r.data, tipo: 'Transporte', desc: `${r.quantidade_produtos} produtos`,
      qtd: '', preco: '', total: Number(r.preco) })) : []),
  ].sort((a, b) => a.data.localeCompare(b.data))

  const soma = (t) => linhas.filter((l) => l.tipo === t).reduce((s, l) => s + l.total, 0)

  function baixarCsv() {
    const cab = ['Data', 'Tipo', 'Descrição', 'Qtd', 'Preço un.', 'Total']
    const txt = [cab, ...linhas.map((l) => [l.data, l.tipo, l.desc, l.qtd, l.preco, l.total])]
      .map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(';')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob(['\ufeff' + txt], { type: 'text/csv;charset=utf-8' }))
    a.download = `relatorio-${de}_${ate}.csv`; a.click()
  }

  return (
    <section className="despesas" aria-label="Relatórios">
      <h2>Relatórios</h2>
      <div className="abas nao-imprimir" style={{ display: 'flex', flexWrap: 'wrap' }}>
        {PERIODOS.map(([k, t]) => (
          <button key={k} className={per === k ? 'ativa' : ''} onClick={() => setPer(k)}>{t}</button>))}
      </div>
      <div className="filtros nao-imprimir">
        <label>De <input type="date" value={de} disabled={per !== 'custom'} onChange={(e) => setDe(e.target.value)} /></label>
        <label>Até <input type="date" value={ate} disabled={per !== 'custom'} onChange={(e) => setAte(e.target.value)} /></label>
        <label>Tipo
          <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="todos">Tudo</option><option value="stock">Stock</option>
            <option value="levantamento">Levantamento</option><option value="despesas">Despesas</option>
            <option value="alimentacao">Alimentação</option><option value="transporte">Transporte</option>
          </select></label>
        <label>Bebida <input value={bebida} onChange={(e) => setBebida(e.target.value)} placeholder="Todas" /></label>
      </div>
      <p className="periodo">Período: {de} a {ate}</p>
      {erro && <p role="alert" className="erro">{erro}</p>}
      <div className="resumo">
        <span>Stock <strong>{mt(soma('Stock'))}</strong></span>
        <span>Levantamento <strong>{mt(soma('Levantamento'))}</strong></span>
        <span>Despesas <strong>{mt(soma('Despesa'))}</strong></span>
        <span>Alimentação <strong>{mt(soma('Alimentação'))}</strong></span>
        <span>Transporte <strong>{mt(soma('Transporte'))}</strong></span>
      </div>
      {linhas.length === 0 ? <p className="vazio">Sem registos neste período. Mude as datas ou os filtros.</p> : (
        <div className="tabela"><table>
          <thead><tr><th>Data</th><th>Tipo</th><th>Descrição</th><th>Qtd</th><th>Preço un.</th><th>Total</th></tr></thead>
          <tbody>{linhas.map((l) => (
            <tr key={l.id}><td>{l.data}</td><td>{l.tipo}</td><td>{l.desc}</td><td>{l.qtd}</td>
              <td>{l.preco !== '' && mt(l.preco)}</td><td>{mt(l.total)}</td></tr>))}
          </tbody></table></div>)}
      <div className="linha-form nao-imprimir" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <button onClick={() => window.print()}>Exportar PDF</button>
        <button onClick={baixarCsv}>Baixar Excel (CSV)</button>
      </div>
    </section>
  )
}
