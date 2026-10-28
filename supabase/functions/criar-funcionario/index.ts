import { createClient } from 'npm:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const url = Deno.env.get('SUPABASE_URL')!
    // 1) quem está a chamar?
    const chamador = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    })
    const { data: { user } } = await chamador.auth.getUser()
    if (!user) return json({ erro: 'Sem sessão' }, 401)

    // 2) tem de ser dono (a chave de administrador nunca sai deste servidor)
    const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { data: perfil } = await admin.from('perfis')
      .select('empresa_id, papel, empresas(slug)').eq('user_id', user.id).single()
    if (perfil?.papel !== 'dono') return json({ erro: 'Só o dono pode criar utilizadores' }, 403)

    // 3) validar dados
    const { nome, usuario, senha } = await req.json()
    if (typeof nome !== 'string' || nome.trim().length < 2 || nome.length > 80) return json({ erro: 'Nome inválido' }, 400)
    if (!/^[a-z0-9]{2,20}$/.test(usuario ?? '')) return json({ erro: 'Utilizador: 2 a 20 letras minúsculas ou números' }, 400)
    if (typeof senha !== 'string' || senha.length < 8) return json({ erro: 'A senha precisa de pelo menos 8 caracteres' }, 400)

    // 4) criar login + perfil
    const email = `${usuario}.${(perfil.empresas as { slug: string }).slug}@stock-app.com`
    const { data, error } = await admin.auth.admin.createUser({ email, password: senha, email_confirm: true })
    if (error) return json({ erro: 'Esse utilizador já existe' }, 400)
    const { error: e2 } = await admin.from('perfis').insert({
      user_id: data.user.id, empresa_id: perfil.empresa_id, nome: nome.trim(), papel: 'funcionario',
    })
    if (e2) { await admin.auth.admin.deleteUser(data.user.id); return json({ erro: 'Não foi possível criar o perfil' }, 400) }
    return json({ ok: true })
  } catch {
    return json({ erro: 'Erro inesperado' }, 500)
  }
})
