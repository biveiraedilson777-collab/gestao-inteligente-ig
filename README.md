# Gestão Inteligente IG

Sistema web de gestão de stock, levantamento, despesas, salários, empréstimos, alimentação e transporte para PMEs.
Stack: React + Vite · Supabase (PostgreSQL, Auth, Edge Functions) · Netlify.

## Estrutura
```
gestao-inteligente-ig/
├── src/
│   ├── components/   Logo, Grafico, Registos (lista genérica)
│   ├── pages/        Login, Painel, Salarios, Relatorios, Utilizadores,
│   │                 Emprestimos, Alimentacao, Transporte
│   └── lib/supabase.js
├── supabase/
│   ├── schema_completo.sql        (executar este)
│   ├── migrations/                (001 e 002 separados)
│   └── functions/                 criar-funcionario, redefinir-senha
├── netlify.toml · .env.example · TESTES.md
```

## Pôr a funcionar
1. Supabase → SQL Editor → executar `supabase/schema_completo.sql`.
2. Authentication → Providers → Email → desativar **Confirm email**.
3. Copiar `.env.example` para `.env` e preencher URL e chave **anon**.
4. `npm install` e `npm run dev` → http://localhost:5173
5. Funcionários e nova senha: `supabase login`, `supabase link --project-ref CODIGO`,
   `supabase functions deploy criar-funcionario` e `supabase functions deploy redefinir-senha`.
6. Publicar: `npm run build` e arrastar a pasta `dist` para app.netlify.com/drop.
