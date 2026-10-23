Attribute VB_Name = "modJson"
Option Explicit

' ==============================================================================
' HEELCLOTH SPORTSWEAR — PARSER & FORMATADOR JSON PURO PARA VBA
' Compatibilidade: VBA 7 (32-bit e 64-bit), CorelDRAW X7 / 2018 / 2020 / 2022 / 2024
' Zero dependências externas (sem ScriptControl, sem DLLs de terceiros).
' ==============================================================================

Public Function JsonEscape(ByVal txt As String) As String
    Dim res As String
    res = txt
    res = Replace(res, "\", "\\")
    res = Replace(res, """", "\""")
    res = Replace(res, vbCrLf, "\n")
    res = Replace(res, vbCr, "\n")
    res = Replace(res, vbLf, "\n")
    res = Replace(res, vbTab, "\t")
    JsonEscape = res
End Function

Public Function JsonUnescape(ByVal txt As String) As String
    Dim res As String
    res = txt
    res = Replace(res, "\""", """")
    res = Replace(res, "\n", vbCrLf)
    res = Replace(res, "\t", vbTab)
    res = Replace(res, "\\", "\")
    JsonUnescape = res
End Function

' Extrai o valor de uma chave simples de um JSON: "chave": "valor" ou "chave": 123
Public Function JsonGetString(ByVal json As String, ByVal key As String, Optional ByVal defaultVal As String = "") As String
    Dim posKey As Long, posColon As Long, posQuoteStart As Long, posQuoteEnd As Long
    Dim pattern As String
    pattern = """" & key & """"
    posKey = InStr(1, json, pattern, vbTextCompare)
    If posKey = 0 Then
        JsonGetString = defaultVal
        Exit Function
    End If
    
    posColon = InStr(posKey + Len(pattern), json, ":")
    If posColon = 0 Then
        JsonGetString = defaultVal
        Exit Function
    End If
    
    posQuoteStart = InStr(posColon + 1, json, """")
    If posQuoteStart = 0 Then
        JsonGetString = defaultVal
        Exit Function
    End If
    
    ' Localiza a aspa final cuidando para aspas escapadas
    posQuoteEnd = posQuoteStart + 1
    Do While posQuoteEnd <= Len(json)
        If Mid$(json, posQuoteEnd, 1) = """" And Mid$(json, posQuoteEnd - 1, 1) <> "\" Then
            Exit Do
        End If
        posQuoteEnd = posQuoteEnd + 1
    Loop
    
    If posQuoteEnd > Len(json) Then
        JsonGetString = defaultVal
    Else
        JsonGetString = JsonUnescape(Mid$(json, posQuoteStart + 1, posQuoteEnd - posQuoteStart - 1))
    End If
End Function

Public Function JsonGetLong(ByVal json As String, ByVal key As String, Optional ByVal defaultVal As Long = 0) As Long
    Dim posKey As Long, posColon As Long, i As Long
    Dim pattern As String, charC As String, buffer As String
    pattern = """" & key & """"
    posKey = InStr(1, json, pattern, vbTextCompare)
    If posKey = 0 Then
        JsonGetLong = defaultVal
        Exit Function
    End If
    
    posColon = InStr(posKey + Len(pattern), json, ":")
    If posColon = 0 Then
        JsonGetLong = defaultVal
        Exit Function
    End If
    
    buffer = ""
    For i = posColon + 1 To Len(json)
        charC = Mid$(json, i, 1)
        If charC Like "[0-9-]" Then
            buffer = buffer & charC
        ElseIf buffer <> "" And (charC = "," Or charC = "}" Or charC = vbCr Or charC = vbLf Or charC = " " Or charC = vbTab) Then
            Exit For
        End If
    Next i
    
    If IsNumeric(buffer) Then
        JsonGetLong = CLng(buffer)
    Else
        JsonGetLong = defaultVal
    End If
End Function

Public Function JsonGetBool(ByVal json As String, ByVal key As String, Optional ByVal defaultVal As Boolean = False) As Boolean
    Dim posKey As Long, posColon As Long
    Dim pattern As String, subStr As String
    pattern = """" & key & """"
    posKey = InStr(1, json, pattern, vbTextCompare)
    If posKey = 0 Then
        JsonGetBool = defaultVal
        Exit Function
    End If
    
    posColon = InStr(posKey + Len(pattern), json, ":")
    If posColon = 0 Then
        JsonGetBool = defaultVal
        Exit Function
    End If
    
    subStr = LCase$(Trim$(Mid$(json, posColon + 1, 20)))
    If Left$(subStr, 4) = "true" Then
        JsonGetBool = True
    ElseIf Left$(subStr, 5) = "false" Then
        JsonGetBool = False
    Else
        JsonGetBool = defaultVal
    End If
End Function

' Extrai o conteúdo cru de um array ou bloco JSON: "players": [ ... ]
Public Function JsonGetArrayBlock(ByVal json As String, ByVal key As String) As String
    Dim posKey As Long, posColon As Long, posBracketStart As Long, posBracketEnd As Long
    Dim depth As Long, i As Long, charC As String
    Dim pattern As String
    pattern = """" & key & """"
    posKey = InStr(1, json, pattern, vbTextCompare)
    If posKey = 0 Then Exit Function
    
    posColon = InStr(posKey + Len(pattern), json, ":")
    If posColon = 0 Then Exit Function
    
    posBracketStart = InStr(posColon + 1, json, "[")
    If posBracketStart = 0 Then Exit Function
    
    depth = 0
    For i = posBracketStart To Len(json)
        charC = Mid$(json, i, 1)
        If charC = "[" Then
            depth = depth + 1
        ElseIf charC = "]" Then
            depth = depth - 1
            If depth = 0 Then
                posBracketEnd = i
                Exit For
            End If
        End If
    Next i
    
    If posBracketEnd > posBracketStart Then
        JsonGetArrayBlock = Mid$(json, posBracketStart + 1, posBracketEnd - posBracketStart - 1)
    End If
End Function
