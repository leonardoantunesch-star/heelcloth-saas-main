// Gera o PDF da cotação (proposta comercial) em A4, com visual profissional.
// Roda no navegador (e também em Node, nos testes). As bibliotecas só são carregadas quando o PDF é gerado.

export interface EmpresaCotacao {
  nome: string;
  documento?: string; // CNPJ
  telefone?: string;
  email?: string;
  endereco?: string;
  site?: string;
}

export interface ClienteCotacao {
  nome: string;
  documento?: string;
  contato?: string;
  email?: string;
  endereco?: string;
}

export interface ItemCotacao {
  descricao: string;
  detalhes?: string;
  quantidade: number;
  valorUnitario: number;
}

export interface CondicoesCotacao {
  pagamento?: string;
  prazoProducao?: string;
  entrega?: string;
}

export interface DadosCotacao {
  numero: string;
  emissao: Date;
  validade: Date;
  empresa: EmpresaCotacao;
  cliente: ClienteCotacao;
  itens: ItemCotacao[];
  desconto: number; // em reais
  condicoes: CondicoesCotacao;
  observacoes?: string;
}

export function calcularTotais(itens: ItemCotacao[], desconto: number) {
  const subtotal = itens.reduce((acc, i) => acc + (i.quantidade || 0) * (i.valorUnitario || 0), 0);
  const descontoAplicado = Math.min(Math.max(desconto || 0, 0), subtotal);
  return {
    subtotal: arredondar(subtotal),
    desconto: arredondar(descontoAplicado),
    total: arredondar(subtotal - descontoAplicado),
  };
}

const arredondar = (v: number) => Math.round(v * 100) / 100;

// "R$ 1.234,56" com espaço comum (o espaço especial não sai bem na fonte padrão do PDF).
export const moeda = (v: number) =>
  Number(v || 0)
    .toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    .replace(/ /g, " ");

export const dataBR = (d: Date) =>
  d.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });

const AQUA: [number, number, number] = [18, 18, 18]; // destaque (preto)
const AQUA_ESCURO: [number, number, number] = [96, 96, 96]; // rótulos (cinza)
const TINTA: [number, number, number] = [18, 18, 18];
const CINZA: [number, number, number] = [96, 96, 96];
const CINZA_CLARO: [number, number, number] = [226, 228, 231];
const FUNDO: [number, number, number] = [246, 247, 248];

const LARGURA = 210;
const ALTURA = 297;
const MARGEM = 16;
const RODAPE = 18; // espaço reservado para o rodapé

