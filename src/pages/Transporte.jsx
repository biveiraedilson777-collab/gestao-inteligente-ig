import Registos, { fmtData } from '../components/Registos.jsx'
import { mt } from '../lib/supabase'

export default function Transporte() {
  return (
    <Registos titulo="Transporte" tabela="transporte"
      campos={[
        { k: 'data', label: 'Data', tipo: 'date' },
        { k: 'preco', label: 'Preço do transporte', tipo: 'number' },
        { k: 'quantidade_produtos', label: 'Qtd. de produtos', tipo: 'number' },
      ]}
      linha={(r) => [fmtData(r.data), `${r.quantidade_produtos} produtos`, mt(r.preco)]}
      valor={(r) => Number(r.preco)} />
  )
}
