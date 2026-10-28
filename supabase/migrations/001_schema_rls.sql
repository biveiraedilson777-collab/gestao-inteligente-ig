-- =====================================================================
-- STOCK | 001: tabelas + isolamento por empresa (RLS)
-- Executar no Supabase: SQL Editor > New query > colar > Run
-- =====================================================================

-- ---------- EMPRESAS ----------
create table public.empresas (
  id         uuid primary key default gen_random_uuid(),
  nome       text not null check (char_length(nome) between 2 and 80),
  slug       text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  criada_em  timestamptz not null default now()
);

-- ---------- PERFIS (liga utilizador -> empresa + papel) ----------
create table public.perfis (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  nome       text not null check (char_length(nome) between 2 and 80),
  papel      text not null check (papel in ('dono', 'funcionario')),
  criado_em  timestamptz not null default now()
);
create index perfis_empresa_idx on public.perfis (empresa_id);

-- ---------- FUNÇÕES AUXILIARES ----------
create function public.minha_empresa()
returns uuid
language sql stable security definer set search_path = ''
as $$
  select empresa_id from public.perfis where user_id = (select auth.uid())
$$;

create function public.sou_dono()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.perfis
    where user_id = (select auth.uid()) and papel = 'dono'
  )
$$;

revoke execute on function public.minha_empresa() from public, anon;
revoke execute on function public.sou_dono()      from public, anon;
grant  execute on function public.minha_empresa() to authenticated;
grant  execute on function public.sou_dono()      to authenticated;

-- ---------- PRODUTOS ----------
create table public.produtos (
  id             uuid primary key default gen_random_uuid(),
  empresa_id     uuid not null default public.minha_empresa()
                   references public.empresas(id) on delete cascade,
  nome           text not null check (char_length(nome) between 1 and 80),
  categoria      text,
  preco_unitario numeric(12,2) not null default 0 check (preco_unitario >= 0),
  criado_em      timestamptz not null default now(),
  unique (empresa_id, nome),
  unique (id, empresa_id)  -- permite FK composta (garante mesma empresa)
);

-- ---------- MOVIMENTOS (coluna Stock e coluna Levantamento) ----------
create table public.movimentos (
  id             uuid primary key default gen_random_uuid(),
  empresa_id     uuid not null default public.minha_empresa()
                   references public.empresas(id) on delete cascade,
  produto_id     uuid not null,
  tipo           text not null check (tipo in ('stock', 'levantamento')),
  quantidade     numeric(12,2) not null check (quantidade > 0),
  preco_unitario numeric(12,2) not null check (preco_unitario >= 0),
  data           date not null default current_date,
  criado_por     uuid default auth.uid() references auth.users(id) on delete set null,
  criado_em      timestamptz not null default now(),
  -- o produto tem de pertencer à mesma empresa do movimento
  foreign key (produto_id, empresa_id)
    references public.produtos (id, empresa_id) on delete restrict
);
create index movimentos_empresa_data_idx on public.movimentos (empresa_id, data);
create index movimentos_produto_idx      on public.movimentos (produto_id);

-- ---------- DESPESAS ----------
create table public.despesas (
  id         uuid primary key default gen_random_uuid(),
  empresa_id uuid not null default public.minha_empresa()
               references public.empresas(id) on delete cascade,
  descricao  text not null check (char_length(descricao) between 1 and 200),
  valor      numeric(12,2) not null check (valor > 0),
  data       date not null default current_date,
  criado_por uuid default auth.uid() references auth.users(id) on delete set null,
  criado_em  timestamptz not null default now()
);
create index despesas_empresa_data_idx on public.despesas (empresa_id, data);

-- ---------- FUNCIONÁRIOS / SALÁRIOS (só o dono acede) ----------
create table public.funcionarios (
  id             uuid primary key default gen_random_uuid(),
  empresa_id     uuid not null default public.minha_empresa()
                   references public.empresas(id) on delete cascade,
  nome           text not null check (char_length(nome) between 2 and 80),
  salario        numeric(12,2) not null check (salario >= 0),
  dia_pagamento  smallint not null check (dia_pagamento between 1 and 31),
  criado_em      timestamptz not null default now()
);
create index funcionarios_empresa_idx on public.funcionarios (empresa_id);

