import { z } from "zod";

export const senhaSchema = z.string().min(8, "A senha precisa ter pelo menos 8 caracteres.").max(128, "A senha é muito longa.");
