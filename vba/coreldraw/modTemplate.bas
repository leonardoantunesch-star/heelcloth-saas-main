Attribute VB_Name = "modTemplate"
Option Explicit

' ==============================================================================
' HEELCLOTH SPORTSWEAR — MÓDULO DE GESTÃO E VALIDAÇÃO DE TEMPLATES .CDR
' Abertura segura como cópia (OpenDocumentAsCopy), busca recursiva de placeholders
' e validação estrita de integridade contra corrupção do gabarito.
' ==============================================================================

Public Type TemplatePlaceholderNames
    namePlaceholder As String
    numberPlaceholder As String
    sizePlaceholder As String
    modelPlaceholder As String
End Type

Public Type TemplateConfig
    templateKey As String
    templatePath As String
    targetPageName As String
    targetLayerName As String
    placeholders As TemplatePlaceholderNames
    maxNameLength As Long
    maxNumberLength As Long
End Type

Public Function OpenTemplateAsCopySafely(ByVal templatePath As String, _
                                         ByRef outDoc As Document, _
                                         ByRef errCode As String, _
                                         ByRef errMsg As String) As Boolean
    On Error GoTo ErroAbrir
    
    If Not modFiles.FileExists(templatePath) Then
        errCode = "TEMPLATE_FILE_NOT_FOUND"
        errMsg = "O arquivo de template não foi encontrado: " & templatePath
        OpenTemplateAsCopySafely = False
        Exit Function
    End If
    
    ' REGRA DE SEGURANÇA: Exige Application.OpenDocumentAsCopy para nunca abrir o original com vínculo
    Set outDoc = Application.OpenDocumentAsCopy(templatePath)
    
    If outDoc Is Nothing Then
        errCode = "TEMPLATE_OPEN_RETURNED_NOTHING"
        errMsg = "Falha ao abrir cópia do template CDR: Documento nulo retornado pelo CorelDRAW."
        OpenTemplateAsCopySafely = False
        Exit Function
    End If
    
    OpenTemplateAsCopySafely = True
    Exit Function

ErroAbrir:
    errCode = "TEMPLATE_OPEN_EXCEPTION"
    errMsg = "Exceção ao abrir template como cópia: " & Err.Description
    OpenTemplateAsCopySafely = False
End Function

' Busca recursiva de shape por nome em shapes e grupos
Public Function FindPlaceholderShape(ByVal scopeContainer As Object, _
                                     ByVal placeholderName As String, _
                                     ByRef outShape As Shape, _
                                     ByRef errCode As String, _
                                     ByRef errMsg As String) As Boolean
    Dim foundShapes As Collection
    Set foundShapes = New Collection
    
    RecursiveCollectShapesByName scopeContainer, placeholderName, foundShapes
    
    If foundShapes.Count = 0 Then
        errCode = "TEMPLATE_PLACEHOLDER_NOT_FOUND"
        errMsg = "Placeholder obrigatório '" & placeholderName & "' não encontrado no template."
        FindPlaceholderShape = False
        Exit Function
    ElseIf foundShapes.Count > 1 Then
        errCode = "TEMPLATE_PLACEHOLDER_AMBIGUOUS"
        errMsg = "Múltiplos shapes com o mesmo nome '" & placeholderName & "' encontrados no template (" & foundShapes.Count & " shapes). O template deve conter nomes únicos."
        FindPlaceholderShape = False
        Exit Function
    End If
    
    Dim candidate As Shape
    Set candidate = foundShapes(1)
    
    If candidate.Type <> cdrTextShape Then
        errCode = "TEMPLATE_PLACEHOLDER_NOT_TEXT"
        errMsg = "O placeholder '" & placeholderName & "' existe mas não é do tipo Texto Artístico/Parágrafo (Tipo encontrado: " & candidate.Type & ")."
        FindPlaceholderShape = False
        Exit Function
    End If
    
    Set outShape = candidate
    FindPlaceholderShape = True
End Function

Private Sub RecursiveCollectShapesByName(ByVal parentObj As Object, _
                                        ByVal targetName As String, _
                                        ByRef outList As Collection)
    Dim s As Shape
    Dim subShapes As Shapes
    
    On Error Resume Next
    Set subShapes = parentObj.Shapes
    On Error GoTo 0
    
    If subShapes Is Nothing Then Exit Sub
    
    For Each s In subShapes
        If UCase$(Trim$(s.Name)) = UCase$(Trim$(targetName)) Then
            outList.Add s
        End If
        
        ' Se o shape for um grupo, busca recursivamente dentro do grupo
        If s.Type = cdrGroupShape Then
            RecursiveCollectShapesByName s, targetName, outList
        End If
    Next s
End Sub

Public Function ValidateTemplateStructure(ByVal doc As Document, _
                                         ByVal tConfig As TemplateConfig, _
                                         ByRef errCode As String, _
                                         ByRef errMsg As String) As Boolean
    Dim pg As Page
    Dim shpNome As Shape
    Dim shpNum As Shape
    
    If doc.Pages.Count = 0 Then
        errCode = "TEMPLATE_NO_PAGES"
        errMsg = "O documento do template não possui páginas."
        ValidateTemplateStructure = False
        Exit Function
    End If
    
    Set pg = doc.Pages(1)
    If tConfig.targetPageName <> "" Then
        Dim p As Page
        For Each p In doc.Pages
            If UCase$(Trim$(p.Name)) = UCase$(Trim$(tConfig.targetPageName)) Then
                Set pg = p
                Exit For
            End If
        Next p
    End If
    
    ' Valida presença de TXT_PLAYER_NAME
    If Not FindPlaceholderShape(pg, tConfig.placeholders.namePlaceholder, shpNome, errCode, errMsg) Then
        ValidateTemplateStructure = False
        Exit Function
    End If
    
    ' Valida presença de TXT_PLAYER_NUMBER
    If Not FindPlaceholderShape(pg, tConfig.placeholders.numberPlaceholder, shpNum, errCode, errMsg) Then
        ValidateTemplateStructure = False
        Exit Function
    End If
    
    ValidateTemplateStructure = True
End Function
