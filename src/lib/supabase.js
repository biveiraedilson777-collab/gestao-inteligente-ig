import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

export const slugify = (nome) =>
  nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

// O utilizador digita só o nome da empresa; o e-mail interno nunca é mostrado
export const emailDaEmpresa = (nome, usuario = '') =>
  usuario.trim()
    ? `${usuario.trim().toLowerCase()}.${slugify(nome)}@stock-app.com`
    : `${slugify(nome)}@stock-app.com`

export const mt = (v) =>
  new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(v || 0)
