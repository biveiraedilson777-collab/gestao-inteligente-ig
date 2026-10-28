-- =====================================================================
-- GESTÃO INTELIGENTE IG | 002: empréstimos, alimentação, transporte
-- Executar no SQL Editor do Supabase (depois do 001)
-- =====================================================================
create table public.emprestimos (
  id             uuid primary key default gen_random_uuid(),
  empresa_id     uuid not null default public.minha_empresa() references public.empresas(id) on delete cascade,
  nome           text not null check (char_length(nome) between 2 and 80),
  contacto       text not null check (char_length(contacto) between 3 and 40),
  valor_pendente numeric(12,2) not null check (valor_pendente > 0),
  prazo          date not null,
  pago           boolean not null default false,
  pago_em        date,
  criado_em      timestamptz not null default now()
);
create index emprestimos_empresa_prazo_idx on public.emprestimos (empresa_id, prazo);

create table public.alimentacao (
  id             uuid primary key default gen_random_uuid(),
  empresa_id     uuid not null default public.minha_empresa() references public.empresas(id) on delete cascade,
  data           date not null default current_date,
  turno          text not null check (turno in ('manha', 'tarde', 'noite')),
  preco_unitario numeric(12,2) not null check (preco_unitario >= 0),
  quantidade     integer not null default 1 check (quantidade > 0),
  criado_por     uuid default auth.uid() references auth.users(id) on delete set null,
  criado_em      timestamptz not null default now()
);
create index alimentacao_empresa_data_idx on public.alimentacao (empresa_id, data);

create table public.transporte (
  id                  uuid primary key default gen_random_uuid(),
  empresa_id          uuid not null default public.minha_empresa() references public.empresas(id) on delete cascade,
  data                date not null default current_date,
  preco               numeric(12,2) not null check (preco >= 0),
  quantidade_produtos integer not null check (quantidade_produtos > 0),
  criado_por          uuid default auth.uid() references auth.users(id) on delete set null,
  criado_em           timestamptz not null default now()
);
create index transporte_empresa_data_idx on public.transporte (empresa_id, data);

alter table public.emprestimos enable row level security;
alter table public.alimentacao enable row level security;
alter table public.transporte  enable row level security;

-- empréstimos: dados de clientes, só o dono
create policy emprestimos_all on public.emprestimos for all to authenticated
  using (empresa_id = (select public.minha_empresa()) and (select public.sou_dono()))
  with check (empresa_id = (select public.minha_empresa()) and (select public.sou_dono()));

-- alimentação e transporte: todos registam; só o dono altera/apaga
create policy alimentacao_select on public.alimentacao for select to authenticated
  using (empresa_id = (select public.minha_empresa()));
create policy alimentacao_insert on public.alimentacao for insert to authenticated
  with check (empresa_id = (select public.minha_empresa()) and criado_por = (select auth.uid()));
create policy alimentacao_update on public.alimentacao for update to authenticated
  using (empresa_id = (select public.minha_empresa()) and (select public.sou_dono()))
  with check (empresa_id = (select public.minha_empresa()));
create policy alimentacao_delete on public.alimentacao for delete to authenticated
  using (empresa_id = (select public.minha_empresa()) and (select public.sou_dono()));

create policy transporte_select on public.transporte for select to authenticated
  using (empresa_id = (select public.minha_empresa()));
create policy transporte_insert on public.transporte for insert to authenticated
  with check (empresa_id = (select public.minha_empresa()) and criado_por = (select auth.uid()));
create policy transporte_update on public.transporte for update to authenticated
  using (empresa_id = (select public.minha_empresa()) and (select public.sou_dono()))
  with check (empresa_id = (select public.minha_empresa()));
create policy transporte_delete on public.transporte for delete to authenticated
  using (empresa_id = (select public.minha_empresa()) and (select public.sou_dono()));
