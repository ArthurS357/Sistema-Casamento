import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

/**
 * Sessão obrigatória em Server Components/layouts (auditoria §1.4-3).
 * Sem sessão válida, `redirect("/login")` interrompe a renderização —
 * o retorno é sempre um usuário autenticado com `id`.
 *
 * `React.cache()` deduplica o `auth()` entre layouts aninhados na mesma
 * requisição (ex.: (app)/layout + weddings/[id]/layout = 1 chamada).
 */
export const getAuthenticatedUser = cache(async () => {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return session.user;
});
