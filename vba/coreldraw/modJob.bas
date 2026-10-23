Attribute VB_Name = "modJob"
Option Explicit

' ==============================================================================
' HEELCLOTH SPORTSWEAR — MÓDULO DE GESTÃO DO CICLO DE VIDA DO JOB
' Lock atômico local, verificação de idempotência e geração do manifesto de resultado.
' ==============================================================================

Public Function AcquireJobLock(ByVal rootDir As String, ByVal jobId As String) As Boolean
    Dim lockPath As String
    If Right$(rootDir, 1) <> "\" Then rootDir = rootDir & "\"
    lockPath = rootDir & jobId & ".lock"
    
    On Error GoTo ErroLock
    If modFiles.FileExists(lockPath) Then
        ' Verifica se o lock tem mais de 30 minutos (lock órfão expirado)
        Dim dtMod As Date
        dtMod = FileDateTime(lockPath)
        If DateDiff("n", dtMod, Now) > 30 Then
            Kill lockPath
        Else
            AcquireJobLock = False
            Exit Function
        End If
    End If
    
    Dim fNum As Integer
    fNum = FreeFile
    Open lockPath For Output As #fNum
    Print #fNum, "LOCKED BY COREL DRAW AT " & Now & " FOR JOB " & jobId
    Close #fNum
    
    AcquireJobLock = True
    Exit Function

ErroLock:
    AcquireJobLock = False
End Function

Public Sub ReleaseJobLock(ByVal rootDir As String, ByVal jobId As String)
    Dim lockPath As String
    If Right$(rootDir, 1) <> "\" Then rootDir = rootDir & "\"
    lockPath = rootDir & jobId & ".lock"
    
    On Error Resume Next
    If modFiles.FileExists(lockPath) Then
        Kill lockPath
    End If
    On Error GoTo 0
End Sub

Public Function CheckIdempotency(ByVal finalDir As String, _
                                ByVal jobId As String, _
                                ByRef outResultJson As String) As Boolean
    If Right$(finalDir, 1) <> "\" Then finalDir = finalDir & "\"
    Dim resultPath As String
    resultPath = finalDir & "result.json"
    
    If Not modFiles.FileExists(resultPath) Then
        CheckIdempotency = False
        Exit Function
    End If
    
    Dim fNum As Integer, content As String
    fNum = FreeFile
    Open resultPath For Input As #fNum
    content = Input$(LOF(fNum), fNum)
    Close #fNum
    
    Dim statusVal As String, jId As String
    statusVal = modJson.JsonGetString(content, "status")
    jId = modJson.JsonGetString(content, "jobId")
    
    If jId = jobId And statusVal = "succeeded" Then
        outResultJson = content
        CheckIdempotency = True
    Else
        CheckIdempotency = False
    End If
End Function

Public Function SaveManifestFile(ByVal targetDir As String, ByVal manifestJson As String) As Boolean
    If Right$(targetDir, 1) <> "\" Then targetDir = targetDir & "\"
    Dim resultPath As String
    resultPath = targetDir & "result.json"
    
    On Error GoTo ErroManifesto
    Dim fNum As Integer
    fNum = FreeFile
    Open resultPath For Output As #fNum
    Print #fNum, manifestJson
    Close #fNum
    
    SaveManifestFile = True
    Exit Function

ErroManifesto:
    SaveManifestFile = False
End Function
