import { useEffect, useState } from 'react'
import { supabase, mt } from '../lib/supabase'

const iso = (d) => d.toLocaleDateString('sv-SE')
const W = 600, H = 190

export default function Grafico() {
  const [dias, setDias] = useState(7)
  const [serie, setSerie] = useState([])

  useEffect(() => {
    (async () => {
      const lista = Array.from({ length: dias }, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() - (dias - 1 - i)); return iso(d)
      })
      const de = lista[0]
      const [m, d, a, t] = await Promise.all([
        supabase.from('movimentos').select('data,quantidade,preco_unitario').eq('tipo', 'levantamento').gte('data', de),
        supabase.from('despesas').select('data,valor').gte('data', de),
        supabase.from('alimentacao').select('data,quantidade,preco_unitario').gte('data', de),
        supabase.from('transporte').select('data,preco').gte('data', de),
      ])
      const v = Object.fromEntries(lista.map((x) => [x, { dia: x, venda: 0, despesa: 0 }]))
      m.data?.forEach((r) => { if (v[r.data]) v[r.data].venda += r.quantidade * r.preco_unitario })
      d.data?.forEach((r) => { if (v[r.data]) v[r.data].despesa += Number(r.valor) })
      a.data?.forEach((r) => { if (v[r.data]) v[r.data].despesa += r.quantidade * r.preco_unitario })
      t.data?.forEach((r) => { if (v[r.data]) v[r.data].despesa += Number(r.preco) })
      setSerie(lista.map((x) => v[x]))
    })()
  }, [dias])

  const max = Math.max(1, ...serie.flatMap((s) => [s.venda, s.despesa]))
  const g = W / Math.max(serie.length, 1), bw = g * 0.36
  const alto = serie.reduce((b, s) => (s.venda > b.venda ? s : b), serie[0] ?? { venda: 0 })
  const baixo = serie.reduce((b, s) => (s.venda < b.venda ? s : b), serie[0] ?? { venda: 0 })
  const h = (x) => (x / max) * H
  const fm = (dia) => dia.slice(8) + '/' + dia.slice(5, 7)
  const temDados = serie.some((s) => s.venda || s.despesa)

  return (
    <section className="despesas grafico nao-imprimir" aria-label="Gráfico de vendas e despesas">
      <h2>Vendas e despesas</h2>
      <div className="abas">
        <button className={dias === 7 ? 'ativa' : ''} onClick={() => setDias(7)}>7 dias</button>
        <button className={dias === 30 ? 'ativa' : ''} onClick={() => setDias(30)}>30 dias</button>
      </div>
      <p className="legenda"><i style={{ background: '#1F7A5C' }} /> Vendas (levantamentos) <i style={{ background: '#B3261E' }} /> Despesas</p>
      {!temDados ? <p className="vazio">Ainda não há dados neste período.</p> : (<>
        <svg viewBox={`0 0 ${W} ${H + 34}`} role="img"
          aria-label={`Vendas mais altas em ${fm(alto.dia)} e mais baixas em ${fm(baixo.dia)}`}>
          {serie.map((s, i) => (
            <g key={s.dia}>
              <rect x={i * g + g * 0.1} y={H - h(s.venda) + 18} width={bw} height={h(s.venda)} fill="#1F7A5C" rx="2" />
              <rect x={i * g + g * 0.1 + bw + 2} y={H - h(s.despesa) + 18} width={bw} height={h(s.despesa)} fill="#B3261E" rx="2" />
              {(dias === 7 || i % 5 === 0) && <text x={i * g + g * 0.5} y={H + 32} textAnchor="middle" fontSize="12" fill="currentColor">{fm(s.dia)}</text>}
              {s === alto && s.venda > 0 && <text x={i * g + g * 0.1 + bw / 2} y={H - h(s.venda) + 12} textAnchor="middle" fontSize="12" fontWeight="700" fill="#1F7A5C">Alto</text>}
              {s === baixo && s !== alto && <text x={i * g + g * 0.1 + bw / 2} y={H - h(s.venda) + 12} textAnchor="middle" fontSize="12" fontWeight="700" fill="#B86E00">Baixo</text>}
            </g>))}
        </svg>
        <p>Venda mais alta: <strong>{fm(alto.dia)}</strong> ({mt(alto.venda)}) · mais baixa: <strong>{fm(baixo.dia)}</strong> ({mt(baixo.venda)})</p>
      </>)}
    </section>
  )
}
