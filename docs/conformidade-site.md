# Conformidade do site (registro interno, não publicar)

Última revisão: 08/11/2026. Escopo: páginas públicas (sublimação, pedido, catálogo, tamanhos, rastreio, contato, ajuda, simulador, loja, conta do cliente, políticas). O painel /admin ficou fora da auditoria de acessibilidade.
Revisão técnica; não é parecer jurídico.

## Matriz dos 17 controles
| # | Controle | Estado | Evidência / teste | Ação restante |
|---|---|---|---|---|
| 1 | Política de privacidade | Parcial | /privacidade v2: dados, finalidades, bases legais, operadores, transferência internacional, retenção, direitos, exclusão | Revisão jurídica; razão social e CNPJ |
| 2 | Termos de uso | Parcial | /termos v1, só regras do funcionamento atual | Revisão jurídica |
| 3 | Aviso de cookies | Verificado | Playwright: aviso na 1ª visita, nada opcional antes da escolha, aceitar/recusar/configurar/reabrir/revogar; categoria nova pergunta de novo | — |
| 4 | Reembolso | Parcial | /trocas v1 com arts. 18, 26 e 49 do CDC | Definir prazo de troca por tamanho, quem paga o frete dessa troca, prazo do estorno; revisão jurídica sobre uniformes personalizados |
| 5 | Formulários LGPD | Verificado | Aviso de finalidade + link no pedido, checkout e cadastro; consentimento do cadastro sem pré-marcação; validação no servidor (zod) | — |
| 6 | Só dados necessários | Parcial | Telefone opcional na conta; CPF só no checkout (fiscal/Mercado Pago) | Confirmar com o contador que o CPF é obrigatório para a NF |
| 7 | Scripts de tracking | Verificado | GA4 só com NEXT_PUBLIC_GA_ID + consentimento; teste de rede: zero pedidos ao Google antes/ao recusar; revogar apaga _ga e desliga; URL sem query e /rastreio/[codigo] mascarado | Criar a propriedade GA4 se quiser usar |
| 8 | Acessibilidade | Parcial | axe-core 4.10 (WCAG 2.2 A/AA + boas práticas): 0 violações nas 15 páginas públicas testadas | Teste com leitor de tela real; tema escuro (usa inversão de cor) não medido |
| 9 | Alt nas imagens | Verificado | axe sem falhas; imagem sem foto vira decorativa (aria-hidden) | Fotos novas de produto precisam de alt pelo painel |
| 10 | Contraste | Verificado (tema claro) | Textos /30–/55 e slate-400 escurecidos; axe 0 falhas de contraste | Medir tema escuro |
| 11 | Teclado | Verificado | "Pular para o conteúdo" em todas as páginas; 40 Tabs no /pedido sem armadilha e com foco visível; aviso de cookies com Esc e foco | — |
| 12 | Sem avaliações falsas | Verificado | Nenhum depoimento, nota ou contador no código | Produtos "(exemplo)" no banco: apagar no painel |
| 13 | Sem promessas falsas | Parcial | "Troca fácil" trocado por direito legal de 7 dias | Comprovar "não racha nem desbota" (institucional); apagar produtos de exemplo com desconto |
| 14 | Copyright das imagens | Pendente | — | Inventário de origem/licença das fotos (hero, Instagram, catálogo) |
| 15 | Dados da empresa | Parcial | Endereço, e-mail, WhatsApp, horário no rodapé e nas políticas; campos razaoSocial/cnpj em src/lib/empresa.ts aparecem só quando preenchidos | Informar razão social e CNPJ |
| 16 | LGPD | Parcial | RLS no Supabase, IP só em hash, exclusão de conta em Minha conta, canal por e-mail | Contratos/termos dos operadores; procedimento interno para pedidos por e-mail |
| 17 | Riscos jurídicos | Pendente | — | Revisão por profissional dos itens 1, 2 e 4 |

## Integrações externas (o que cada uma recebe)
Vercel (hospedagem), Supabase (banco), Mercado Pago (nome, e-mail, CPF, valor), Resend (e-mail do cliente e código), Google OAuth (só se a pessoa escolher), ViaCEP (CEP digitado, pelo navegador), Google Analytics (só com consentimento e id configurado), links externos sem script: WhatsApp, Instagram, Google Maps, Transparency Report.
