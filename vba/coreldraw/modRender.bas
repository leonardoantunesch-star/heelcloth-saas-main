Attribute VB_Name = "modRender"
Option Explicit

' ==============================================================================
' HEELCLOTH SPORTSWEAR — MÓDULO DE RENDERIZAÇÃO E APLICAÇÃO DE DADOS
' Aplica nome, número e atributos aos placeholders de texto preservando efeitos,
' fontes e formatação do designer sem contaminação entre jogadores.
' ==============================================================================

Public Function ApplyPlayerData(ByVal doc As Document, _
                               ByVal tConfig As TemplateConfig, _
                               ByVal playerName As String, _
                               ByVal playerNumber As String, _
                               ByVal playerSize As String, _
                               ByVal playerModel As String, _
                               ByRef errCode As String, _
                               ByRef errMsg As String) As Boolean
    On Error GoTo ErroRender
    
    Dim pg As Page
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
    
    ' 1. Aplica Nome do Jogador
    Dim shpNome As Shape
    If Not modTemplate.FindPlaceholderShape(pg, tConfig.placeholders.namePlaceholder, shpNome, errCode, errMsg) Then
        ApplyPlayerData = False
        Exit Function
    End If
    
    ' Preserva efeitos do designer e substitui o texto da história (Story)
    shpNome.Text.Story.Text = playerName
    
    ' 2. Aplica Número do Jogador (string estrita para manter '00' ou '07')
    Dim shpNum As Shape
    If Not modTemplate.FindPlaceholderShape(pg, tConfig.placeholders.numberPlaceholder, shpNum, errCode, errMsg) Then
        ApplyPlayerData = False
        Exit Function
    End If
    
    shpNum.Text.Story.Text = playerNumber
    
    ' 3. Aplica Tamanho (opcional no template)
    If tConfig.placeholders.sizePlaceholder <> "" Then
        Dim shpSize As Shape
        Dim tempCode As String, tempMsg As String
        If modTemplate.FindPlaceholderShape(pg, tConfig.placeholders.sizePlaceholder, shpSize, tempCode, tempMsg) Then
            shpSize.Text.Story.Text = playerSize
        End If
    End If
    
    ' 4. Aplica Modelo (opcional no template)
    If tConfig.placeholders.modelPlaceholder <> "" Then
        Dim shpModel As Shape
        If modTemplate.FindPlaceholderShape(pg, tConfig.placeholders.modelPlaceholder, shpModel, tempCode, tempMsg) Then
            shpModel.Text.Story.Text = playerModel
        End If
    End If
    
    ApplyPlayerData = True
    Exit Function

ErroRender:
    errCode = "RENDER_EXCEPTION"
    errMsg = "Erro ao aplicar dados do jogador no documento: " & Err.Description
    ApplyPlayerData = False
End Function
