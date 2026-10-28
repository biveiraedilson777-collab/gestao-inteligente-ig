import Registos, { fmtData } from '../components/Registos.jsx'
import { mt } from '../lib/supabase'

const TURNOS = [['manha', 'Manhã'], ['tarde', 'Tarde'], ['noite', 'Noite']]

export default function Alimentacao() {
  return (
    <Registos titulo="Alimentação" tabela="alimentacao"
      campos={[
        { k: 'data', label: 'Data (dia/mês/ano)', tipo: 'date' },
        { k: 'turno', label: 'Turno', tipo: 'select', opcoes: TURNOS },
        { k: 'preco_unitario', label: 'Preço unitário', tipo: 'number' },
        { k: 'quantidade', label: 'Quantidade', tipo: 'number' },
      ]}
      linha={(r) => [fmtData(r.data), TURNOS.find((t) => t[0] === r.turno)?.[1],
        `${r.quantidade} × ${mt(r.preco_unitario)}`, mt(r.quantidade * r.preco_unitario)]}
      valor={(r) => r.quantidade * r.preco_unitario} />
  )
}
