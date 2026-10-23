# Automação de Produção e Personalização no CorelDRAW — Heelcloth Sportswear

Guia técnico de referência e operação para automação de uniformes e camisas esportivas personalizadas com CorelDRAW e VBA (Visual Basic for Applications).

---

## 1. Visão Geral da Arquitetura

O ecossistema Heelcloth divide as responsabilidades em duas camadas independentes:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        HEELCLOTH SAAS (CLOUD/LOCAL)                    │
│                                                                        │
│  - Gestão de Pedidos (Order, OrderPlayer, ProductionOrder)             │
│  - Exportação de Job Snapshot JSON imutável                            │
│  - Ingestão do Manifesto de Resultado (result.json)                    │
│  - Vinculação dos arquivos em attachments e avanço da esteira          │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ Job Snapshot JSON
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     ESTAÇÃO COREL DRAW (LOCAL WORKER)                  │
│                                                                        │
│  - Leitura do snapshot (job_*.json)                                    │
│  - Lock atômico por jobId contra execuções concorrentes                │
│  - Abertura de gabarito como cópia estrita (OpenDocumentAsCopy)        │
│  - Localização recursiva de shapes (FindShapes e navegação em grupos)  │
│  - Renderização isolada por jogador (zero contaminação)                │
│  - Gravação atômica em duas fases (.tmp -> final)                      │
│  - Exportação de .cdr e .pdf                                           │
│  - Emissão de manifesto rastreável (result.json)                       │
│  - Logs estruturados UTF-8 em JSON lines                               │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ result.json
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        RETORNO / FEEDBACK AO SAAS                      │
│  - Upload via UI do SaaS ("Importar Resultado") ou POST HTTP           │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Compatibilidade e Pré-Requisitos

- **Versões Testadas do CorelDRAW:**
  - CorelDRAW Graphics Suite X7 (17.x)
  - CorelDRAW 2018 (20.x)
  - CorelDRAW 2020 (22.x)
  - CorelDRAW 2022 (24.x)
  - CorelDRAW 2024 (25.x)
- **Arquitetura do Sistema Operacional:** 32-bit e 64-bit.
  - *Nota técnica:* A suíte modular Heelcloth foi construída com parser JSON nativo em VBA (`modJson.bas`), **sem dependências de DLLs COM obsoletas** (como `MSScriptControl.ScriptControl`), operando nativamente em CorelDRAW 64-bit.
