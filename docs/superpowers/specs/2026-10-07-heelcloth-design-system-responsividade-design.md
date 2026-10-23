# Heelcloth SaaS — Reestruturação de Design System, UX e Responsividade

## 1. Visão Geral e Objetivos

O Heelcloth é um ERP SaaS focado na gestão completa de confecções de camisas, uniformes esportivos e produtos personalizados. A aplicação já possui regras de negócio maduras (cálculo de preços, esteira de confecção em 8 etapas, geração de macros VBA para CorelDRAW, controle de estoque com movimentações, fluxo financeiro, emissão fiscal e disparos via WhatsApp).

### Objetivo Principal
Transformar o sistema em um produto SaaS empresarial moderno, ágil, altamente funcional e com baixa fadiga visual, garantindo usabilidade plena em **Desktop**, **Tablet** e **Mobile (Celular)** sem comprometer nenhuma regra de negócio existente.

---

## 2. Diagnóstico da Arquitetura e Causa Raiz da Responsividade

### 2.1 Stack Tecnológico Existente
- **Framework:** Next.js 15.2.1 (App Router), React 19.0.0, TypeScript 5.8.2.
- **Estilos:** Tailwind CSS v4.0.9 via `@tailwindcss/postcss`.
- **Banco de Dados:** Prisma 6.4.1 (SQLite local em `prisma/dev.db`, compatível com PostgreSQL).
- **Validação & Ícones:** Zod 3.24.2, Lucide React 1.48.0.
- **Sessão:** HMAC-SHA256 em cookies HTTP-only seguros, senhas com `scrypt` salteado e RBAC (`ADMIN`, `PRODUCAO`, `FINANCEIRO`, `VENDEDOR`).

### 2.2 Falhas Críticas Identificadas na Interface
1. **Sidebar Rígida (`sidebar.tsx`):** Largura fixa de 256px (`w-64 shrink-0`) mantida sem ocultação em telas móveis, comprimindo a área de conteúdo em smartphones para ~110px.
2. **Header Inflexível (`header.tsx`):** Campo de busca fixo de 384px (`w-96`) sem colapso, transbordando o layout horizontalmente.
3. **Ausência de Biblioteca de Componentes:** Existiam apenas 3 componentes em `src/components/ui/` (`button.tsx`, `badge.tsx`, `card.tsx`). Modais, tabelas, inputs, checkboxes, alertas e empty states foram implementados de maneira fragmentada e inconsistente em cada página.
4. **Variáveis de Estilo Globais Desalinhadas:** `globals.css` definia variáveis com tema escuro enquanto as páginas usavam `bg-slate-50` com classes fixas de tema claro.

---

## 3. Arquitetura da Solução

### 3.1 App Shell Responsivo (`AdminLayout`, `AdminShellContext`, `Sidebar`, `Header`)

#### A. Provedor de Estado do Shell (`AdminShellContext`)
- `mobileNavOpen` (boolean): gerencia abertura/fechamento do Drawer em dispositivos móveis. Fecha automaticamente na transição de rota ou via tecla `Escape`.
- `sidebarCollapsed` (boolean): permite recolhimento para modo compacto (`w-18`) em tablets e desktops para visualização maximizada de tabelas e produção.

#### B. Barra Lateral (`Sidebar`)
- **Mobile (< 768px):** Oculta na visualização primária. Quando acionada, abre como um **Drawer Off-Canvas** deslizante da esquerda para a direita (`w-72`), com backdrop semi-transparente fosco (`bg-slate-900/50 backdrop-blur-xs`), botão explícito de fechar (`X`) e itens de toque com altura mínima de 44px.
- **Tablet (768px - 1023px):** Modo recolhido (`w-18`) com ícones e tooltips ou expansível via botão de alternância.
- **Desktop (≥ 1024px):** Barra fixa refinada (`w-64`) com navegação estruturada por grupos de operação (Geral, Fábrica, Comercial, Gestão) e identificação do perfil logado.

#### C. Cabeçalho (`Header`)
- Botão hamburger de menu visível apenas em telas `< 1024px`.
- Campo de busca responsivo: expande no desktop (`w-72` a `w-96`) e se adapta de forma fluida ou expansível no mobile sem quebrar os ícones de ação.
- Notificações com indicador e menu de usuário com avatar, cargo e botão de logout.

---

## 4. Design System Unificado (`src/components/ui/`)

Padronização de componentes reutilizáveis baseados em Tailwind CSS v4, garantindo acessibilidade, consistência e ergonomia visual:

