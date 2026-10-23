Attribute VB_Name = "modFiles"
Option Explicit

' ==============================================================================
' HEELCLOTH SPORTSWEAR — MÓDULO DE ARQUIVOS, EXPORTAÇÃO E DIRETÓRIOS
' Gestão determinística de caminhos, sanitização, salvamento CDR e exportação PDF.
' ==============================================================================

Public Function FileExists(ByVal filePath As String) As Boolean
    On Error Resume Next
    FileExists = (Len(Dir$(filePath, vbNormal Or vbReadOnly Or vbHidden)) > 0)
    On Error GoTo 0
End Function

Public Function GetFileSize(ByVal filePath As String) As Long
    On Error Resume Next
    If FileExists(filePath) Then
        GetFileSize = FileLen(filePath)
    Else
        GetFileSize = 0
    End If
    On Error GoTo 0
End Function

Public Sub EnsureDirectoryExists(ByVal folderPath As String)
    Dim fso As Object
    On Error Resume Next
    Set fso = CreateObject("Scripting.FileSystemObject")
    If Not fso Is Nothing Then
        If Not fso.FolderExists(folderPath) Then
            BuildPathRecursive fso, folderPath
        End If
    End If
    On Error GoTo 0
End Sub

Private Sub BuildPathRecursive(ByVal fso As Object, ByVal folderPath As String)
    Dim parentPath As String
    If folderPath = "" Then Exit Sub
    If fso.FolderExists(folderPath) Then Exit Sub
    
    parentPath = fso.GetParentFolderName(folderPath)
    If parentPath <> "" And Not fso.FolderExists(parentPath) Then
        BuildPathRecursive fso, parentPath
    End If
    
    If Not fso.FolderExists(folderPath) Then
        fso.CreateFolder folderPath
    End If
End Sub

