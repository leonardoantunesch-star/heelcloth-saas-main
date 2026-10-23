# Automação de Personalização no CorelDRAW — Heelcloth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

## Visão Geral & Fase 0 (Relatório de Descoberta)

Após a inspeção detalhada da codebase:
1. **Stack**: Next.js 15 (App Router, TypeScript), Prisma ORM com SQLite (`DATABASE_URL="file:./dev.db"`), JWT Auth (`src/lib/auth.ts`).
2. **Entidades Existentes**:
   - `Order`: id, orderNumber (ex: `HC-2603-0001`), customerId, status, attachments (JSON array de strings com links/caminhos de artes).
   - `OrderPlayer`: id, orderId, playerIndex, name, number, size, model, notes, shortSize, options.
   - `ProductionOrder`: id, orderId, currentStage (`ARTE`, `CORTE`, `PERSONALIZACAO`, etc.), stageStatus (`PENDENTE`, `EM_ANDAMENTO`, `CONCLUIDO`), responsible, notes.
   - `JobCorelDraw` e `JogadorCorel`: definidos em `src/services/coreldraw/types.ts`.
3. **Mecanismo Existente**:
   - O SaaS já possui `GET /api/coreldraw` e `GET /api/coreldraw/[orderId]` com tela administrativa em `src/app/admin/coreldraw/page.tsx`.
   - Não há filas externas nem mensageria. A integração opera por entrega de job snapshot e ingestão de manifesto de resultado via HTTP ou troca por diretório de arquivos local.
4. **Decisão de Arquitetura**:
   - **Zero tabelas duplicadas ou credenciais no VBA**.
   - O SaaS exporta/entrega um **Job Snapshot JSON** imutável.
   - O CorelDRAW executa a suite VBA modular com leitura de job, lock local, abertura segura como cópia (`OpenDocumentAsCopy`), busca recursiva de placeholders em grupos/camadas, exportação de `.cdr` e `.pdf`, e emissão do manifesto de resultado `result.json`.
   - O SaaS recebe o manifesto e atualiza `attachments` do pedido e a esteira em `ProductionOrder`.

---

## Estrutura de Arquivos Planejada

### 1. Módulos VBA CorelDRAW (`vba/coreldraw/`)
- `vba/coreldraw/modEntry.bas`: Ponto de entrada (`ProcessJob`, `ProcessNextJob`).
- `vba/coreldraw/modJob.bas`: Leitura do snapshot do job, lock local idempotente e geração do manifesto.
- `vba/coreldraw/modTemplate.bas`: Validação de caminhos, abertura segura como cópia (`OpenDocumentAsCopy`), busca recursiva de placeholders.
- `vba/coreldraw/modRender.bas`: Aplicação de nome, número, tamanho e modelo com isolamento entre jogadores.
- `vba/coreldraw/modFiles.bas`: Sanitização de nomes, criação de pastas, salvamento `.cdr` e exportação `.pdf`.
- `vba/coreldraw/modLog.bas`: Logs UTF-8 estruturados (JSON lines).
- `vba/coreldraw/modJson.bas`: Parser e formatador JSON nativo em VBA sem dependências externas COM.

### 2. Configurações e Fixtures
- `vba/config/templates-config.json`: Configuração versionada de templates, placeholders e regras de saída.
- `vba/fixtures/sample-job.json`: Exemplo de snapshot de job idempotente.
- `vba/fixtures/sample-result.json`: Exemplo de manifesto de resultado emitido pelo VBA.

### 3. Extensões no SaaS (Next.js)
- `src/services/coreldraw/job-contract.ts`: Tipos TypeScript do snapshot e manifesto.
- `src/app/api/coreldraw/[orderId]/job/route.ts`: Endpoint para download/geração do `job.json`.
- `src/app/api/coreldraw/[orderId]/resultado/route.ts`: Endpoint para ingestão do manifesto de resultado, avanço da esteira e atualização de `attachments`.
- `src/app/admin/coreldraw/page.tsx`: Integração visual para download de Job Snapshot e upload/importação de manifesto.

### 4. Documentação & Testes
- `docs/COREL_DRAW_AUTOMATION.md`: README completo em português com convenções de nomes no CorelDRAW, instalação da macro, APIs usadas e guia de operação.
- `tests/coreldraw-automation.test.mjs`: Suíte de testes automatizados com os 9 cenários obrigatórios.

