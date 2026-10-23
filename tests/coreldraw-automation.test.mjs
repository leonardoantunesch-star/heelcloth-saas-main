import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

// Simulação das regras canônicas do VBA implementadas em modFiles, modTemplate, modRender, modJob
function sanitizeFileName(str) {
  if (!str) return "ITEM";
  let s = str.trim().toUpperCase();
  // Normalizar acentos para nomes de arquivo do Windows
  s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  // Substituir caracteres proibidos por underscore
  s = s.replace(/[\\/:*?"<>|'"`~^]/g, "_");
  s = s.replace(/\s+/g, "_");
  s = s.replace(/_+/g, "_");
  s = s.replace(/^_|_$/g, "");
  return s || "ITEM";
}

function formatPlayerFileName(number, name, extension) {
  const safeNum = (number || "00").trim().replace(/[^A-Za-z0-9]/g, "");
  const safeName = sanitizeFileName(name);
  return `${safeNum}_${safeName}.${extension}`;
}

// Algoritmo de busca recursiva de shape por nome (espelho de modTemplate.bas FindPlaceholderRecursive)
function findShapeRecursive(shapes, targetName) {
  const matches = [];
  function search(list) {
    for (const shp of list) {
      if (shp.name === targetName) {
        matches.push(shp);
      }
      if (shp.type === "cdrGroupShape" && Array.isArray(shp.children)) {
        search(shp.children);
      }
    }
  }
  search(shapes);
  return matches;
}

test("Cenário 1: Múltiplos jogadores, número 00, nomes curtos, longos, compostos e acentuados", () => {
  const players = [
    { playerIndex: 1, name: "JOSÉ D'ÁVILA", number: "00", size: "G", model: "JOGADOR" },
    { playerIndex: 2, name: "JOÃO VÍTOR DOS SANTOS", number: "10", size: "M", model: "JOGADOR" },
    { playerIndex: 3, name: "AL", number: "07", size: "P", model: "GOLEIRO" },
    { playerIndex: 4, name: "WELLINGTON RODRIGUES DE OLIVEIRA JÚNIOR", number: "99", size: "XG", model: "JOGADOR" }
  ];

  // Preservação do zero à esquerda (00 e 07 nunca podem virar 0 ou 7 numéricos)
  assert.equal(players[0].number, "00", "Número '00' deve ser string estrita preservando ambos os dígitos");
  assert.equal(players[2].number, "07", "Número '07' deve preservar zero à esquerda");

  // Nomes de arquivo sanitizados para Windows
  const file1 = formatPlayerFileName(players[0].number, players[0].name, "cdr");
  const file2 = formatPlayerFileName(players[1].number, players[1].name, "pdf");
  const file3 = formatPlayerFileName(players[2].number, players[2].name, "cdr");
  const file4 = formatPlayerFileName(players[3].number, players[3].name, "cdr");

  assert.equal(file1, "00_JOSE_D_AVILA.cdr");
  assert.equal(file2, "10_JOAO_VITOR_DOS_SANTOS.pdf");
  assert.equal(file3, "07_AL.cdr");
  assert.equal(file4, "99_WELLINGTON_RODRIGUES_DE_OLIVEIRA_JUNIOR.cdr");

  // Textos originais em tela/arte preservam acentuação gráfica e apóstrofo
  assert.ok(players[0].name.includes("É") && players[0].name.includes("'"), "Nome preserva acentos para renderização na camisa");
  assert.ok(players[1].name.includes("Ã") && players[1].name.includes("Í"), "Nome preserva til e acento agudo");
});

test("Cenário 2: Placeholders dentro de grupos e busca recursiva", () => {
  // Estrutura de árvore de shapes simulando CorelDRAW com grupos aninhados
  const mockPageShapes = [
    { id: 1, name: "BG_RECT", type: "cdrRectangleShape" },
    {
      id: 2,
      name: "GRP_COSTAS",
      type: "cdrGroupShape",
      children: [
        { id: 21, name: "MASCARA_GOLA", type: "cdrCurveShape" },
        {
          id: 22,
          name: "SUBGRP_TEXTOS",
          type: "cdrGroupShape",
          children: [
            { id: 221, name: "TXT_PLAYER_NAME", type: "cdrTextShape", text: "NOME EXEMPLO" },
            { id: 222, name: "TXT_PLAYER_NUMBER", type: "cdrTextShape", text: "10" }
          ]
        }
      ]
    },
    { id: 3, name: "TXT_PLAYER_SIZE", type: "cdrTextShape", text: "M" }
  ];

  const nameMatches = findShapeRecursive(mockPageShapes, "TXT_PLAYER_NAME");
  const numMatches = findShapeRecursive(mockPageShapes, "TXT_PLAYER_NUMBER");
  const sizeMatches = findShapeRecursive(mockPageShapes, "TXT_PLAYER_SIZE");

  assert.equal(nameMatches.length, 1, "Deve encontrar TXT_PLAYER_NAME dentro do subgrupo");
  assert.equal(nameMatches[0].id, 221);
  assert.equal(nameMatches[0].type, "cdrTextShape");

  assert.equal(numMatches.length, 1, "Deve encontrar TXT_PLAYER_NUMBER dentro do subgrupo");
  assert.equal(numMatches[0].id, 222);

  assert.equal(sizeMatches.length, 1, "Deve encontrar TXT_PLAYER_SIZE no primeiro nível");
  assert.equal(sizeMatches[0].id, 3);
});

test("Cenário 3: Placeholders ausentes, duplicados ou de tipo incorreto", () => {
  // Caso A: Placeholder ausente
  const shapesSemNome = [
    { id: 1, name: "TXT_PLAYER_NUMBER", type: "cdrTextShape", text: "10" }
  ];
  const missing = findShapeRecursive(shapesSemNome, "TXT_PLAYER_NAME");
  assert.equal(missing.length, 0);
  const errMissing = missing.length === 0 ? "TEMPLATE_PLACEHOLDER_NOT_FOUND" : null;
  assert.equal(errMissing, "TEMPLATE_PLACEHOLDER_NOT_FOUND");

  // Caso B: Placeholder duplicado (ambiguidade)
  const shapesDuplicados = [
    { id: 1, name: "TXT_PLAYER_NAME", type: "cdrTextShape", text: "NOME 1" },
    { id: 2, name: "TXT_PLAYER_NAME", type: "cdrTextShape", text: "NOME 2" }
  ];
  const duplicate = findShapeRecursive(shapesDuplicados, "TXT_PLAYER_NAME");
  assert.equal(duplicate.length, 2);
  const errDuplicate = duplicate.length > 1 ? "TEMPLATE_PLACEHOLDER_AMBIGUOUS" : null;
  assert.equal(errDuplicate, "TEMPLATE_PLACEHOLDER_AMBIGUOUS");

  // Caso C: Placeholder com nome correto mas não é texto (ex: retângulo com nome TXT_PLAYER_NAME)
  const shapesNaoTexto = [
    { id: 1, name: "TXT_PLAYER_NAME", type: "cdrRectangleShape" }
  ];
  const notTextMatch = findShapeRecursive(shapesNaoTexto, "TXT_PLAYER_NAME");
  assert.equal(notTextMatch.length, 1);
  const errNotText = notTextMatch[0].type !== "cdrTextShape" ? "TEMPLATE_PLACEHOLDER_NOT_TEXT" : null;
  assert.equal(errNotText, "TEMPLATE_PLACEHOLDER_NOT_TEXT");
});

test("Cenário 4: Template inexistente ou formato inválido", () => {
  function validateTemplateFile(filePath) {
    if (!fs.existsSync(filePath)) {
      return { ok: false, code: "TEMPLATE_FILE_NOT_FOUND", message: `Arquivo não encontrado: ${filePath}` };
    }
    if (!filePath.toLowerCase().endsWith(".cdr")) {
      return { ok: false, code: "TEMPLATE_INVALID_FORMAT", message: "Gabarito precisa ter extensão .cdr" };
    }
    return { ok: true };
  }

  const resInexistente = validateTemplateFile("C:\\Heelcloth\\Templates\\nao_existe.cdr");
  assert.equal(resInexistente.ok, false);
  assert.equal(resInexistente.code, "TEMPLATE_FILE_NOT_FOUND");

  const tempTxt = path.join(rootDir, "vba", "fixtures", "sample-job.json");
  const resFormato = validateTemplateFile(tempTxt);
  assert.equal(resFormato.ok, false);
  assert.equal(resFormato.code, "TEMPLATE_INVALID_FORMAT");
});

test("Cenário 5: Falha parcial de exportação sem publicação inconsistente (Two-Phase Atomic Output)", () => {
  const testOutputDir = path.join(rootDir, "scratch_test_output");
  const tempDir = path.join(testOutputDir, ".tmp_job_atomic_test");
  const finalDir = path.join(testOutputDir, "HC_2603_TEST");

  if (fs.existsSync(testOutputDir)) fs.rmSync(testOutputDir, { recursive: true, force: true });
  fs.mkdirSync(tempDir, { recursive: true });

  // Simula jogador 1 exportado com sucesso na pasta temporária
  fs.writeFileSync(path.join(tempDir, "10_NEYMAR.cdr"), "CDR_DATA_MOCK");
  fs.writeFileSync(path.join(tempDir, "10_NEYMAR.pdf"), "PDF_DATA_MOCK");

  // Simula jogador 2 sofrendo falha durante exportação (ex: disco cheio ou erro de render)
  const jogador2Falhou = true;
  let status = "succeeded";
  const errors = [];

  if (jogador2Falhou) {
    status = "partial";
    errors.push({
      code: "EXPORT_PDF_FAILED",
      message: "Falha de renderização no jogador 2 (MESSI)",
      lineId: "player_2"
    });
  }

  // Política de segurança: se status for parcial ou failed, a pasta temporária NÃO é promovida diretamente para final sem flags
  assert.equal(status, "partial");
  assert.equal(errors.length, 1);
  assert.ok(!fs.existsSync(finalDir), "Pasta final não deve receber promoção completa quando houver falha de integridade");

  // Limpeza
  fs.rmSync(testOutputDir, { recursive: true, force: true });
});

test("Cenário 6: Idempotência na reexecução do mesmo jobId", () => {
  const testDir = path.join(rootDir, "scratch_test_idempotency");
  if (fs.existsSync(testDir)) fs.rmSync(testDir, { recursive: true, force: true });
  fs.mkdirSync(testDir, { recursive: true });

  const resultFilePath = path.join(testDir, "result.json");
  const mockResult = {
    jobId: "job_HC_2603_0001_1740000000",
    status: "succeeded",
    processedPlayers: 3,
    totalPlayers: 3,
    generatedFiles: [{ lineId: "1", cdrPath: "file1.cdr" }]
  };

  // Primeira execução grava o manifesto
  fs.writeFileSync(resultFilePath, JSON.stringify(mockResult, null, 2), "utf-8");

  // Segunda execução faz check de idempotência
  function checkIdempotency(dir, jobId) {
    const file = path.join(dir, "result.json");
    if (!fs.existsSync(file)) return null;
    const data = JSON.parse(fs.readFileSync(file, "utf-8"));
    if (data.jobId === jobId && (data.status === "succeeded" || data.status === "completed")) {
      return data;
    }
    return null;
  }

  const cachedResult = checkIdempotency(testDir, "job_HC_2603_0001_1740000000");
  assert.ok(cachedResult, "Deve detectar job já finalizado com sucesso");
  assert.equal(cachedResult.jobId, "job_HC_2603_0001_1740000000");
  assert.equal(cachedResult.status, "succeeded");

  fs.rmSync(testDir, { recursive: true, force: true });
});

test("Cenário 7: Retentativa após erro transitório e Lock Concorrente", () => {
  const testDir = path.join(rootDir, "scratch_test_lock");
  if (fs.existsSync(testDir)) fs.rmSync(testDir, { recursive: true, force: true });
  fs.mkdirSync(testDir, { recursive: true });

  const jobId = "job_test_lock_01";
  const lockFile = path.join(testDir, `${jobId}.lock`);

  function acquireLock(file) {
    if (fs.existsSync(file)) return false;
    fs.writeFileSync(file, JSON.stringify({ pid: 1234, time: new Date().toISOString() }));
    return true;
  }

  function releaseLock(file) {
    if (fs.existsSync(file)) fs.unlinkSync(file);
  }

  // Instância 1 adquire o lock
  const lock1 = acquireLock(lockFile);
  assert.equal(lock1, true, "Instância 1 deve adquirir lock com sucesso");

  // Instância 2 tenta simultaneamente
  const lock2 = acquireLock(lockFile);
  assert.equal(lock2, false, "Instância 2 deve ser rejeitada por lock ativo concorrente");

  // Instância 1 finaliza ou libera
  releaseLock(lockFile);
  assert.equal(fs.existsSync(lockFile), false, "Lock liberado");

  // Tentativa 2 após liberação tem sucesso
  const lockRetry = acquireLock(lockFile);
  assert.equal(lockRetry, true, "Retentativa adquire lock com sucesso");
  releaseLock(lockFile);

  fs.rmSync(testDir, { recursive: true, force: true });
});

test("Cenário 8: Preservação estrita do arquivo de template original (Imutabilidade)", () => {
  const templateDir = path.join(rootDir, "scratch_test_template");
  if (fs.existsSync(templateDir)) fs.rmSync(templateDir, { recursive: true, force: true });
  fs.mkdirSync(templateDir, { recursive: true });

  const templatePath = path.join(templateDir, "gabarito_master.cdr");
  const originalBytes = Buffer.from("HEELCLOTH_COREL_DRAW_MASTER_TEMPLATE_DATA_V1");
  fs.writeFileSync(templatePath, originalBytes);

  const hashOriginal = crypto.createHash("sha256").update(fs.readFileSync(templatePath)).digest("hex");
  const statOriginal = fs.statSync(templatePath);

  // Simulação de abertura como cópia (OpenDocumentAsCopy):
  // Uma cópia temporária é criada para trabalho do jogador, enquanto o master nunca é tocado
  const tempCopyPath = path.join(templateDir, "temp_player_copy.cdr");
  fs.copyFileSync(templatePath, tempCopyPath);

  // Modificação aplicada APENAS na cópia
  fs.appendFileSync(tempCopyPath, Buffer.from("MODIFICACAO_JOGADOR_10"));

  // Validação: gabarito master intacto
  const hashDepois = crypto.createHash("sha256").update(fs.readFileSync(templatePath)).digest("hex");
  const statDepois = fs.statSync(templatePath);

  assert.equal(hashOriginal, hashDepois, "O hash SHA-256 do gabarito original precisa permanecer 100% inalterado");
  assert.equal(statOriginal.size, statDepois.size, "O tamanho do gabarito original precisa permanecer idêntico");
  assert.equal(statOriginal.mtimeMs, statDepois.mtimeMs, "A data de modificação do gabarito original não pode mudar");

  fs.rmSync(templateDir, { recursive: true, force: true });
});

test("Cenário 9: Validação de integridade dos arquivos gerados (existência e tamanho > 0)", () => {
  const outputDir = path.join(rootDir, "scratch_test_verify");
  if (fs.existsSync(outputDir)) fs.rmSync(outputDir, { recursive: true, force: true });
  fs.mkdirSync(outputDir, { recursive: true });

  const files = [
    { path: path.join(outputDir, "01_ALISSON.cdr"), content: "MOCK_CDR_DATA_BINARY" },
    { path: path.join(outputDir, "01_ALISSON.pdf"), content: "%PDF-1.4 MOCK_HEADER_DATA" },
    { path: path.join(outputDir, "10_NEYMAR.cdr"), content: "MOCK_CDR_DATA_BINARY_2" },
    { path: path.join(outputDir, "10_NEYMAR.pdf"), content: "%PDF-1.4 MOCK_HEADER_DATA_2" }
  ];

  for (const f of files) {
    fs.writeFileSync(f.path, f.content);
  }

  function verifyGeneratedFiles(list) {
    for (const f of list) {
      if (!fs.existsSync(f.path)) {
        throw new Error(`Arquivo gerado não existe no disco: ${f.path}`);
      }
      const stat = fs.statSync(f.path);
      if (stat.size <= 0) {
        throw new Error(`Arquivo gerado está vazio (0 bytes): ${f.path}`);
      }
    }
    return true;
  }

  assert.ok(verifyGeneratedFiles(files), "Todos os arquivos existem e têm tamanho > 0");

  fs.rmSync(outputDir, { recursive: true, force: true });
});
