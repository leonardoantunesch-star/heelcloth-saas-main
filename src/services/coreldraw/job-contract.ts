/**
 * Contratos Oficiais de Job Snapshot e Manifesto de Resultado
 * para a Automação CorelDRAW — Heelcloth Sportswear
 */

export interface CorelPlayerSnapshot {
  lineId: string;
  playerIndex: number;
  name: string;
  number: string;
  size: string;
  model: string;
  notes?: string | null;
  shortSize?: string | null;
  options?: string | null;
}

export interface CorelJobOutputConfig {
  rootPath: string; // Ex: "C:\\Heelcloth\\Outputs"
  formats: Array<"cdr" | "pdf" | "eps" | "plt">;
}

export interface CorelJobSnapshot {
  jobId: string;
  attempt: number;
  orderId: string;
  orderNumber: string;
  customerName?: string;
  templateKey: string;
  templatePath: string;
  dryRun?: boolean;
  output: CorelJobOutputConfig;
  players: CorelPlayerSnapshot[];
  createdAt: string; // ISO 8601 UTC
}

export interface CorelGeneratedFile {
  lineId: string;
  playerName: string;
  playerNumber: string;
  cdrPath?: string;
  pdfPath?: string;
  fileSizeBytes?: number;
  exportedAt: string; // ISO 8601 UTC
}

export interface CorelJobIssue {
  code: string;
  message: string;
  context?: Record<string, any>;
}

export interface CorelJobResult {
  jobId: string;
  orderId: string;
  orderNumber: string;
  templateKey: string;
  status: "succeeded" | "failed" | "partial";
  attempt: number;
  startedAt: string; // ISO 8601 UTC
  finishedAt: string; // ISO 8601 UTC
  durationMs: number;
  totalPlayers: number;
  processedPlayers: number;
  generatedFiles: CorelGeneratedFile[];
  warnings: CorelJobIssue[];
  errors: CorelJobIssue[];
  dryRun: boolean;
}

export interface CorelTemplateConfig {
  templateKey: string;
  templatePath: string;
  targetPageName?: string;
  targetLayerName?: string;
  placeholders: {
    name: string;
    number: string;
    size?: string;
    model?: string;
  };
  outputPolicy: "one_file_per_player" | "all_players_in_single_file";
  formats: Array<"cdr" | "pdf">;
  sanitizeRules?: {
    replaceSpacesWith: string;
    upperCaseOnly: boolean;
  };
  version: string;
}