- **Estrutura de Pastas no Windows:**
  - `C:\Heelcloth\Templates\` — Gabaritos mestres de arte (.cdr).
  - `C:\Heelcloth\Outputs\` — Pasta de saída dos arquivos gerados.
  - `C:\Heelcloth\Logs\` — Registros de auditoria e logs estruturados em JSON lines.
  - `C:\Heelcloth\Jobs\Pending\` — Fila de snapshots aguardando processamento.

---

## 3. Convenção de Nomes no CorelDRAW (Object Manager)

Para que a automação localize e altere os campos de texto sem risco de contaminação ou ambiguidade, renomeie os objetos no **Object Manager** (Gerenciador de Objetos) do CorelDRAW conforme a tabela:

| Nome do Objeto no CorelDRAW | Tipo Obrigatório | Descrição / Uso | Obrigatório? |
| :--- | :--- | :--- | :--- |
| `TXT_PLAYER_NAME` | Texto Artístico (`cdrTextShape`) | Nome do atleta impresso nas costas | **Sim** |
| `TXT_PLAYER_NUMBER` | Texto Artístico (`cdrTextShape`) | Número do atleta impresso nas costas | **Sim** |
| `TXT_PLAYER_SIZE` | Texto Artístico (`cdrTextShape`) | Tamanho da peça (ex: P, M, G, GG, XG) | Opcional |
| `TXT_PLAYER_MODEL` | Texto Artístico (`cdrTextShape`) | Modelo/corte (ex: JOGADOR, GOLEIRO) | Opcional |

### Regras Críticas de Design do Gabarito:
1. **Suporte a Grupos Aninhados:** Os placeholders podem estar dentro de grupos (`cdrGroupShape`) ou camadas personalizadas (ex: grupo `COSTAS` contendo o subgrupo `ESTAMPA`). O algoritmo faz varredura em profundidade (DFS recursivo).
2. **Unicidade de Placeholders:** Não deve haver dois objetos com o mesmo nome identificador (ex: dois objetos chamados `TXT_PLAYER_NAME`) na mesma página ou grupo do gabarito. Caso isso ocorra, o sistema aborta com o erro `TEMPLATE_PLACEHOLDER_AMBIGUOUS`.
3. **Tipo Texto:** O objeto deve ser criado com a ferramenta de Texto Artístico (`Text Tool`). Se um retângulo ou curva for renomeado como `TXT_PLAYER_NAME`, o sistema emitirá `TEMPLATE_PLACEHOLDER_NOT_TEXT`.

---

## 4. Instalação dos Módulos VBA no CorelDRAW

1. Abra o **CorelDRAW**.
2. Pressione o atalho <kbd>ALT</kbd> + <kbd>F11</kbd> para abrir o **Editor do Visual Basic for Applications (VBA)**.
3. No painel **Project Explorer** (lado esquerdo), localize o projeto do documento ou `GlobalMacros` (para tornar a macro permanente em todas as sessões).
4. Clique com o botão direito sobre a pasta **Modules** e selecione **Import File...** (<kbd>CTRL</kbd> + <kbd>M</kbd>).
5. Importe os 7 módulos da pasta `vba/coreldraw/` do repositório:
   - `modJson.bas`
   - `modLog.bas`
   - `modFiles.bas`
   - `modTemplate.bas`
   - `modRender.bas`
   - `modJob.bas`
   - `modEntry.bas`
6. Vá em **Debug > Compile Project** para validar a integridade. Salve o projeto no VBA e feche a janela do editor.

---

## 5. Modos de Execução da Automação

### Modo 1: Execução Interativa (Com Diálogo de Arquivo)
Ideal para o operador gráfico que baixa o arquivo `job_*.json` do SaaS e quer disparar a execução manualmente:
1. No CorelDRAW, pressione <kbd>ALT</kbd> + <kbd>F8</kbd> (Janela de Macros).
2. Na caixa *Macros in*, selecione `All Standard Projects`.
3. Selecione a macro **`modEntry.ProcessJobInteractive`** e clique em **Run**.
4. Uma janela do Windows Explorer abrirá para você selecionar o arquivo `.json` do Job baixado da plataforma Heelcloth.

### Modo 2: Execução Direta por Linha de Comando ou Macro
Chame a macro principal passando o caminho absoluto do arquivo:
```vba
modEntry.ProcessJob "C:\Heelcloth\Jobs\job_HC_2603_0001_1740000000.json"
```

### Modo 3: Processamento em Fila / Pasta Monitorada
Para estações de produção dedicadas, coloque os arquivos de job em `C:\Heelcloth\Jobs\Pending\`.
Execute a macro:
```vba
modEntry.ProcessNextJob
```
A macro localiza o primeiro arquivo `.json` da pasta, executa a produção completa e move o job concluído para `C:\Heelcloth\Jobs\Done\`.

---

## 6. Mecanismos de Segurança e Integridade

### A. Imutabilidade Absoluta do Gabarito Mestre
- A automação **nunca** abre o gabarito original no modo normal.
- Utiliza a API `Application.OpenDocumentAsCopy(templatePath)`.
- A cada novo jogador da grade, uma cópia nova é instanciada e, após a exportação, fechada com `doc.Dirty = False` sem salvar sobre o original.
- O hash SHA-256 e o timestamp do gabarito permanecem 100% inalterados.

### B. Isolamento de Jogadores (Zero Contaminação)
- Cada jogador é renderizado a partir de uma cópia limpa do gabarito.
- Evita que estilos, fontes, tamanhos de caixa ou efeitos aplicados no jogador anterior vazem para o próximo.

### C. Lock Atômico Concorrente
- Ao iniciar, o sistema cria o arquivo `C:\Heelcloth\Outputs\{jobId}.lock`.
- Se outra instância do CorelDRAW tentar processar o mesmo `jobId` simultaneamente, a tentativa é rejeitada com código `JOB_LOCKED_CONCURRENT`.
- Ao finalizar, o lock é liberado automaticamente.

### D. Idempotência
- Se um job for reexecutado com o mesmo `jobId`, a rotina consulta `CheckIdempotency`.
- Se o arquivo `result.json` já existir com status `succeeded`, a rotina não gasta tempo gerando arquivos repetidos e retorna imediatamente o manifesto original.

### E. Saída Atômica em Duas Fases
- Todos os arquivos do lote são gerados primeiramente em uma pasta oculta temporária:
  `C:\Heelcloth\Outputs\.tmp_{jobId}\`
- Apenas se todo o processamento terminar com integridade os arquivos são promovidos para a pasta definitiva:
  `C:\Heelcloth\Outputs\{orderNumber}\`
- Se houver falha crítica, a pasta temporária é limpa e o sistema grava o status `failed` ou `partial` no manifesto sem publicar arquivos quebrados.

---

## 7. Catálogo de APIs Oficiais do CorelDRAW Utilizadas

| API / Método / Propriedade | Assinatura no CorelDRAW | Finalidade no Heelcloth | Documentação Oficial |
| :--- | :--- | :--- | :--- |
| `OpenDocumentAsCopy` | `Application.OpenDocumentAsCopy(FileName As String)` | Abre uma cópia isolada na memória sem risco ao template mestre | [Corel API: OpenDocumentAsCopy](https://coreldraw.com/community/developer/api/17/Application.OpenDocumentAsCopy) |
| `FindShapes` | `Shapes.FindShapes(Name As String, Type As cdrShapeType, ...)` | Busca recursiva de elementos no Object Manager por nome | [Corel API: FindShapes](https://coreldraw.com/community/developer/api/17/Shapes.FindShapes) |
| `SaveAs` | `Document.SaveAs(FileName, Options)` | Gravação determinística de arquivo nativo `.cdr` | [Corel API: SaveAs](https://coreldraw.com/community/developer/api/17/Document.SaveAs) |
| `ExportEx` | `Document.ExportEx(FileName, cdrPDF, ...)` | Exportação vetorial em `.pdf` para impressão | [Corel API: ExportEx](https://coreldraw.com/community/developer/api/17/Document.ExportEx) |
| `Text.Story.Text` | `Shape.Text.Story.Text = "VALOR"` | Substituição do texto preservando fontes, kerning e efeitos | [Corel API: Text.Story](https://coreldraw.com/community/developer/api/17/Text.Story) |
| `Optimization` | `Application.Optimization = True` | Desativa atualizações de tela durante o processamento para máxima velocidade | [Corel API: Optimization](https://coreldraw.com/community/developer/api/17/Optimization) |

---

## 8. Tabela de Códigos de Erro

| Código de Erro | Causa Provável | Ação Recomendada |
| :--- | :--- | :--- |
| `JOB_FILE_NOT_FOUND` | O caminho do arquivo `.json` informado não existe | Verificar caminho passado para `ProcessJob` |
| `JOB_LOCKED_CONCURRENT` | O mesmo job já está sendo processado em outra janela | Aguardar término ou remover `.lock` órfão |
| `TEMPLATE_FILE_NOT_FOUND` | Gabarito `.cdr` não encontrado no disco | Checar se o arquivo existe em `C:\Heelcloth\Templates\` |
| `TEMPLATE_PLACEHOLDER_NOT_FOUND` | Não há objeto `TXT_PLAYER_NAME` ou `TXT_PLAYER_NUMBER` | Renomear a caixa de texto no Object Manager do CorelDRAW |
| `TEMPLATE_PLACEHOLDER_AMBIGUOUS` | Mais de um objeto com o mesmo nome no gabarito | Manter apenas um objeto por identificador |
| `TEMPLATE_PLACEHOLDER_NOT_TEXT` | O objeto encontrado é um retângulo, círculo ou curva | Criar um elemento de Texto Artístico e renomear |
| `EXPORT_CDR_FAILED` | Erro ao gravar arquivo `.cdr` (permissão ou disco) | Verificar espaço em disco e permissões de escrita |
| `EXPORT_PDF_FAILED` | Erro no filtro de exportação PDF | Verificar configurações do filtro PDF do CorelDRAW |

---

## 9. Fluxo de Importação no SaaS

1. Acesse o painel administrativo do Heelcloth em `/admin/coreldraw`.
2. Selecione o pedido desejado na lista lateral.
3. Clique em **"Job JSON"** para baixar o snapshot do pedido.
4. Execute a macro no CorelDRAW apontando para o arquivo baixado.
5. Ao concluir, clique em **"Importar Resultado"** no SaaS e selecione o arquivo `result.json` gerado na pasta do pedido.
6. O SaaS automaticamente:
   - Vincula os arquivos `.cdr` e `.pdf` aos `attachments` do pedido.
   - Atualiza o status da esteira em `ProductionOrder` para `CONCLUIDO`.
   - Registra um evento de auditoria detalhado no `AuditLog`.
