Attribute VB_Name = "modEntry"
Option Explicit

' ==============================================================================
' HEELCLOTH SPORTSWEAR — PONTO DE ENTRADA E ORQUESTRADOR COREL DRAW VBA
' Macros públicas: ProcessJob, ProcessNextJob, ProcessJobInteractive
' Garante: Lock atômico, imutabilidade de templates, zero contaminação e idempotência.
' ==============================================================================

Public Sub ProcessJob(ByVal jobFilePath As String)
    Dim startTime As Date
    startTime = Now
    
    Dim jobId As String, orderId As String, orderNumber As String
    Dim templateKey As String, templatePath As String
    Dim rootOutput As String, finalOutputDir As String, tempOutputDir As String
    Dim isDryRun As Boolean
    Dim tConfig As TemplateConfig
    Dim currentDoc As Document
    Dim errCode As String, errMsg As String
    Dim totalProcessed As Long, totalFailed As Long
    
    On Error GoTo TratarErroGeral
    
    ' 1. Valida existência do arquivo de Job
    If Not modFiles.FileExists(jobFilePath) Then
        modLog.LogError "UNKNOWN", "UNKNOWN", "", "FILE_CHECK", "Arquivo de job não encontrado: " & jobFilePath, "JOB_FILE_NOT_FOUND"
        Exit Sub
    End If
    
    ' 2. Lê o conteúdo do Job JSON
    Dim fNum As Integer, jsonContent As String
    fNum = FreeFile
    Open jobFilePath For Input As #fNum
    jsonContent = Input$(LOF(fNum), fNum)
    Close #fNum
    
    jobId = modJson.JsonGetString(jsonContent, "jobId")
    orderId = modJson.JsonGetString(jsonContent, "orderId")
    orderNumber = modJson.JsonGetString(jsonContent, "orderNumber")
    templateKey = modJson.JsonGetString(jsonContent, "templateKey", "gabarito_camisa_padrao")
    templatePath = modJson.JsonGetString(jsonContent, "templatePath")
    isDryRun = modJson.JsonGetBool(jsonContent, "dryRun", False)
    rootOutput = modJson.JsonGetString(jsonContent, "rootPath", "C:\Heelcloth\Outputs")
    
    If jobId = "" Or orderNumber = "" Then
        modLog.LogError jobId, orderId, "", "PARSE_JOB", "Job JSON inválido: jobId ou orderNumber ausentes.", "INVALID_JOB_STRUCTURE"
        Exit Sub
    End If
    
    If Right$(rootOutput, 1) <> "\" Then rootOutput = rootOutput & "\"
    finalOutputDir = rootOutput & orderNumber & "\"
    
    modLog.LogInit "C:\Heelcloth\Logs\"
    modLog.LogInfo jobId, orderId, "", "JOB_START", "Iniciando processamento do pedido " & orderNumber & " (dryRun=" & isDryRun & ")"
    
    ' 3. Adquire Lock Atômico
    If Not modJob.AcquireJobLock(rootOutput, jobId) Then
        modLog.LogWarn jobId, orderId, "", "LOCK", "Job já em execução concorrente em outra instância.", "JOB_LOCKED_CONCURRENT"
        Exit Sub
    End If
    
    ' 4. Validação de Idempotência
    Dim existingResult As String
    If modJob.CheckIdempotency(finalOutputDir, jobId, existingResult) Then
        modLog.LogInfo jobId, orderId, "", "IDEMPOTENCY", "Job já concluído com sucesso anteriormente. Retornando manifesto existente."
        modJob.ReleaseJobLock rootOutput, jobId
        Exit Sub
    End If
    
    ' 5. Configuração do Template e Placeholders Padrão
    tConfig.templateKey = templateKey
    tConfig.templatePath = templatePath
    tConfig.targetPageName = "GABARITO"
    tConfig.targetLayerName = "PERSONALIZACAO"
    tConfig.placeholders.namePlaceholder = "TXT_PLAYER_NAME"
    tConfig.placeholders.numberPlaceholder = "TXT_PLAYER_NUMBER"
    tConfig.placeholders.sizePlaceholder = "TXT_PLAYER_SIZE"
    tConfig.placeholders.modelPlaceholder = "TXT_PLAYER_MODEL"
    tConfig.maxNameLength = 24
    tConfig.maxNumberLength = 3
    
    ' Valida o template uma vez antes de iniciar lote
    Set currentDoc = Nothing
    If Not modTemplate.OpenTemplateAsCopySafely(templatePath, currentDoc, errCode, errMsg) Then
        modLog.LogError jobId, orderId, "", "TEMPLATE_VALIDATION", errMsg, errCode
        modJob.ReleaseJobLock rootOutput, jobId
        Exit Sub
    End If
    
    If Not modTemplate.ValidateTemplateStructure(currentDoc, tConfig, errCode, errMsg) Then
        currentDoc.Dirty = False
        currentDoc.Close
        modLog.LogError jobId, orderId, "", "TEMPLATE_VALIDATION", errMsg, errCode
        modJob.ReleaseJobLock rootOutput, jobId
        Exit Sub
    End If
    
    currentDoc.Dirty = False
    currentDoc.Close
    Set currentDoc = Nothing
    
    ' 6. Cria diretório temporário
    tempOutputDir = modFiles.CreateTempJobDirectory(rootOutput, jobId)
    
    ' 7. Processa Jogadores
    Dim playersBlock As String
    playersBlock = modJson.JsonGetArrayBlock(jsonContent, "players")
    
    ' Divide os objetos do array de jogadores
    Dim playerTokens() As String
    playerTokens = Split(playersBlock, "}")
    
    Dim generatedFilesJson As String
    generatedFilesJson = ""
    
    totalProcessed = 0
    totalFailed = 0
    
    Application.Optimization = True
    Application.EventsEnabled = False
    
    Dim i As Long
    For i = 0 To UBound(playerTokens)
        Dim pBlock As String
        pBlock = Trim$(playerTokens(i))
        If InStr(1, pBlock, "lineId") > 0 Then
            Dim lId As String, pIndex As Long, pName As String, pNum As String, pSize As String, pModel As String
            lId = modJson.JsonGetString(pBlock, "lineId")
            pIndex = modJson.JsonGetLong(pBlock, "playerIndex", totalProcessed + 1)
            pName = modJson.JsonGetString(pBlock, "name")
            pNum = modJson.JsonGetString(pBlock, "number")
            pSize = modJson.JsonGetString(pBlock, "size", "M")
            pModel = modJson.JsonGetString(pBlock, "model", "JOGADOR")
            
            ' Abre NOVA cópia não contaminada do template
            If Not modTemplate.OpenTemplateAsCopySafely(templatePath, currentDoc, errCode, errMsg) Then
                totalFailed = totalFailed + 1
                modLog.LogError jobId, orderId, lId, "RENDER_OPEN", errMsg, errCode
            Else
                ' Aplica dados do jogador
                If Not modRender.ApplyPlayerData(currentDoc, tConfig, pName, pNum, pSize, pModel, errCode, errMsg) Then
                    totalFailed = totalFailed + 1
                    modLog.LogError jobId, orderId, lId, "RENDER_APPLY", errMsg, errCode
                    currentDoc.Dirty = False
                    currentDoc.Close
                Else
                    Dim filePrefix As String
                    filePrefix = Format$(pIndex, "00") & "_" & modFiles.SanitizeFileName(pNum) & "_" & modFiles.SanitizeFileName(pName)
                    
                    Dim outCdrPath As String, outPdfPath As String
                    outCdrPath = tempOutputDir & filePrefix & ".cdr"
                    outPdfPath = tempOutputDir & filePrefix & ".pdf"
                    
                    Dim cdrOk As Boolean, pdfOk As Boolean
                    cdrOk = True
                    pdfOk = True
                    
                    If Not isDryRun Then
                        cdrOk = modFiles.SaveCdrDocument(currentDoc, outCdrPath, errCode, errMsg)
                        If cdrOk Then
                            pdfOk = modFiles.ExportPdfDocument(currentDoc, outPdfPath, errCode, errMsg)
                        End If
                    End If
                    
                    currentDoc.Dirty = False
                    currentDoc.Close
                    Set currentDoc = Nothing
                    
                    If cdrOk And pdfOk Then
                        totalProcessed = totalProcessed + 1
                        
                        Dim finalCdrPath As String, finalPdfPath As String
                        finalCdrPath = finalOutputDir & filePrefix & ".cdr"
                        finalPdfPath = finalOutputDir & filePrefix & ".pdf"
                        
                        Dim itemJson As String
                        itemJson = "{" & _
                            """lineId"":""" & modJson.JsonEscape(lId) & """," & _
                            """playerName"":""" & modJson.JsonEscape(pName) & """," & _
                            """playerNumber"":""" & modJson.JsonEscape(pNum) & """," & _
                            """cdrPath"":""" & modJson.JsonEscape(finalCdrPath) & """," & _
                            """pdfPath"":""" & modJson.JsonEscape(finalPdfPath) & """," & _
                            """fileSizeBytes"":" & modFiles.GetFileSize(outCdrPath) & "," & _
                            """exportedAt"":""" & modLog.GetUtcNowIso() & """" & _
                            "}"
                            
                        If generatedFilesJson <> "" Then generatedFilesJson = generatedFilesJson & ","
                        generatedFilesJson = generatedFilesJson & itemJson
                    Else
                        totalFailed = totalFailed + 1
                        modLog.LogError jobId, orderId, lId, "EXPORT", errMsg, errCode
                    End If
                End If
            End If
        End If
    Next i
    
    Application.Optimization = False
    Application.EventsEnabled = True
    
    ' 8. Promoção dos arquivos e criação do manifesto
    Dim overallStatus As String
    If totalFailed = 0 And totalProcessed > 0 Then
        overallStatus = "succeeded"
    ElseIf totalProcessed > 0 And totalFailed > 0 Then
        overallStatus = "partial"
    Else
        overallStatus = "failed"
    End If
    
    If Not isDryRun And overallStatus <> "failed" Then
        modFiles.PromoteTempFiles tempOutputDir, finalOutputDir
    End If
    
    ' Limpa pasta temporária
    modFiles.CleanDirectory tempOutputDir
    
    Dim durationMs As Long
    durationMs = DateDiff("s", startTime, Now) * 1000
    
    Dim manifestJson As String
    manifestJson = "{" & _
        """jobId"":""" & modJson.JsonEscape(jobId) & """," & _
        """orderId"":""" & modJson.JsonEscape(orderId) & """," & _
        """orderNumber"":""" & modJson.JsonEscape(orderNumber) & """," & _
        """templateKey"":""" & modJson.JsonEscape(templateKey) & """," & _
        """status"":""" & overallStatus & """," & _
        """attempt"":1," & _
        """startedAt"":""" & modLog.GetUtcNowIso() & """," & _
        """finishedAt"":""" & modLog.GetUtcNowIso() & """," & _
        """durationMs"":" & durationMs & "," & _
        """totalPlayers"":" & (totalProcessed + totalFailed) & "," & _
        """processedPlayers"":" & totalProcessed & "," & _
        """generatedFiles"":[" & generatedFilesJson & "]," & _
        """warnings"":[]," & _
        """errors"":[]," & _
        """dryRun"":" & LCase$(CStr(isDryRun)) & _
        "}"
        
    modJob.SaveManifestFile finalOutputDir, manifestJson
    modJob.ReleaseJobLock rootOutput, jobId
    
    modLog.LogInfo jobId, orderId, "", "JOB_END", "Job concluído com status " & overallStatus & " (" & totalProcessed & " jogadores processados)."
    Exit Sub

