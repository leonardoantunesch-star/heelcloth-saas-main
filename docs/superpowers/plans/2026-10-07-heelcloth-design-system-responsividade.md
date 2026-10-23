# Heelcloth SaaS — Reestruturação de Design System, UX e Responsividade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformar o SaaS Heelcloth em um sistema corporativo profissional, leve e altamente responsivo para confecções, implementando um Design System completo em `src/components/ui/`, refatorando o App Shell (`Sidebar`, `Header`, `AdminLayout`) com suporte mobile off-canvas e padronizando todas as telas administrativas e operacionais sem quebrar regras de negócio existentes.

**Architecture:** Estabelece tokens semânticos limpos em `globals.css` e cria uma biblioteca desacoplada de componentes de interface (`Input`, `Select`, `Modal`, `Drawer`, `Table`, etc.). Um contexto de casca (`AdminShellContext`) orquestra o estado do menu móvel (drawer off-canvas) e o modo de recolhimento no desktop/tablet. As telas de gestão e produção consomem esses componentes com layouts elásticos e cards alternativos para smartphone.

**Tech Stack:** Next.js 15.2.1 (App Router), React 19, TypeScript 5.8, Tailwind CSS v4, Lucide React, Prisma 6.4.

**Spec:** [docs/superpowers/specs/2026-10-07-heelcloth-design-system-responsividade-design.md](file:///C:/Users/João/Heelcloth/docs/superpowers/specs/2026-10-07-heelcloth-design-system-responsividade-design.md)

## Global Constraints

- Manter 100% de compatibilidade com TypeScript (`npm run typecheck` deve rodar com 0 erros a cada tarefa).
- Não alterar nem remover nenhum endpoint em `src/app/api/` nem modelos em `prisma/schema.prisma`.
- Preservar todos os cálculos de orçamentos, etapas de esteira produtiva, geração de macros VBA CorelDRAW e simulação de NF-e.
- Altura tátil mínima de 44px para botões e inputs em dispositivos móveis.
- Zero quebra de layout horizontal (sem scroll horizontal na página inteira em telas móveis de 360px a 414px).

## Review Focus

1. **Abertura do Drawer Mobile em Telas Pequenas:** O drawer deve cobrir confortavelmente a lateral esquerda (`w-72`), exibir overlay fosco no restante da tela e fechar com toque fora, no botão `X` ou ao navegar.
2. **Formulários e Inputs em Dispositivos Móveis:** Campos de texto, números e selects devem ter tamanho legível (mínimo 16px para evitar zoom forçado do iOS) e anéis de foco consistentes.
3. **Modais em Telas Pequenas:** Modais com formulários (ex: Nova Movimentação de Estoque, Nova Transação Financeira) devem possuir rolagem interna própria e não ter botões cortados pelo teclado virtual.
4. **Tabelas Extensas:** Tabelas com mais de 5 colunas devem conter wrapper com scroll horizontal suave ou exibição em cartões no smartphone sem espremer fontes a ponto de perder legibilidade.
5. **Modo Recolhido Desktop/Tablet:** Ao recolher a sidebar no desktop, o conteúdo principal deve ocupar o espaço restante de forma elástica e sem saltos visuais.

---

### Task 1: Tokens Globais de Design e Estilização Base (`globals.css`)

**Files:**
- Modify: `src/app/globals.css:1-34`
- Test: `tests/test_tokens.ts`

**Interfaces:**
- Produces: Variáveis `:root` do Tailwind CSS v4 para o tema corporativo da confecção (`--background: #f8fafc`, `--foreground: #0f172a`, `--card: #ffffff`, `--primary: #2563eb`, etc.).

- [ ] **Step 1: Criar teste de verificação de tokens CSS**
Criar `tests/test_tokens.ts` verificando que as variáveis corporativas essenciais estão declaradas no arquivo CSS.

- [ ] **Step 2: Executar teste para verificar falha inicial**
Run: `npx tsx tests/test_tokens.ts`
Expected: FAIL (variáveis antigas com tema dark `#0a0a0d`).

- [ ] **Step 3: Atualizar `src/app/globals.css`**
Configurar as variáveis no `:root` com foco em baixa fadiga visual: fundo slate claro suave, azul primário cobalto (`#2563eb`), anéis de foco e tipografia legível.

- [ ] **Step 4: Executar teste para verificar sucesso**
Run: `npx tsx tests/test_tokens.ts`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add src/app/globals.css tests/test_tokens.ts
git commit -m "style: atualiza tokens de cores corporativas e ergonomia visual no globals.css"
```

---

### Task 2: Componentes de Formulário e Entrada (`Input`, `Select`, `Textarea`, `Checkbox`, `Radio`, `Switch`)

**Files:**
- Create: `src/components/ui/input.tsx`
- Create: `src/components/ui/select.tsx`
- Create: `src/components/ui/textarea.tsx`
- Create: `src/components/ui/checkbox.tsx`
- Create: `src/components/ui/radio.tsx`
- Create: `src/components/ui/switch.tsx`
- Test: `tests/test_ui_forms.tsx`

**Interfaces:**
- Produces: `Input`, `Select`, `Textarea`, `Checkbox`, `Radio`, `Switch` padronizados com suporte a ícones, rótulos, mensagens de erro e foco acessível.

- [ ] **Step 1: Criar teste de renderização e acessibilidade dos componentes de formulário**
Criar `tests/test_ui_forms.tsx` testando tipagem e presença dos componentes.

- [ ] **Step 2: Executar teste para verificar falha inicial**
Run: `npm run typecheck`
Expected: FAIL (módulos não encontrados em `@/components/ui/*`).

- [ ] **Step 3: Implementar componentes em `src/components/ui/`**
Implementar `input.tsx`, `select.tsx`, `textarea.tsx`, `checkbox.tsx`, `radio.tsx` e `switch.tsx` utilizando `cn()` de `@/lib/utils`.

- [ ] **Step 4: Executar typecheck e testes**
Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add src/components/ui/input.tsx src/components/ui/select.tsx src/components/ui/textarea.tsx src/components/ui/checkbox.tsx src/components/ui/radio.tsx src/components/ui/switch.tsx tests/test_ui_forms.tsx
git commit -m "feat(ui): cria componentes padronizados de entrada e formularios"
```

---

### Task 3: Componentes Estruturais e Feedback (`Modal`, `ConfirmationDialog`, `Drawer`, `Table`, `Tabs`, `Alert`, `EmptyState`, `Skeleton`)

**Files:**
- Create: `src/components/ui/modal.tsx`
- Create: `src/components/ui/confirmation-dialog.tsx`
- Create: `src/components/ui/drawer.tsx`
- Create: `src/components/ui/table.tsx`
- Create: `src/components/ui/tabs.tsx`
- Create: `src/components/ui/alert.tsx`
- Create: `src/components/ui/empty-state.tsx`
- Create: `src/components/ui/skeleton.tsx`
- Test: `tests/test_ui_structure.tsx`

**Interfaces:**
- Produces: Componentes de diálogo modal com backdrop, painel deslizante drawer, tabela com scroll horizontal seguro, abas, alertas e placeholders de carregamento.

- [ ] **Step 1: Criar teste de validação dos componentes estruturais**
Criar `tests/test_ui_structure.tsx` validando importações e propriedades esperadas.

- [ ] **Step 2: Executar typecheck para verificar ausência dos componentes**
Run: `npm run typecheck`
Expected: FAIL.

- [ ] **Step 3: Implementar componentes em `src/components/ui/`**
Construir `modal.tsx`, `confirmation-dialog.tsx`, `drawer.tsx`, `table.tsx`, `tabs.tsx`, `alert.tsx`, `empty-state.tsx` e `skeleton.tsx`.

- [ ] **Step 4: Executar typecheck**
Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add src/components/ui/modal.tsx src/components/ui/confirmation-dialog.tsx src/components/ui/drawer.tsx src/components/ui/table.tsx src/components/ui/tabs.tsx src/components/ui/alert.tsx src/components/ui/empty-state.tsx src/components/ui/skeleton.tsx tests/test_ui_structure.tsx
git commit -m "feat(ui): implementa modais, drawer, tabelas, abas e feedback visual"
```

---

### Task 4: App Shell Responsivo (`AdminShellContext`, `Sidebar`, `Header`, `AdminLayout`)

**Files:**
- Create: `src/components/layout/admin-shell-context.tsx`
- Modify: `src/components/layout/sidebar.tsx:1-190`
- Modify: `src/components/layout/header.tsx:1-109`
- Modify: `src/app/admin/layout.tsx:1-27`
- Test: `tests/test_app_shell.tsx`

**Interfaces:**
- Consumes: `AdminShellContext`, `Drawer`, `Button`, `Badge`
- Produces: Layout administrativo totalmente responsivo para Desktop, Tablet e Celular.

- [ ] **Step 1: Criar teste do App Shell**
Criar `tests/test_app_shell.tsx` validando exportações do contexto e componentes de layout.

- [ ] **Step 2: Implementar `src/components/layout/admin-shell-context.tsx`**
Criar contexto React com `isMobileNavOpen`, `setIsMobileNavOpen`, `isCollapsed`, `toggleCollapse` e fechamento automático ao alterar rota.

- [ ] **Step 3: Refatorar `src/components/layout/sidebar.tsx`**
Adaptar a Sidebar para renderizar versão desktop (recolhível para tablet/desktop) e versão mobile dentro de um `Drawer` lateral com botão de fechar.

- [ ] **Step 4: Refatorar `src/components/layout/header.tsx`**
Adicionar botão de menu hamburger visível apenas em telas menores (`lg:hidden`), campo de busca elástico e alinhamento responsivo das ações de usuário e notificações.

- [ ] **Step 5: Atualizar `src/app/admin/layout.tsx`**
Envolver os filhos com `AdminShellProvider` e aplicar classes responsivas sem overflow quebrado.

- [ ] **Step 6: Executar typecheck e verificar build**
Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 7: Commit**
```bash
git add src/components/layout/admin-shell-context.tsx src/components/layout/sidebar.tsx src/components/layout/header.tsx src/app/admin/layout.tsx tests/test_app_shell.tsx
git commit -m "feat(layout): implementa App Shell responsivo com drawer mobile e sidebar adaptativa"
```

---

### Task 5: Refatoração do Dashboard (`src/app/admin/dashboard/page.tsx`)

**Files:**
- Modify: `src/app/admin/dashboard/page.tsx:1-381`

**Interfaces:**
- Consumes: `Card`, `Badge`, `Button`, `EmptyState`
- Produces: Visão geral adaptável com KPIs em grid elástica e lista de pedidos recentes responsiva.

- [ ] **Step 1: Ajustar cabeçalho do Dashboard**
Organizar título e botões de ação ("Novo Orçamento", "Novo Pedido") com empilhamento limpo no celular (`flex-col sm:flex-row`).

- [ ] **Step 2: Ajustar grids de KPIs de Operação e Finanças**
Configurar `grid-cols-2 lg:grid-cols-5` e `grid-cols-2 lg:grid-cols-4` para garantir legibilidade dos valores monetários e contadores em smartphones.

- [ ] **Step 3: Ajustar lista de pedidos recentes e ações rápidas**
Garantir que a lista de pedidos recentes apresente badges e botões de acesso confortáveis para toque sem quebras inadequadas.

- [ ] **Step 4: Executar typecheck**
Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add src/app/admin/dashboard/page.tsx
git commit -m "refactor(dashboard): adapta KPIs e pedidos recentes para layout responsivo"
```

---

### Task 6: Refatoração das Telas de Pedidos e Orçamentos (`pedidos/page.tsx`, `orcamentos/page.tsx`)

**Files:**
- Modify: `src/app/admin/pedidos/page.tsx:1-369`
- Modify: `src/app/admin/orcamentos/page.tsx:1-310`

**Interfaces:**
- Consumes: `Input`, `Select`, `Button`, `Badge`, `Card`, `Table`, `EmptyState`

- [ ] **Step 1: Atualizar filtros e buscas de Pedidos**
Substituir inputs manuais pelos componentes `Input` e `Select`, empilhando verticalmente no mobile.

- [ ] **Step 2: Implementar visualização adaptável em Pedidos**
Adicionar suporte à tabela com scroll protegido e visualização em cartões no mobile para consulta rápida sem zoom.

- [ ] **Step 3: Atualizar tela de Orçamentos**
Aplicar a mesma padronização de filtros, KPIs e visualização adaptável na listagem de orçamentos.

- [ ] **Step 4: Executar testes de integração de pedidos e orçamentos**
Run: `npx tsx tests/test_pedidos_jogadores.ts; npx tsx tests/test_orcamentos.ts`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add src/app/admin/pedidos/page.tsx src/app/admin/orcamentos/page.tsx
git commit -m "refactor(pedidos, orcamentos): unifica componentes e adiciona modo responsivo de listagem"
```

---

### Task 7: Refatoração da Esteira de Produção e Automação CorelDRAW (`producao/page.tsx`, `coreldraw/page.tsx`)

**Files:**
- Modify: `src/app/admin/producao/page.tsx:1-326`
- Modify: `src/app/admin/coreldraw/page.tsx:1-591`

**Interfaces:**
- Consumes: `Modal`, `Button`, `Badge`, `Card`, `Tabs`

- [ ] **Step 1: Ajustar seletor de etapas da confecção em `producao/page.tsx`**
Transformar as 8 etapas em pílulas com scroll horizontal suave e badges numéricos de itens em cada fase.

- [ ] **Step 2: Ajustar botões de avanço de etapa e qualidade**
Tornar os botões de ação táteis e destacados, evitando cliques acidentais e facilitando o uso em tablets ou smartphones na fábrica.

- [ ] **Step 3: Refatorar layout de `coreldraw/page.tsx`**
Remover a altura fixa de `700px` e o grid rígido de 12 colunas, criando um layout elástico onde a lista de pedidos e o painel de macro VBA funcionam perfeitamente em qualquer tela.

- [ ] **Step 4: Executar testes de CorelDRAW e Produção**
Run: `npx tsx tests/test_coreldraw.ts; npx tsx tests/test_producao_qualidade.ts`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add src/app/admin/producao/page.tsx src/app/admin/coreldraw/page.tsx
git commit -m "refactor(producao, coreldraw): torna esteira de confeccao e automacao CorelDRAW responsivas"
```

---

### Task 8: Refatoração dos Módulos com Modais e Formulários (`estoque`, `financeiro`, `nfe`, `whatsapp`, `clientes`, `configuracoes`)

**Files:**
- Modify: `src/app/admin/estoque/page.tsx:1-794`
- Modify: `src/app/admin/financeiro/page.tsx:1-706`
- Modify: `src/app/admin/nfe/page.tsx:1-592`
- Modify: `src/app/admin/whatsapp/page.tsx:1-608`
- Modify: `src/app/admin/clientes/page.tsx:1-285`
- Modify: `src/app/admin/configuracoes/page.tsx:1-555`

**Interfaces:**
- Consumes: `Modal`, `Input`, `Select`, `Textarea`, `Switch`, `Button`, `Table`, `Alert`

- [ ] **Step 1: Padronizar modais e formulários de Estoque**
Substituir os 3 modais ad-hoc (Novo Item, Movimentação, Histórico) pelo componente `Modal`, integrando `Input` e `Select`.

- [ ] **Step 2: Padronizar modais e filtros de Financeiro**
Substituir modais de receitas/despesas e filtros de períodos pelo novo Design System.

- [ ] **Step 3: Padronizar emissão e cancelamento de NF-e e WhatsApp**
Atualizar modais e formulários fiscais e de mensagens para garantir usabilidade sem estourar viewports móveis.

- [ ] **Step 4: Padronizar Clientes e Configurações**
Garantir que as abas e formulários de configuração e clientes tenham espaçamentos consistentes.

- [ ] **Step 5: Executar testes de integração destes módulos**
Run: `npx tsx tests/test_estoque.ts; npx tsx tests/test_financeiro.ts; npx tsx tests/test_nfe.ts; npx tsx tests/test_whatsapp.ts; npx tsx tests/test_clientes.ts; npx tsx tests/test_configuracoes.ts`
Expected: PASS.

- [ ] **Step 6: Commit**
```bash
git add src/app/admin/estoque/page.tsx src/app/admin/financeiro/page.tsx src/app/admin/nfe/page.tsx src/app/admin/whatsapp/page.tsx src/app/admin/clientes/page.tsx src/app/admin/configuracoes/page.tsx
git commit -m "refactor(modulos): padroniza modais e entradas em estoque, financeiro, fiscal, whatsapp e clientes"
```

---

### Task 9: Validação Geral de Tipagem, Build e Integridade End-to-End

**Files:**
- Test: Todas as suítes em `tests/`
- Build: `npm run build`

- [ ] **Step 1: Executar verificação estática de tipos TypeScript**
Run: `npm run typecheck`
Expected: 0 erros.

- [ ] **Step 2: Executar build de produção do Next.js**
Run: `npm run build`
Expected: Build concluído com sucesso e todas as rotas compiladas.

- [ ] **Step 3: Executar teste master E2E**
Run: `npx tsx tests/test_master_e2e.ts`
Expected: PASS.

- [ ] **Step 4: Commit final de encerramento**
```bash
git add -A
git commit -m "chore: homologacao completa da reestruturacao de design system e responsividade do Heelcloth SaaS"
```