export async function gerarPdfCotacao(dados: DadosCotacao, logoDataUrl?: string | null) {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  doc.setProperties({
    title: `Cotação ${dados.numero}`,
    subject: "Proposta comercial",
    author: dados.empresa.nome || "Heelcloth",
  });

  const util = LARGURA - MARGEM * 2;
  const totais = calcularTotais(dados.itens, dados.desconto);

  const cor = (c: [number, number, number]) => doc.setTextColor(c[0], c[1], c[2]);
  const preencher = (c: [number, number, number]) => doc.setFillColor(c[0], c[1], c[2]);
  const traco = (c: [number, number, number]) => doc.setDrawColor(c[0], c[1], c[2]);

  // ---------------------------------------------------------------- cabeçalho
  preencher(AQUA);
  doc.rect(0, 0, LARGURA, 5, "F");

  let x = MARGEM;
  if (logoDataUrl) {
    try {
      // O logo é alto e estreito (proporção 916 x 1717): mantém a proporção.
      const h = 17;
      const w = (h * 916) / 1717;
      doc.addImage(logoDataUrl, "PNG", x, 13, w, h);
      x += w + 4;
    } catch {
      /* sem logo, segue só com o nome */
    }
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(19);
  cor(TINTA);
  doc.text((dados.empresa.nome || "HEELCLOTH").toUpperCase(), x, 22, { charSpace: 1.2 });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  cor(CINZA);
  doc.text("SUBLIMAÇÃO ESPORTIVA", x, 27.5, { charSpace: 1.1 });

  // lado direito: título e número
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  cor(TINTA);
  doc.text("COTAÇÃO", LARGURA - MARGEM, 22, { align: "right" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  cor(TINTA);
  doc.text(`Nº ${dados.numero}`, LARGURA - MARGEM, 28, { align: "right" });

  traco(AQUA);
  doc.setLineWidth(0.6);
  doc.line(MARGEM, 35, LARGURA - MARGEM, 35);

  // ---------------------------------------------------------------- blocos: cliente / emitente
  const colLargura = (util - 8) / 2;
  const yBloco = 42;

  const rotulo = (texto: string, px: number, py: number) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    cor(AQUA_ESCURO);
    doc.text(texto, px, py);
  };

  const linhasTexto = (linhas: string[], px: number, py: number, larg: number) => {
    let y = py;
    doc.setFontSize(9.5);
    for (let i = 0; i < linhas.length; i++) {
      const bruto = linhas[i];
      if (!bruto) continue;
      doc.setFont("helvetica", i === 0 ? "bold" : "normal");
      cor(i === 0 ? TINTA : CINZA);
      const partes = doc.splitTextToSize(bruto, larg) as string[];
      for (const parte of partes) {
        doc.text(parte, px, y);
        y += 4.6;
      }
    }
    return y;
  };

  const cl = dados.cliente;
  rotulo("CLIENTE", MARGEM, yBloco);
  const fimCliente = linhasTexto(
    [
      cl.nome || "Cliente não informado",
      cl.documento ? `CPF/CNPJ: ${cl.documento}` : "",
      cl.contato ? `WhatsApp: ${cl.contato}` : "",
      cl.email ? `E-mail: ${cl.email}` : "",
      cl.endereco || "",
    ],
    MARGEM,
    yBloco + 5.5,
    colLargura
  );

  const em = dados.empresa;
  const xEmpresa = MARGEM + colLargura + 8;
  rotulo("EMITENTE", xEmpresa, yBloco);
  const fimEmpresa = linhasTexto(
    [
      em.nome || "Heelcloth",
      em.documento ? `CNPJ: ${em.documento}` : "",
      em.telefone ? `Telefone: ${em.telefone}` : "",
      em.email ? `E-mail: ${em.email}` : "",
      em.endereco || "",
    ],
    xEmpresa,
    yBloco + 5.5,
    colLargura
  );

  // faixa com datas
  let y = Math.max(fimCliente, fimEmpresa) + 3;
  preencher(FUNDO);
  doc.roundedRect(MARGEM, y, util, 12, 2, 2, "F");
  const celula = (titulo: string, valor: string, cx: number) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    cor(CINZA);
    doc.text(titulo, cx, y + 4.8);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    cor(TINTA);
    doc.text(valor, cx, y + 9.4);
  };
  celula("DATA DE EMISSÃO", dataBR(dados.emissao), MARGEM + 5);
  celula("VÁLIDA ATÉ", dataBR(dados.validade), MARGEM + util / 3 + 5);
  celula("VALOR TOTAL", moeda(totais.total), MARGEM + (util * 2) / 3 + 5);
  y += 12 + 8;

  // ---------------------------------------------------------------- itens
  const itens = dados.itens.filter((i) => i.descricao.trim() !== "" || i.quantidade > 0);
  autoTable(doc, {
    startY: y,
    margin: { left: MARGEM, right: MARGEM, bottom: RODAPE + 4 },
    head: [["#", "Item", "Detalhes", "Qtd.", "Valor unit.", "Subtotal"]],
    body: itens.length
      ? itens.map((i, idx) => [
          String(idx + 1),
          i.descricao || "-",
          i.detalhes || "",
          String(i.quantidade),
          moeda(i.valorUnitario),
          moeda(i.quantidade * i.valorUnitario),
        ])
      : [["", "Nenhum item informado", "", "", "", ""]],
    theme: "plain",
    styles: {
      font: "helvetica",
      fontSize: 9,
      cellPadding: { top: 3, bottom: 3, left: 2.5, right: 2.5 },
      textColor: TINTA,
      lineColor: CINZA_CLARO,
      lineWidth: 0,
      valign: "middle",
    },
    headStyles: {
      fillColor: TINTA,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
      halign: "left",
    },
    alternateRowStyles: { fillColor: FUNDO },
    columnStyles: {
      0: { cellWidth: 8, halign: "center", textColor: CINZA },
      1: { cellWidth: 46, fontStyle: "bold" },
      2: { cellWidth: "auto", textColor: CINZA, fontSize: 8.5 },
      3: { cellWidth: 14, halign: "center" },
      4: { cellWidth: 27, halign: "right" },
      5: { cellWidth: 28, halign: "right", fontStyle: "bold" },
    },
    didParseCell: (d) => {
      if (d.section === "head" && [3, 4, 5].includes(d.column.index)) {
        d.cell.styles.halign = d.column.index === 3 ? "center" : "right";
      }
    },
    didDrawCell: (d) => {
      if (d.section === "body") {
        traco(CINZA_CLARO);
        doc.setLineWidth(0.15);
        doc.line(d.cell.x, d.cell.y + d.cell.height, d.cell.x + d.cell.width, d.cell.y + d.cell.height);
      }
    },
  });

  y = ((doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY ?? y) + 6;

  // ---------------------------------------------------------------- totais
  const garantir = (altura: number) => {
    if (y + altura > ALTURA - RODAPE - 4) {
      doc.addPage();
      preencher(AQUA);
      doc.rect(0, 0, LARGURA, 5, "F");
      y = 18;
    }
  };

  const larguraTotais = 78;
  const xTotais = LARGURA - MARGEM - larguraTotais;
  garantir(34);
  const linhaTotal = (nome: string, valor: string, negrito = false) => {
    doc.setFont("helvetica", negrito ? "bold" : "normal");
    doc.setFontSize(9.5);
    cor(CINZA);
    doc.text(nome, xTotais, y);
    cor(TINTA);
    doc.text(valor, LARGURA - MARGEM, y, { align: "right" });
    y += 6;
  };
  linhaTotal("Subtotal", moeda(totais.subtotal));
  if (totais.desconto > 0) linhaTotal("Desconto", `- ${moeda(totais.desconto)}`);
  y += 1;
  preencher(AQUA);
  doc.roundedRect(xTotais - 3, y - 4.5, larguraTotais + 3, 12, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text("TOTAL", xTotais + 1, y + 3);
  doc.setFontSize(13);
  doc.text(moeda(totais.total), LARGURA - MARGEM - 3, y + 3.3, { align: "right" });
  y += 17;

  // ---------------------------------------------------------------- condições comerciais
  const c = dados.condicoes;
  const condicoes: [string, string][] = [
    ["Forma de pagamento", c.pagamento || ""],
    ["Prazo de produção", c.prazoProducao || ""],
    ["Entrega", c.entrega || ""],
    ["Validade da proposta", `Até ${dataBR(dados.validade)}`],
  ].filter(([, v]) => v) as [string, string][];

  if (condicoes.length) {
    garantir(16 + condicoes.length * 7);
    rotulo("CONDIÇÕES COMERCIAIS", MARGEM, y);
    y += 3;
    traco(CINZA_CLARO);
    doc.setLineWidth(0.3);
    doc.line(MARGEM, y, LARGURA - MARGEM, y);
    y += 5.5;
    for (const [nome, valor] of condicoes) {
      const partes = doc.splitTextToSize(valor, util - 44) as string[];
      garantir(partes.length * 4.6 + 3);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      cor(TINTA);
      doc.text(nome, MARGEM, y);
      doc.setFont("helvetica", "normal");
      cor(CINZA);
      doc.text(partes, MARGEM + 44, y);
      y += partes.length * 4.6 + 2;
    }
    y += 3;
  }

  // ---------------------------------------------------------------- observações
  if (dados.observacoes && dados.observacoes.trim()) {
    const partes = doc.splitTextToSize(dados.observacoes.trim(), util - 8) as string[];
    garantir(partes.length * 4.6 + 14);
    rotulo("OBSERVAÇÕES", MARGEM, y);
    y += 3;
    preencher(FUNDO);
    doc.roundedRect(MARGEM, y, util, partes.length * 4.6 + 6, 2, 2, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    cor(CINZA);
    doc.text(partes, MARGEM + 4, y + 6);
    y += partes.length * 4.6 + 12;
  }

  // ---------------------------------------------------------------- aceite
  garantir(26);
  y += 8;
  const larguraAss = (util - 16) / 2;
  traco(CINZA);
  doc.setLineWidth(0.3);
  doc.line(MARGEM, y, MARGEM + larguraAss, y);
  doc.line(MARGEM + larguraAss + 16, y, LARGURA - MARGEM, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  cor(CINZA);
  doc.text(`De acordo - ${cl.nome || "Cliente"}`, MARGEM, y + 4.5);
  doc.text(em.nome || "Heelcloth", MARGEM + larguraAss + 16, y + 4.5);
  doc.setFontSize(7.5);
  doc.text("Data: ____ / ____ / ________", MARGEM, y + 10);

  // ---------------------------------------------------------------- rodapé em todas as páginas
  const paginas = doc.getNumberOfPages();
  for (let p = 1; p <= paginas; p++) {
    doc.setPage(p);
    traco(CINZA_CLARO);
    doc.setLineWidth(0.3);
    doc.line(MARGEM, ALTURA - RODAPE, LARGURA - MARGEM, ALTURA - RODAPE);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    cor(CINZA);
    const contato = [em.nome, em.telefone, em.email, em.site].filter(Boolean).join("   |   ");
    doc.text(contato, MARGEM, ALTURA - RODAPE + 5.5);
    doc.text(`Cotação ${dados.numero}  -  Página ${p} de ${paginas}`, LARGURA - MARGEM, ALTURA - RODAPE + 5.5, {
      align: "right",
    });
    doc.setFontSize(7);
    doc.text(
      "Valores sujeitos à aprovação do layout. A produção começa após a confirmação do pagamento.",
      MARGEM,
      ALTURA - RODAPE + 10
    );
  }

  return doc;
}
