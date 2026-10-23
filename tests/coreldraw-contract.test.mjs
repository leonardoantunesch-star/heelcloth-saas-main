import test from "node:test";
import assert from "node:assert/strict";
import { gerarJobSnapshot } from "../src/services/coreldraw/index.ts";

test("Task 1: Contrato do Job Snapshot para CorelDRAW", async (t) => {
  const mockOrder = {
    id: "order_test_123",
    orderNumber: "HC-2603-0042",
    customer: { name: "Atlética Fúria" },
    players: [
      {
        id: "player_1",
        playerIndex: 1,
        name: "João Silva",
        number: "00", // Número com zeros à esquerda
        size: "g",
        model: "jogador",
        notes: "Manga Longa",
        shortSize: "gg",
        options: JSON.stringify({ gola: "V" }),
      },
      {
        id: "player_2",
        playerIndex: 2,
        name: "José André d'Ávila", // Acentos e caracteres especiais
        number: "10",
        size: "M",
        model: "goleiro",
        notes: null,
        shortSize: null,
      },
    ],
  };

  const snapshot = gerarJobSnapshot(mockOrder, {
    templateKey: "camisa_futebol_prime",
    templatePath: "C:\\Templates\\camisa_futebol_prime.cdr",
    rootPath: "C:\\Outputs\\Producao",
    formats: ["cdr", "pdf"],
    dryRun: false,
    attempt: 1,
  });

  // 1. Valida estrutura do Snapshot
  assert.ok(snapshot.jobId.startsWith("job_HC_2603_0042_"));
  assert.equal(snapshot.orderId, "order_test_123");
  assert.equal(snapshot.orderNumber, "HC-2603-0042");
  assert.equal(snapshot.customerName, "Atlética Fúria");
  assert.equal(snapshot.templateKey, "camisa_futebol_prime");
  assert.equal(snapshot.templatePath, "C:\\Templates\\camisa_futebol_prime.cdr");
  assert.equal(snapshot.output.rootPath, "C:\\Outputs\\Producao");
  assert.deepEqual(snapshot.output.formats, ["cdr", "pdf"]);
  assert.equal(snapshot.dryRun, false);
  assert.equal(snapshot.attempt, 1);

  // 2. Valida jogadores no Snapshot
  assert.equal(snapshot.players.length, 2);
  const p1 = snapshot.players[0];
  assert.equal(p1.lineId, "player_1");
  assert.equal(p1.name, "JOÃO SILVA");
  assert.equal(p1.number, "00", "Deve preservar número '00' como string sem perda do zero à esquerda");
  assert.equal(p1.size, "G");
  assert.equal(p1.model, "JOGADOR");
  assert.equal(p1.notes, "Manga Longa");
  assert.equal(p1.shortSize, "GG");

  const p2 = snapshot.players[1];
  assert.equal(p2.lineId, "player_2");
  assert.equal(p2.name, "JOSÉ ANDRÉ D'ÁVILA", "Preserva acentos Unicode");
  assert.equal(p2.number, "10");

  // 3. Imutabilidade do Snapshot
  mockOrder.players[0].name = "NOME MODIFICADO";
  assert.equal(snapshot.players[0].name, "JOÃO SILVA", "Snapshot é independente do objeto de origem");
});
