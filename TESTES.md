# Checklist de testes — Stock

Use pelo menos **duas empresas** (A e B) e, na A, um funcionário.

## Funcional
- [ ] Registar empresa nova; nome repetido mostra erro claro
- [ ] Entrar com senha errada mostra erro; senha certa abre o painel
- [ ] Sair e confirmar que o painel não abre ao voltar atrás no navegador
- [ ] Adicionar bebida em Stock e em Levantamento; totais corretos
- [ ] Bebida nova aparece nas sugestões das duas colunas
- [ ] Adicionar despesa; total correto
- [ ] Salários: adicionar, remover, total mensal
- [ ] Relatórios: Hoje, Semanal, Mensal e Personalizado devolvem os registos certos
- [ ] Filtros por tipo e bebida; Exportar PDF e Baixar CSV (abrir no Excel)
- [ ] Utilizadores: criar funcionário; utilizador repetido mostra erro
- [ ] Dono redefine senha do funcionário; senha antiga deixa de funcionar

## Segurança (o mais importante)
- [ ] Empresa B não vê nenhum produto, movimento, despesa nem salário da A
- [ ] Funcionário não vê "Salários" nem "Utilizadores" no menu
- [ ] Funcionário não consegue apagar nem editar movimentos (testar na consola: `supabase.from('movimentos').delete()` não apaga nada)
- [ ] Funcionário que chama a função `criar-funcionario` recebe erro 403
- [ ] Dono da A não consegue redefinir senha de utilizador da B
- [ ] Chave `service_role` não aparece em nenhum ficheiro do front-end nem no `.env` do Netlify
- [ ] Sessão expirada obriga a entrar de novo

## Visual
- [ ] Telemóvel (360 px): abas Stock/Levantamento, sem rolagem lateral, botões fáceis de tocar
- [ ] Tablet e computador: colunas lado a lado
- [ ] Tabela de relatórios rola na horizontal no telemóvel
- [ ] Navegação só com teclado e foco visível

## Desempenho
- [ ] `npm run build` sem erros; site abre em menos de 3 s em rede 3G (DevTools)
- [ ] Relatório mensal com 1000+ registos continua rápido

## Novos módulos
- [ ] Empréstimos: adicionar, "Confirmar pagamento" passa a "✓ Pago"; prazo vencido aparece a vermelho
- [ ] Empréstimos: "Baixar PDF com os nomes" mostra só a lista (sem formulário nem menu)
- [ ] Funcionário não vê "Empréstimos" e não consegue ler a tabela `emprestimos` (consola devolve vazio)
- [ ] Alimentação: data em dia/mês/ano, turnos Manhã/Tarde/Noite, total = quantidade × preço
- [ ] Transporte: preço e quantidade de produtos guardados
- [ ] Gráfico: barras de vendas (levantamentos) e despesas; "Alto" e "Baixo" no dia certo; 7 e 30 dias
- [ ] Relatórios incluem Alimentação e Transporte nos totais e filtros
