import { redirect } from "next/navigation";

// A antiga página de usuários agora é a página Equipe.
export default function UsuariosPage() {
  redirect("/admin/equipe");
}