1. **`Button`:** Variantes `default`, `secondary`, `outline`, `ghost`, `danger`, `success`; tamanhos `sm`, `md`, `lg`, `icon`; estado `isLoading` com indicador de carregamento giratório.
2. **`Input`:** Campo com padding confortável, anel de foco corporativo (`focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-600`), suporte a ícones de prefixo/sufixo, estado de erro com mensagem dedicada.
3. **`Select`:** Seletor nativo customizado com chevron alinhado e consistência de bordas e foco.
4. **`Textarea`:** Área de texto responsiva com altura padrão controlada e suporte a redimensionamento vertical.
5. **`Checkbox` & `Radio`:** Seletores com marcação customizada, foco acessível e rótulos legíveis.
6. **`Switch`:** Chave alternadora suave para flags (ex: "Goleiro", "Manga Longa", "Baixo Estoque").
7. **`Badge`:** Indicadores semânticos com variantes `default`, `secondary`, `success`, `warning`, `danger`, `info`, `outline`.
8. **`Card`:** Família modular composta por `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent` e `CardFooter`.
9. **`Table`:** Container com scroll horizontal embutido (`overflow-x-auto`), com `TableHeader`, `TableBody`, `TableRow`, `TableCell`, `TableHead`, zebra sutil e estados de hover.
10. **`Modal` & `Dialog`:** Diálogos modais com gerenciamento de foco, fechamento por `Escape`/backdrop, título, corpo com rolagem suave e rodapé de ações padronizado.
11. **`ConfirmationDialog`:** Diálogo específico para ações críticas e destrutivas (ex: exclusão de pedido, cancelamento de NF-e).
12. **`Drawer`:** Painel deslizante off-canvas reaproveitável.
13. **`Tabs`:** Abas de navegação interna (`TabsList`, `TabsTrigger`, `TabsContent`) para divisão de telas com múltiplas categorias.
14. **`Alert`:** Mensagens em banner para status de erro, sucesso, atenção e informação.
15. **`Toast`:** Notificações temporárias de ação concluída (ex: "Status da produção avançado").
16. **`EmptyState`:** Estado visual de lista vazia com ícone, título informativo, subtítulo e botão de ação primária.
17. **`Skeleton`:** Marcadores visuais animados para carregamento assíncrono em tabelas e cards.

---

## 5. Padrões de Páginas e Adaptação Mobile

### 5.1 Dashboard e Telas de Listagem (Pedidos, Orçamentos, Clientes, Financeiro, Estoque)
- **Grid de Indicadores (KPIs):** Reestruturado para 4–5 colunas no desktop, 2 colunas no tablet e 1–2 colunas no celular, evitando compressão de valores em reais (`R$`).
- **Filtros e Buscas:** No mobile, os campos de busca e seleção de status se organizam verticalmente (`flex-col sm:flex-row`), permitindo toque confortável e botões de filtro com largura total.
- **Tabelas vs. Cards no Mobile:** As listagens contam com wrapper horizontal protegido e modo de visualização em cartões no celular, permitindo leitura direta de cliente, valor, prazo e status sem necessidade de pinça/zoom.

### 5.2 Módulos Específicos de Manufatura
- **Esteira de Produção (`producao/page.tsx`):**
  - Seletor de etapas com rolagem horizontal limpa e badges com totalizadores numéricos por fase.
  - Cartões de pedidos com botões de avanço de etapa táteis e atalho direto para o controle de qualidade.
- **CorelDRAW & VBA (`coreldraw/page.tsx`):**
  - Layout elástico substituindo o container fixo de 700px.
  - Botões rápidos de cópia de dados tabulados e download do arquivo `.bas` com feedback visual imediato.
- **Modais de Ação Rápida (Financeiro, Estoque, NF-e, WhatsApp):**
  - Substituição de modais ad-hoc pelos componentes padronizados do Design System, com rolagem interna e botões acessíveis no teclado móvel.

---

## 6. Estratégia de Testes e Verificação

1. **Validação Estática e Tipagem:**
   - Execução de `npm run typecheck` (`tsc --noEmit`) para garantir integridade e 0 erros de tipos TypeScript.
2. **Validação de Build:**
   - Execução de `npm run build` do Next.js para assegurar que todas as rotas continuem compilando perfeitamente no servidor e cliente.
3. **Verificação de Regressão de Negócio:**
   - Execução dos testes existentes em `tests/` para assegurar que regras de cálculo, permissões RBAC, serviços de CorelDRAW, NF-e e WhatsApp continuem funcionando sem alterações.
4. **Verificação de Responsividade:**
   - Validação da abertura e fechamento do menu no celular (`< 768px`).
   - Verificação de layout sem rolagem horizontal indesejada e sem sobreposição de textos.
