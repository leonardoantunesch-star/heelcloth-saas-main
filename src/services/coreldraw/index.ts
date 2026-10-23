import { JobCorelDraw, JogadorCorel, StatusJobCorel } from "./types";

/**
 * Converte a lista de jogadores no formato tab-delimited
 * padrão exigido pela macro VBA do CorelDRAW:
 * Colunas: Nome [TAB] Número [TAB] Camisa [TAB] Obs [TAB] Short [TAB] Opções
 */
export function formatarParaVba(
  jogadores: Array<{
    name?: string;
    nome?: string;
    number?: string;
    numero?: string;
    size?: string;
    tamanho?: string;
    model?: string;
    modelo?: string;
    notes?: string | null;
    observacoes?: string | null;
    shortSize?: string | null;
    options?: string | null;
  }>
): string {
  return jogadores
    .map((j) => {
      const nome = (j.name || j.nome || "").trim().toUpperCase();
      const numero = (j.number || j.numero || "").trim();
      const tamanho = (j.size || j.tamanho || "M").trim().toUpperCase();
      const obs = (j.notes || j.observacoes || "").trim().toUpperCase();
      const short = (j.shortSize || "").trim().toUpperCase();
      const opcoes = (j.model || j.modelo || "PADRAO").trim().toUpperCase();

      return [nome, numero, tamanho, obs, short, opcoes].join("\t");
    })
    .join("\n");
}

/**
 * Código-fonte da Macro VBA padrão Heelcloth para CorelDRAW (Versões X7 / 2020 / 2024)
 * Cria automaticamente páginas ou duplica o gabarito preenchendo NOME e NÚMERO
 */
export function gerarMacroVbaPadrao(): string {
  return `' ==============================================================================
' HEELCLOTH SPORTSWEAR - MACRO DE AUTOMAÇÃO DE UNIFORMES COREL DRAW
' Compatibilidade: CorelDRAW X7 / 2018 / 2020 / 2022 / 2024
' Instruções de Instalação:
' 1. No CorelDRAW, pressione ALT + F11 para abrir o Editor VBA.
' 2. Vá em Inserir -> Módulo e cole este código.
' 3. Volte ao CorelDRAW e execute a macro "GerarCamisasHeelcloth".
' ==============================================================================

Public Sub GerarCamisasHeelcloth()
    Dim arqCaminho As String
    Dim arqNum As Integer
    Dim linhaTexto As String
    Dim dadosLinha() As String
    Dim nomeJogador As String
    Dim numJogador As String
    Dim tamCamisa As String
    Dim obsTexto As String
    Dim tamShort As String
    Dim modeloTexto As String
    Dim totalProcessadas As Long
    Dim docAtivo As Document
    Dim pgAtiva As Page
    Dim shpNome As Shape
    Dim shpNum As Shape
    Dim s As Shape

    On Error GoTo TratarErro

    ' Selecionar arquivo de dados exportado do Heelcloth SaaS
    arqCaminho = CorelScriptTools.GetFileBox("Arquivos Heelcloth (*.txt)|*.txt|Todos os Arquivos (*.*)|*.*", "Selecione o arquivo de dados Heelcloth", 0)
    If arqCaminho = "" Then Exit Sub

    Set docAtivo = ActiveDocument
    If docAtivo Is Nothing Then
        MsgBox "Abra o gabarito da camisa no CorelDRAW antes de executar a macro!", vbExclamation, "Heelcloth"
        Exit Sub
    End If

    docAtivo.BeginCommandGroup "Automação Camisas Heelcloth"
    Optimization = True

    arqNum = FreeFile
    Open arqCaminho For Input As #arqNum

    totalProcessadas = 0

    Do While Not EOF(arqNum)
        Line Input #arqNum, linhaTexto
        If Trim(linhaTexto) <> "" Then
            dadosLinha = Split(linhaTexto, vbTab)
            
            nomeJogador = ""
            numJogador = ""
            tamCamisa = "M"
            obsTexto = ""
            tamShort = ""
            modeloTexto = ""

            If UBound(dadosLinha) >= 0 Then nomeJogador = Trim(dadosLinha(0))
            If UBound(dadosLinha) >= 1 Then numJogador = Trim(dadosLinha(1))
            If UBound(dadosLinha) >= 2 Then tamCamisa = Trim(dadosLinha(2))
            If UBound(dadosLinha) >= 3 Then obsTexto = Trim(dadosLinha(3))
            If UBound(dadosLinha) >= 4 Then tamShort = Trim(dadosLinha(4))
            If UBound(dadosLinha) >= 5 Then modeloTexto = Trim(dadosLinha(5))

            ' Duplica a página ativa de gabarito para a nova camisa
            Set pgAtiva = docAtivo.DuplicatePage(docAtivo.ActivePage)
            pgAtiva.Name = numJogador & " - " & nomeJogador & " (" & tamCamisa & ")"

            ' Procura os textos nomeados ou marcados na página
            For Each s In pgAtiva.Shapes.FindShapes(Type:=cdrTextShape)
                ' Se o shape tiver nome "NOME" ou contiver texto exemplo
                If InStr(1, UCase(s.Name), "NOME") > 0 Or s.Text.Story.Text = "NOME" Or s.Text.Story.Text = "JOGADOR" Then
                    s.Text.Story.Text = nomeJogador
                ' Se o shape tiver nome "NUMERO" ou for numérico
                ElseIf InStr(1, UCase(s.Name), "NUM") > 0 Or s.Text.Story.Text = "10" Or s.Text.Story.Text = "00" Then
                    s.Text.Story.Text = numJogador
                End If
            Next s

            totalProcessadas = totalProcessadas + 1
        End If
    Loop

    Close #arqNum
    Optimization = False
    ActiveWindow.Refresh
    docAtivo.EndCommandGroup

    MsgBox "Sucesso! " & totalProcessadas & " camisas foram geradas automaticamente pelo Heelcloth!", vbInformation, "Heelcloth CorelDRAW"
    Exit Sub

TratarErro:
    Optimization = False
    If arqNum > 0 Then Close #arqNum
    MsgBox "Erro ao processar: " & Err.Description, vbCritical, "Erro Heelcloth"
End Sub
`;
}

