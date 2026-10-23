/**
 * ==============================================================================
 * HEELCLOTH — CONTRATO DE IMAGENS DO SLIDESHOW EDITORIAL
 * ==============================================================================
 * 
 * INSTRUÇÕES PARA ENVIO DAS IMAGENS REAIS:
 * 1. Faça o upload das fotos editoriais da coleção para a pasta pública:
 *    public/images/editorial/ (ex: public/images/editorial/campanha-01.jpg)
 * 2. Substitua o campo 'src' de cada item abaixo pelo caminho da sua imagem:
 *    Exemplo: src: "/images/editorial/campanha-01.jpg"
 * 3. Ajuste o 'focalPoint' para calibrar o enquadramento ('center', 'top', ou coordenadas '50% 30%').
 * 4. Preencha 'alt' com a descrição acessível da peça/modelo fotografado.
 * 5. Se o campo 'src' for nulo ou vazio (""), o componente exibe automaticamente
 *    um placeholder editorial neutro e sofisticado pronto para visualização.
 * ==============================================================================
 */

export interface EditorialSlide {
  id: string;
  src?: string | null;
  alt: string;
  focalPoint?: string; // Ex: "center", "50% 40%", "top"
  href?: string;
  label?: string; // Legenda editorial sutil (ex: "Look 01", "Fluidez")
  tone?: string; // Tom neutro para o placeholder de pré-visualização
}

export const editorialSlides: EditorialSlide[] = [
  {
    id: "slide-01",
    src: null, // Substitua pelo arquivo real, ex: "/images/editorial/look-01.jpg"
    alt: "Imagem editorial a ser enviada — Silhueta 01",
    focalPoint: "center 35%",
    label: "Silhueta 01",
    tone: "#EDECE8",
  },
  {
    id: "slide-02",
    src: null,
    alt: "Imagem editorial a ser enviada — Tecido e Movimento",
    focalPoint: "center 40%",
    label: "Tecido & Movimento",
    tone: "#E5E4DE",
  },
  {
    id: "slide-03",
    src: null,
    alt: "Imagem editorial a ser enviada — Alfaiataria Contemporânea",
    focalPoint: "center 30%",
    label: "Alfaiataria Leve",
    tone: "#EBEAE5",
  },
  {
    id: "slide-04",
    src: null,
    alt: "Imagem editorial a ser enviada — Presença e Liberdade",
    focalPoint: "center 50%",
    label: "Presença & Liberdade",
    tone: "#E2E1DC",
  },
  {
    id: "slide-05",
    src: null,
    alt: "Imagem editorial a ser enviada — Textura e Detalhe",
    focalPoint: "center 40%",
    label: "Textura & Detalhe",
    tone: "#E8E7E2",
  },
  {
    id: "slide-06",
    src: null,
    alt: "Imagem editorial a ser enviada — Corte Autoral",
    focalPoint: "center 45%",
    label: "Corte Autoral",
    tone: "#DFDED9",
  },
];
