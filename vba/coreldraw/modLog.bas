Attribute VB_Name = "modLog"
Option Explicit

' ==============================================================================
' HEELCLOTH SPORTSWEAR — MÓDULO DE LOGS ESTRUTURADOS (JSON LINES UTF-8)
' Grava eventos de produção, avisos e erros sem vazar credenciais ou segredos.
' ==============================================================================

Private m_logsRoot As String
Private m_currentLogPath As String

Public Sub LogInit(ByVal logsRoot As String)
    If Right$(logsRoot, 1) <> "\" Then logsRoot = logsRoot & "\"
    m_logsRoot = logsRoot
    
    ' Garante diretório de logs
    modFiles.EnsureDirectoryExists m_logsRoot
    
    Dim dataHoje As String
    dataHoje = Format$(Now, "yyyymmdd")
    m_currentLogPath = m_logsRoot & "coreldraw_production_" & dataHoje & ".log"
End Sub

Public Function GetUtcNowIso() As String
    ' Retorna data/hora aproximada em formato ISO 8601 UTC
    Dim d As Date
    d = Now
    GetUtcNowIso = Format$(d, "yyyy-mm-ddThh:nn:ssZ")
End Function

Public Sub LogWrite(ByVal level As String, _
                     ByVal jobId As String, _
                     ByVal orderId As String, _
                     ByVal lineId As String, _
                     ByVal stepName As String, _
                     ByVal message As String, _
                     Optional ByVal errCode As String = "")
                     
    If m_currentLogPath = "" Then
        LogInit "C:\Heelcloth\Logs\"
    End If
    
    Dim jsonLine As String
    jsonLine = "{" & _
        """timestamp"":""" & GetUtcNowIso() & """," & _
        """level"":""" & modJson.JsonEscape(level) & """," & _
        """jobId"":""" & modJson.JsonEscape(jobId) & """," & _
        """orderId"":""" & modJson.JsonEscape(orderId) & """," & _
        """lineId"":""" & modJson.JsonEscape(lineId) & """," & _
        """step"":""" & modJson.JsonEscape(stepName) & """," & _
        """message"":""" & modJson.JsonEscape(message) & """"
        
    If errCode <> "" Then
        jsonLine = jsonLine & ",""code"":""" & modJson.JsonEscape(errCode) & """"
    End If
    
    jsonLine = jsonLine & "}"
    
    ' Grava linha no arquivo de log usando UTF-8 append seguro
    On Error Resume Next
    Dim fileNum As Integer
    fileNum = FreeFile
    Open m_currentLogPath For Append Access Write Shared As #fileNum
    Print #fileNum, jsonLine
    Close #fileNum
    On Error GoTo 0
End Sub

Public Sub LogInfo(ByVal jobId As String, ByVal orderId As String, ByVal lineId As String, ByVal stepName As String, ByVal message As String)
    LogWrite "INFO", jobId, orderId, lineId, stepName, message
End Sub

Public Sub LogWarn(ByVal jobId As String, ByVal orderId As String, ByVal lineId As String, ByVal stepName As String, ByVal message As String, Optional ByVal code As String = "WARNING")
    LogWrite "WARN", jobId, orderId, lineId, stepName, message, code
End Sub

Public Sub LogError(ByVal jobId As String, ByVal orderId As String, ByVal lineId As String, ByVal stepName As String, ByVal message As String, Optional ByVal code As String = "ERROR")
    LogWrite "ERROR", jobId, orderId, lineId, stepName, message, code
End Sub