export class CorelDrawService {
  criarPayloadApi(job: JobCorelDraw) {
    return {
      jobId: job.id,
      pedido: job.numeroPedido,
      total: job.totalPecas,
      template: job.templateArquivo,
      itens: job.jogadores.map((j) => ({
        nome: j.nome,
        numero: j.numero,
        tamanho: j.tamanho,
        modelo: j.modelo,
        tipo: j.tipoCamisa,
      })),
    };
  }

  criarJobSnapshot = gerarJobSnapshot;
}

export function gerarJobSnapshot(
  order: {
    id: string;
    orderNumber: string;
    customer?: { name?: string | null } | null;
    players: Array<{
      id: string;
      playerIndex: number;
      name: string;
      number: string;
      size: string;
      model: string;
      notes?: string | null;
      shortSize?: string | null;
      options?: string | null;
    }>;
  },
  options?: {
    templateKey?: string;
    templatePath?: string;
    rootPath?: string;
    formats?: Array<"cdr" | "pdf" | "eps" | "plt">;
    dryRun?: boolean;
    attempt?: number;
  }
) {
  return {
    jobId: `job_${order.orderNumber.replace(/[^A-Za-z0-9]/g, "_")}_${Date.now()}`,
    attempt: options?.attempt || 1,
    orderId: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customer?.name || "Cliente",
    templateKey: options?.templateKey || "gabarito_camisa_padrao",
    templatePath: options?.templatePath || "C:\\Heelcloth\\Templates\\gabarito_camisa_padrao.cdr",
    dryRun: !!options?.dryRun,
    output: {
      rootPath: options?.rootPath || "C:\\Heelcloth\\Outputs",
      formats: options?.formats || ["cdr", "pdf"],
    },
    players: order.players.map((p) => ({
      lineId: p.id,
      playerIndex: p.playerIndex,
      name: p.name.trim().toUpperCase(),
      number: p.number.trim(),
      size: p.size.trim().toUpperCase(),
      model: p.model.trim().toUpperCase(),
      notes: p.notes ? p.notes.trim() : null,
      shortSize: p.shortSize ? p.shortSize.trim().toUpperCase() : null,
      options: p.options || null,
    })),
    createdAt: new Date().toISOString(),
  };
}

export const corelDrawService = new CorelDrawService();
export * from "./types";
export * from "./job-contract";
