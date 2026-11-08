import type React from "react";

// Impede o navegador de preencher sozinho e-mail e senha salvos assim que a tela abre.
// O campo nasce "somente leitura" (o navegador não preenche campos assim) e libera no primeiro toque, clique ou Tab.
// Ao clicar, o navegador ainda oferece as senhas salvas na lista; só não preenche sem a pessoa escolher.
const liberar = (e: React.SyntheticEvent<HTMLInputElement>) => {
  e.currentTarget.readOnly = false;
};

export const semPreencher = {
  readOnly: true,
  onFocus: liberar,
  onPointerDown: liberar,
  onTouchStart: liberar,
} as const;