---

## Tarefas de Implementação

- [ ] **Tarefa 1: Definir os Contratos de Job e Resultado no SaaS**
  - Criar `src/services/coreldraw/job-contract.ts` com interfaces `CorelJobSnapshot`, `CorelPlayerSnapshot`, `CorelJobResult`, `CorelGeneratedFile`, `CorelTemplateConfig`.
  - Atualizar `src/services/coreldraw/index.ts` com método `gerarJobSnapshot(orderId)`.
  - Teste: `tests/coreldraw-contract.test.mjs`.

- [ ] **Tarefa 2: Criar Configuração de Template e Fixtures**
  - Criar `vba/config/templates-config.json` com convenção de placeholders:
    `TXT_PLAYER_NAME`, `TXT_PLAYER_NUMBER`, `TXT_PLAYER_SIZE`, `TXT_PLAYER_MODEL`.
  - Criar `vba/fixtures/sample-job.json` e `vba/fixtures/sample-result.json`.

- [ ] **Tarefa 3: Implementar Módulos VBA CorelDRAW (`modJson`, `modLog`, `modFiles`)**
  - Implementar `modJson.bas`: Leitor e gerador de JSON em VBA.
  - Implementar `modLog.bas`: Gravador de logs estruturados em JSON lines UTF-8 com timestamps UTC e sem segredos.
  - Implementar `modFiles.bas`: Sanitização de caminhos no Windows, criação de pastas recursiva, salvamento `.cdr` e exportação `.pdf`.

- [ ] **Tarefa 4: Implementar Módulos VBA CorelDRAW (`modTemplate`, `modRender`, `modJob`, `modEntry`)**
  - Implementar `modTemplate.bas`: Abertura segura como cópia (`OpenDocumentAsCopy`), busca recursiva de placeholders em camadas/grupos (`Shapes.FindShapes`), validações de shape e tipo texto.
  - Implementar `modRender.bas`: Aplicação de strings preservando estilos de texto artísticos, prevenção de contaminação entre jogadores.
  - Implementar `modJob.bas`: Validação de lock local por `jobId`, idempotência através do manifesto existente, geração do manifesto final.
  - Implementar `modEntry.bas`: Macros públicas `ProcessJob(ByVal jobPath As String)` e `ProcessNextJob()`.

- [ ] **Tarefa 5: Implementar Rotas no SaaS para Entrega de Job e Ingestão de Resultado**
  - Criar `src/app/api/coreldraw/[orderId]/job/route.ts` (retorna o Job Snapshot JSON para o worker/VBA).
  - Criar `src/app/api/coreldraw/[orderId]/resultado/route.ts` (recebe o manifesto, valida integridade, anexa arquivos ao pedido e avança etapa de produção).
  - Atualizar `src/app/admin/coreldraw/page.tsx` com botões para baixar o Job Snapshot e importar resultado.

- [ ] **Tarefa 6: Suíte de Testes Automatizados dos 9 Cenários**
  - Criar `tests/coreldraw-automation.test.mjs` cobrindo:
    1. Vários jogadores, incluindo número `00`, acentos e nomes compostos.
    2. Placeholders dentro de grupos e busca recursiva.
    3. Placeholders ausentes, duplicados ou de tipo incorreto.
    4. Caminho de template inexistente e fontes.
    5. Falha de exportação com resultado `partial`/`failed`.
    6. Idempotência: reexecução do mesmo `jobId`.
    7. Retentativa de erro transitório.
    8. Preservação estrita do arquivo de template original (imutabilidade).
    9. Validação de integridade dos arquivos gerados (existência e tamanho > 0).

- [ ] **Tarefa 7: Elaborar Documentação Oficial em Português**
  - Criar `docs/COREL_DRAW_AUTOMATION.md` contendo:
    - Pré-requisitos e versões do CorelDRAW compatíveis.
    - Como nomear os objetos no Object Manager (`TXT_PLAYER_NAME`, etc.).
    - Como importar os módulos `.bas` no CorelDRAW via Macro Manager (ALT+F11).
    - Guia de execução pontual e fila local.
    - Lista de APIs do CorelDRAW com URLs oficiais da documentação da Corel.
