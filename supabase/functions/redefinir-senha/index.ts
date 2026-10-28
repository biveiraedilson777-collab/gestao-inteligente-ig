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
    const chamador = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    })
    const { data: { user } } = await chamador.auth.getUser()
    if (!user) return json({ erro: 'Sem sessão' }, 401)

    const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { data: dono } = await admin.from('perfis')
      .select('empresa_id, papel').eq('user_id', user.id).single()
    if (dono?.papel !== 'dono') return json({ erro: 'Só o dono pode redefinir senhas' }, 403)

    const { user_id, senha } = await req.json()
    if (typeof senha !== 'string' || senha.length < 8) return json({ erro: 'A senha precisa de pelo menos 8 caracteres' }, 400)

    // o alvo tem de ser funcionário da MESMA empresa
    const { data: alvo } = await admin.from('perfis')
      .select('empresa_id, papel').eq('user_id', user_id).single()
    if (!alvo || alvo.empresa_id !== dono.empresa_id || alvo.papel !== 'funcionario')
      return json({ erro: 'Utilizador não encontrado' }, 404)

    const { error } = await admin.auth.admin.updateUserById(user_id, { password: senha })
    if (error) return json({ erro: 'Não foi possível alterar a senha' }, 400)
    return json({ ok: true })
  } catch {
    return json({ erro: 'Erro inesperado' }, 500)
  }
})