TratarErroGeral:
    Application.Optimization = False
    Application.EventsEnabled = True
    If Not currentDoc Is Nothing Then
        On Error Resume Next
        currentDoc.Dirty = False
        currentDoc.Close
        On Error GoTo 0
    End If
    modJob.ReleaseJobLock rootOutput, jobId
    modLog.LogError jobId, orderId, "", "FATAL", "Erro fatal na execução do job: " & Err.Description, "FATAL_JOB_CRASH"
End Sub

Public Sub ProcessNextJob()
    Dim pendingDir As String, fName As String
    pendingDir = "C:\Heelcloth\Jobs\Pending\"
    
    If Not modFiles.FileExists(pendingDir) Then
        modFiles.EnsureDirectoryExists pendingDir
    End If
    
    fName = Dir$(pendingDir & "*.json")
    If fName <> "" Then
        ProcessJob pendingDir & fName
    Else
        MsgBox "Nenhum job pendente encontrado em " & pendingDir, vbInformation, "Heelcloth CorelDRAW"
    End If
End Sub

Public Sub ProcessJobInteractive()
    Dim jobPath As String
    jobPath = CorelScriptTools.GetFileBox("Arquivos de Job JSON (*.json)|*.json|Todos os Arquivos (*.*)|*.*", "Selecione o Job do Heelcloth SaaS", 0)
    If jobPath <> "" Then
        ProcessJob jobPath
    End If
End Sub
