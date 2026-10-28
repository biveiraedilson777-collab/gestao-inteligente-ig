import { useCallback, useEffect, useState } from 'react'
import { supabase, mt } from '../lib/supabase'
import Salarios from './Salarios.jsx'
import Relatorios from './Relatorios.jsx'
import Utilizadores from './Utilizadores.jsx'
import Emprestimos from './Emprestimos.jsx'
import Alimentacao from './Alimentacao.jsx'
import Transporte from './Transporte.jsx'
import Logo from '../components/Logo.jsx'
import Grafico from '../components/Grafico.jsx'

function Coluna({ tipo, titulo, itens, nomes, produtos, onSalvar }) {
  const [nome, setNome] = useState('')
  const [qtd, setQtd] = useState('')
  const [preco, setPreco] = useState('')
  const total = itens.reduce((s, i) => s + i.quantidade * i.preco_unitario, 0)

  async function enviar(e) {
    e.preventDefault()
    await onSalvar(tipo, { nome, qtd: Number(qtd), preco: Number(preco) })
    setNome(''); setQtd(''); setPreco('')
  }

  return (
    <section className={`coluna ${tipo}`} aria-label={titulo}>
      <h2>{titulo}</h2>
      <form onSubmit={enviar} className="linha-form">
        <input list={`bebidas-${tipo}`} placeholder="Tipo de bebida" aria-label="Tipo de bebida"
          value={nome} onChange={(e) => setNome(e.target.value)} required />
        <datalist id={`bebidas-${tipo}`}>{produtos.map((p) => <option key={p.id} value={p.nome} />)}</datalist>
        <input type="number" min="0.01" step="any" inputMode="decimal" placeholder="Qtd."
          aria-label="Quantidade" value={qtd} onChange={(e) => setQtd(e.target.value)} required />
        <input type="number" min="0" step="any" inputMode="decimal" placeholder="Preço un."
          aria-label="Preço unitário" value={preco} onChange={(e) => setPreco(e.target.value)} required />
        <button className="primario">Adicionar</button>
      </form>
      {itens.length === 0 ? <p className="vazio">Ainda sem registos. Adicione a primeira bebida acima.</p> : (
        <ul>{itens.map((i) => (
          <li key={i.id}>
            <span>{nomes[i.produto_id]}</span>
            <span>{i.quantidade} × {mt(i.preco_unitario)}</span>
            <strong>{mt(i.quantidade * i.preco_unitario)}</strong>
          </li>))}
        </ul>)}
      <p className="total">Total <strong>{mt(total)}</strong></p>
    </section>
  )
}