Public Function SanitizeFileName(ByVal rawName As String, _
                                Optional ByVal replaceSpacesWithUnderscore As Boolean = True, _
                                Optional ByVal upperCaseOnly As Boolean = True) As String
    Dim s As String, i As Long, ch As String, outStr As String
    s = Trim$(rawName)
    
    ' Remove acentuações para nome de arquivo Windows sem corrupção de caracteres
    s = Replace(s, "Á", "A"): s = Replace(s, "À", "A"): s = Replace(s, "Ã", "A"): s = Replace(s, "Â", "A")
    s = Replace(s, "É", "E"): s = Replace(s, "Ê", "E")
    s = Replace(s, "Í", "I")
    s = Replace(s, "Ó", "O"): s = Replace(s, "Ô", "O"): s = Replace(s, "Õ", "O")
    s = Replace(s, "Ú", "U"): s = Replace(s, "Ü", "U")
    s = Replace(s, "Ç", "C")
    s = Replace(s, "á", "a"): s = Replace(s, "à", "a"): s = Replace(s, "ã", "a"): s = Replace(s, "â", "a")
    s = Replace(s, "é", "e"): s = Replace(s, "ê", "e")
    s = Replace(s, "í", "i")
    s = Replace(s, "ó", "o"): s = Replace(s, "ô", "o"): s = Replace(s, "õ", "o")
    s = Replace(s, "ú", "u"): s = Replace(s, "ü", "u")
    s = Replace(s, "ç", "c")
    s = Replace(s, "'", ""): s = Replace(s, """", "")
    
    outStr = ""
    For i = 1 To Len(s)
        ch = Mid$(s, i, 1)
        Select Case ch
            Case "\", "/", ":", "*", "?", "<", ">", "|", """", vbTab, vbCr, vbLf
                outStr = outStr & "_"
            Case " "
                If replaceSpacesWithUnderscore Then
                    outStr = outStr & "_"
                Else
                    outStr = outStr & " "
                End If
            Case Else
                outStr = outStr & ch
        End Select
    Next i
    
    ' Remove múltiplos underscores consecutivos
    Do While InStr(outStr, "__") > 0
        outStr = Replace(outStr, "__", "_")
    Loop
    
    If upperCaseOnly Then
        SanitizeFileName = UCase$(outStr)
    Else
        SanitizeFileName = outStr
    End If
End Function

Public Function CreateTempJobDirectory(ByVal rootOutput As String, ByVal jobId As String) As String
    If Right$(rootOutput, 1) <> "\" Then rootOutput = rootOutput & "\"
    Dim tempDir As String
    tempDir = rootOutput & "_temp_" & jobId & "\"
    EnsureDirectoryExists tempDir
    CreateTempJobDirectory = tempDir
End Function

Public Function PromoteTempFiles(ByVal tempDir As String, ByVal finalDir As String) As Boolean
    Dim fso As Object
    On Error GoTo ErroPromover
    Set fso = CreateObject("Scripting.FileSystemObject")
    
    EnsureDirectoryExists finalDir
    If Right$(tempDir, 1) <> "\" Then tempDir = tempDir & "\"
    If Right$(finalDir, 1) <> "\" Then finalDir = finalDir & "\"
    
    Dim fld As Object, fil As Object
    Set fld = fso.GetFolder(tempDir)
    For Each fil In fld.Files
        ' Move ou copia sobrescrevendo
        fso.CopyFile fil.Path, finalDir & fil.Name, True
    Next fil
    
    PromoteTempFiles = True
    Exit Function

ErroPromover:
    PromoteTempFiles = False
End Function

Public Sub CleanDirectory(ByVal folderPath As String)
    Dim fso As Object
    On Error Resume Next
    Set fso = CreateObject("Scripting.FileSystemObject")
    If fso.FolderExists(folderPath) Then
        fso.DeleteFolder folderPath, True
    End If
    On Error GoTo 0
End Sub

Public Function SaveCdrDocument(ByVal doc As Document, _
                                ByVal filePath As String, _
                                ByRef errCode As String, _
                                ByRef errMsg As String) As Boolean
    On Error GoTo ErroSalvar
    
    Dim opt As StructSaveAsOptions
    Set opt = CreateStructSaveAsOptions
    opt.Version = cdrCurrentVersion
    opt.Overwrite = True
    
    doc.SaveAs filePath, opt
    
    If FileExists(filePath) And GetFileSize(filePath) > 0 Then
        SaveCdrDocument = True
    Else
        errCode = "SAVE_CDR_EMPTY_OR_MISSING"
        errMsg = "O arquivo CDR salvo não existe ou possui tamanho zero."
        SaveCdrDocument = False
    End If
    Exit Function

ErroSalvar:
    errCode = "SAVE_CDR_FAILED"
    errMsg = "Falha ao salvar documento CDR: " & Err.Description
    SaveCdrDocument = False
End Function

Public Function ExportPdfDocument(ByVal doc As Document, _
                                 ByVal filePath As String, _
                                 ByRef errCode As String, _
                                 ByRef errMsg As String) As Boolean
    On Error GoTo ErroExportar
    
    ' Configura exportação PDF padrão do CorelDRAW
    Dim expOpt As StructExportOptions
    Set expOpt = CreateStructExportOptions
    expOpt.AntiAliasingType = cdrNormalAntiAliasing
    expOpt.Overwrite = True
    
    ' Document.ExportEx para formato PDF (cdrPDF)
    Dim expFilter As ExportFilter
    Set expFilter = doc.ExportEx(filePath, cdrPDF, cdrAllPages, expOpt)
    
    If Not expFilter Is Nothing Then
        expFilter.Finish
    End If
    
    If FileExists(filePath) And GetFileSize(filePath) > 0 Then
        ExportPdfDocument = True
    Else
        errCode = "EXPORT_PDF_EMPTY_OR_MISSING"
        errMsg = "O arquivo PDF exportado não existe ou possui tamanho zero."
        ExportPdfDocument = False
    End If
    Exit Function

ErroExportar:
    errCode = "EXPORT_PDF_FAILED"
    errMsg = "Falha ao exportar PDF: " & Err.Description
    ExportPdfDocument = False
End Function