-- =====================================================================
-- RLS: cada utilizador só vê/altera dados da sua empresa
-- =====================================================================
alter table public.empresas     enable row level security;
alter table public.perfis       enable row level security;
alter table public.produtos     enable row level security;
alter table public.movimentos   enable row level security;
alter table public.despesas     enable row level security;
alter table public.funcionarios enable row level security;

-- empresas
create policy empresas_select on public.empresas for select to authenticated
  using (id = (select public.minha_empresa()));
create policy empresas_update on public.empresas for update to authenticated
  using (id = (select public.minha_empresa()) and (select public.sou_dono()))
  with check (id = (select public.minha_empresa()));

-- perfis (criação de utilizadores é feita por função segura / Edge Function)
create policy perfis_select on public.perfis for select to authenticated
  using (empresa_id = (select public.minha_empresa()));
create policy perfis_update on public.perfis for update to authenticated
  using (empresa_id = (select public.minha_empresa()) and (select public.sou_dono()))
  with check (empresa_id = (select public.minha_empresa()));
create policy perfis_delete on public.perfis for delete to authenticated
  using (empresa_id = (select public.minha_empresa())
         and (select public.sou_dono())
         and user_id <> (select auth.uid()));

-- produtos
create policy produtos_select on public.produtos for select to authenticated
  using (empresa_id = (select public.minha_empresa()));
create policy produtos_insert on public.produtos for insert to authenticated
  with check (empresa_id = (select public.minha_empresa()));
create policy produtos_update on public.produtos for update to authenticated
  using (empresa_id = (select public.minha_empresa()))
  with check (empresa_id = (select public.minha_empresa()));
create policy produtos_delete on public.produtos for delete to authenticated
  using (empresa_id = (select public.minha_empresa()) and (select public.sou_dono()));

-- movimentos (funcionário regista; só o dono altera/apaga)
create policy movimentos_select on public.movimentos for select to authenticated
  using (empresa_id = (select public.minha_empresa()));
create policy movimentos_insert on public.movimentos for insert to authenticated
  with check (empresa_id = (select public.minha_empresa())
              and criado_por = (select auth.uid()));
create policy movimentos_update on public.movimentos for update to authenticated
  using (empresa_id = (select public.minha_empresa()) and (select public.sou_dono()))
  with check (empresa_id = (select public.minha_empresa()));
create policy movimentos_delete on public.movimentos for delete to authenticated
  using (empresa_id = (select public.minha_empresa()) and (select public.sou_dono()));

-- despesas (mesmas regras dos movimentos)
create policy despesas_select on public.despesas for select to authenticated
  using (empresa_id = (select public.minha_empresa()));
create policy despesas_insert on public.despesas for insert to authenticated
  with check (empresa_id = (select public.minha_empresa())
              and criado_por = (select auth.uid()));
create policy despesas_update on public.despesas for update to authenticated
  using (empresa_id = (select public.minha_empresa()) and (select public.sou_dono()))
  with check (empresa_id = (select public.minha_empresa()));
create policy despesas_delete on public.despesas for delete to authenticated
  using (empresa_id = (select public.minha_empresa()) and (select public.sou_dono()));

-- funcionarios: tudo restrito ao dono
create policy funcionarios_all on public.funcionarios for all to authenticated
  using (empresa_id = (select public.minha_empresa()) and (select public.sou_dono()))
  with check (empresa_id = (select public.minha_empresa()) and (select public.sou_dono()));

-- =====================================================================
-- REGISTO DE EMPRESA: cria empresa + perfil do dono numa só operação
-- (chamar logo após auth.signUp, já com sessão ativa)
-- =====================================================================
create function public.registar_empresa(
  p_nome text,
  p_slug text,
  p_nome_dono text default 'Dono'
)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Sem sessão ativa';
  end if;
  if exists (select 1 from public.perfis where user_id = auth.uid()) then
    raise exception 'Este utilizador já pertence a uma empresa';
  end if;

  insert into public.empresas (nome, slug)
  values (trim(p_nome), p_slug)
  returning id into v_id;

  insert into public.perfis (user_id, empresa_id, nome, papel)
  values (auth.uid(), v_id, trim(p_nome_dono), 'dono');

  return v_id;
end;
$$;

revoke execute on function public.registar_empresa(text, text, text) from public, anon;
grant  execute on function public.registar_empresa(text, text, text) to authenticated;
