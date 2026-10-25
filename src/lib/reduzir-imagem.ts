// Reduz a foto no próprio navegador antes de enviar (o site não precisa de imagens enormes e o envio fica rápido).
export async function reduzirImagem(arquivo: File, lado = 1400, limite = 1_100_000): Promise<string> {
  const url = URL.createObjectURL(arquivo);
  try {
    const img = await new Promise<HTMLImageElement>((ok, erro) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = () => erro(new Error(`Não foi possível abrir "${arquivo.name}".`));
      i.src = url;
    });
    let escala = Math.min(1, lado / Math.max(img.width, img.height));
    for (let tentativa = 0; tentativa < 5; tentativa++) {
      const c = document.createElement("canvas");
      c.width = Math.max(1, Math.round(img.width * escala));
      c.height = Math.max(1, Math.round(img.height * escala));
      const ctx = c.getContext("2d")!;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0, c.width, c.height);
      const dados = c.toDataURL("image/jpeg", 0.84);
      if (dados.length < limite) return dados;
      escala *= 0.78;
    }
    throw new Error("Imagem grande demais, tente uma menor.");
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function enviarImagemLoja(arquivo: File, lado?: number): Promise<string> {
  if (!arquivo.type.startsWith("image/")) throw new Error(`"${arquivo.name}" não é uma imagem.`);
  const dataUrl = await reduzirImagem(arquivo, lado);
  const res = await fetch("/api/admin/loja/imagem", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dataUrl }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.id) throw new Error(json.erro || "Falha ao enviar a imagem.");
  return json.id as string;
}