export default function Painel({ perfil }) {
  const [produtos, setProdutos] = useState([])
  const [movs, setMovs] = useState([])
  const [desp, setDesp] = useState([])
  const [aba, setAba] = useState('stock')
  const [menu, setMenu] = useState(false)
  const [vista, setVista] = useState('painel')
  const [erro, setErro] = useState('')
  const [dDesc, setDDesc] = useState('')
  const [dValor, setDValor] = useState('')

  const carregar = useCallback(async () => {
    const [p, m, d] = await Promise.all([
      supabase.from('produtos').select('id,nome').order('nome'),
      supabase.from('movimentos').select('id,tipo,quantidade,preco_unitario,produto_id')
        .order('criado_em', { ascending: false }).limit(100),
      supabase.from('despesas').select('id,descricao,valor')
        .order('criado_em', { ascending: false }).limit(50),
    ])
    setProdutos(p.data ?? []); setMovs(m.data ?? []); setDesp(d.data ?? [])
  }, [])
  useEffect(() => { carregar() }, [carregar])

  const nomes = Object.fromEntries(produtos.map((p) => [p.id, p.nome]))

  async function salvarMov(tipo, { nome, qtd, preco }) {
    setErro('')
    let prod = produtos.find((p) => p.nome.toLowerCase() === nome.trim().toLowerCase())
    if (!prod) {
      const { data, error } = await supabase.from('produtos')
        .insert({ nome: nome.trim(), preco_unitario: preco }).select('id,nome').single()
      if (error) return setErro(error.message)
      prod = data
    }
    const { error } = await supabase.from('movimentos')
      .insert({ produto_id: prod.id, tipo, quantidade: qtd, preco_unitario: preco })
    if (error) return setErro(error.message)
    carregar()
  }

  async function salvarDesp(e) {
    e.preventDefault(); setErro('')
    const { error } = await supabase.from('despesas')
      .insert({ descricao: dDesc.trim(), valor: Number(dValor) })
    if (error) return setErro(error.message)
    setDDesc(''); setDValor(''); carregar()
  }

  if (vista !== 'painel') return (
    <div className="app">
      <button className="link nao-imprimir" onClick={() => setVista('painel')}>← Voltar ao painel</button>
      {{ salarios: <Salarios />, utilizadores: <Utilizadores />, emprestimos: <Emprestimos />, alimentacao: <Alimentacao />, transporte: <Transporte />, relatorios: <Relatorios /> }[vista]}
    </div>
  )

  const totalDesp = desp.reduce((s, d) => s + Number(d.valor), 0)

  return (
    <div className="app">
      <header>
        <div className="cab"><Logo tamanho={38} /><small>{perfil.empresas?.nome} · {perfil.nome}</small></div>
        <button className="menu-btn" aria-label="Abrir menu" aria-expanded={menu}
          onClick={() => setMenu(!menu)}><span /><span /><span /></button>
        {menu && (
          <nav className="menu" aria-label="Menu principal">
            {perfil.papel === 'dono' && <button onClick={() => { setVista('utilizadores'); setMenu(false) }}>Utilizadores</button>}
            {perfil.papel === 'dono' && <button onClick={() => { setVista('salarios'); setMenu(false) }}>Salários</button>}
            {perfil.papel === 'dono' && <button onClick={() => { setVista('emprestimos'); setMenu(false) }}>Empréstimos</button>}
            <button onClick={() => { setVista('alimentacao'); setMenu(false) }}>Alimentação</button>
            <button onClick={() => { setVista('transporte'); setMenu(false) }}>Transporte</button>
            <button onClick={() => { setVista('relatorios'); setMenu(false) }}>Relatórios</button>
            <button onClick={() => supabase.auth.signOut()}>Sair</button>
          </nav>)}
      </header>

      <div className="abas" role="tablist">
        {['stock', 'levantamento'].map((t) => (
          <button key={t} role="tab" aria-selected={aba === t}
            className={aba === t ? 'ativa' : ''} onClick={() => setAba(t)}>
            {t === 'stock' ? 'Stock' : 'Levantamento'}
          </button>))}
      </div>

      {erro && <p role="alert" className="erro">{erro}</p>}

      <main className={`colunas mostra-${aba}`}>
        {[['stock', 'Stock'], ['levantamento', 'Levantamento']].map(([t, titulo]) => (
          <Coluna key={t} tipo={t} titulo={titulo} nomes={nomes} produtos={produtos}
            itens={movs.filter((m) => m.tipo === t)} onSalvar={salvarMov} />))}
      </main>

      <section className="despesas" aria-label="Despesas">
        <h2>Despesas</h2>
        <form onSubmit={salvarDesp} className="linha-form">
          <input placeholder="Descrição" aria-label="Descrição" value={dDesc}
            onChange={(e) => setDDesc(e.target.value)} required />
          <input type="number" min="0.01" step="any" inputMode="decimal" placeholder="Valor"
            aria-label="Valor" value={dValor} onChange={(e) => setDValor(e.target.value)} required />
          <button className="primario">Adicionar</button>
        </form>
        {desp.length === 0 ? <p className="vazio">Sem despesas registadas.</p> : (
          <ul>{desp.map((d) => <li key={d.id}><span>{d.descricao}</span><strong>{mt(d.valor)}</strong></li>)}</ul>)}
        <p className="total">Total <strong>{mt(totalDesp)}</strong></p>
      </section>

      <Grafico />
    </div>
  )
}
