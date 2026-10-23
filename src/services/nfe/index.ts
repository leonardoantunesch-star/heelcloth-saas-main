import { NfeProvider, DadosEmissaoNfe, RespostaEmissaoNfe } from "./types";

/**
 * Utilitário para gerar chave de acesso de 44 dígitos padrão SEFAZ (Modelo 55)
 */
function gerarChaveAcesso44(anoMes: string, cnpj: string, modelo: string, serie: string, numero: string): string {
  const cUF = "35"; // São Paulo
  const aamm = anoMes; // ex: 2610
  const cleanCnpj = cnpj.replace(/\D/g, "").padEnd(14, "0").slice(0, 14);
  const mod = modelo.padStart(2, "0"); // 55
  const ser = serie.padStart(3, "0"); // 001
  const num = numero.padStart(9, "0"); // 000001001
  const tpEmis = "1"; // Emissão normal
  const cNF = Math.floor(10000000 + Math.random() * 90000000).toString(); // Código numérico aleatório de 8 dígitos

  const preChave = `${cUF}${aamm}${cleanCnpj}${mod}${ser}${num}${tpEmis}${cNF}`;
  
  // Cálculo do Dígito Verificador (Módulo 11 da SEFAZ)
  let peso = 2;
  let soma = 0;
  for (let i = preChave.length - 1; i >= 0; i--) {
    soma += parseInt(preChave.charAt(i), 10) * peso;
    peso++;
    if (peso > 9) peso = 2;
  }
  const resto = soma % 11;
  const dv = (resto === 0 || resto === 1) ? 0 : 11 - resto;

  return `${preChave}${dv}`;
}

/**
 * Adaptador Fiscal Homologação / Simulação SEFAZ (Modelo 55)
 * Pronto para substituição transparente por API externa (Focus NFe, Nuvem Fiscal ou PlugNotas)
 */
export class MockNfeProvider implements NfeProvider {
  private static contadorNotas = 1001;

  async emitir(dados: DadosEmissaoNfe): Promise<RespostaEmissaoNfe> {
    const agora = new Date();
    const ano = agora.getFullYear().toString().slice(-2);
    const mes = (agora.getMonth() + 1).toString().padStart(2, "0");
    const anoMes = `${ano}${mes}`;

    const numeroNota = (MockNfeProvider.contadorNotas++).toString();
    const serie = "1";
    const cnpjEmitente = "12345678000195";

    const chaveAcesso = gerarChaveAcesso44(anoMes, cnpjEmitente, "55", serie, numeroNota);

    return {
      sucesso: true,
      status: "autorizada",
      numero: numeroNota,
      serie,
      chaveAcesso,
      xmlUrl: `/api/nfe/${chaveAcesso}/xml`,
      danfeUrl: `/api/nfe/${chaveAcesso}/danfe`,
      mensagem: `NF-e nº ${numeroNota} autorizada com sucesso pela SEFAZ (Ambiente de Homologação)`,
    };
  }

  async consultarStatus(chaveAcesso: string): Promise<RespostaEmissaoNfe> {
    return {
      sucesso: true,
      status: "autorizada",
      chaveAcesso,
      mensagem: "Autorização de uso deferida pela SEFAZ",
    };
  }

  async cancelar(chaveAcesso: string, justificativa: string): Promise<RespostaEmissaoNfe> {
    return {
      sucesso: true,
      status: "cancelada",
      chaveAcesso,
      mensagem: `Cancelamento de NF-e homologado com sucesso. Justificativa: ${justificativa}`,
    };
  }

  async baixarXml(chaveAcesso: string): Promise<string> {
    return `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc versao="4.00" xmlns="http://www.portalfiscal.inf.br/nfe">
  <NFe>
    <infNFe Id="NFe${chaveAcesso}" versao="4.00">
      <ide>
        <cUF>35</cUF>
        <cNF>${chaveAcesso.slice(35, 43)}</cNF>
        <natOp>VENDA DE MERCADORIA FABRICADA</natOp>
        <mod>55</mod>
        <serie>1</serie>
        <nNF>${chaveAcesso.slice(25, 34).replace(/^0+/, "")}</nNF>
        <dhEmi>${new Date().toISOString()}</dhEmi>
        <tpNF>1</tpNF>
        <idDest>1</idDest>
        <cMunFG>3550308</cMunFG>
        <tpImp>1</tpImp>
        <tpEmis>1</tpEmis>
        <cDV>${chaveAcesso.slice(43, 44)}</cDV>
        <tpAmb>2</tpAmb>
        <finNFe>1</finNFe>
        <indFinal>1</indFinal>
        <indPres>1</indPres>
        <procEmi>0</procEmi>
        <verProc>Heelcloth SaaS ERP 1.0</verProc>
      </ide>
      <emit>
        <CNPJ>00000000000100</CNPJ>
        <xNome>Heelcloth Confeccao e Estamparia Ltda</xNome>
        <xFant>HEELCLOTH ESPORTES</xFant>
        <enderEmit>
          <xLgr>Rua da Confeccao</xLgr>
          <nro>1000</nro>
          <xBairro>Industrial</xBairro>
          <cMun>3550308</cMun>
          <xMun>Sao Paulo</xMun>
          <UF>SP</UF>
          <CEP>01001000</CEP>
        </enderEmit>
        <CRT>1</CRT>
      </emit>
      <det nItem="1">
        <prod>
          <cProd>HC-UNIF-01</cProd>
          <cEAN>SEM GTIN</cEAN>
          <xProd>UNIFORME ESPORTIVO PERSONALIZADO (CAMISA + SHORT)</xProd>
          <NCM>61091000</NCM>
          <CFOP>5101</CFOP>
          <uCom>UN</uCom>
          <qCom>1.0000</qCom>
          <vUnCom>100.00</vUnCom>
          <vProd>100.00</vProd>
          <indTot>1</indTot>
        </prod>
        <imposto>
          <ICMS>
            <ICMSSN102>
              <orig>0</orig>
              <CSOSN>102</CSOSN>
            </ICMSSN102>
          </ICMS>
        </imposto>
      </det>
    </infNFe>
  </NFe>
  <protNFe versao="4.00">
    <infProt>
      <tpAmb>2</tpAmb>
      <verAplic>SP_NFE_PL_009</verAplic>
      <chNFe>${chaveAcesso}</chNFe>
      <dhRecbto>${new Date().toISOString()}</dhRecbto>
      <nProt>135260000012345</nProt>
      <digVal>gN8g9f/w0u=</digVal>
      <cStat>100</cStat>
      <xMotivo>Autorizado o uso da NF-e</xMotivo>
    </infProt>
  </protNFe>
</nfeProc>`;
  }

  async baixarDanfe(chaveAcesso: string): Promise<Buffer> {
    return Buffer.from("%PDF-1.4 Mock DANFE Heelcloth");
  }
}

// Provedor ativo configurado via injeção de dependência / factory
let currentProvider: NfeProvider = new MockNfeProvider();

export function setNfeProvider(provider: NfeProvider) {
  currentProvider = provider;
}

export function getNfeProvider(): NfeProvider {
  return currentProvider;
}

export * from "./types";
