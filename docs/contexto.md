# Contexto: Sistema para Casamentos (SaaS)

Propósito: SaaS multi-tenant para planejamento de casamentos, com onboarding sem
atrito e monetização por assinatura.

Fluxos principais:
- Convidados: Adição, RSVP, restrições alimentares, alocação de assentos.
- RSVP público: Convidado confirma presença por link tokenizado, sem login, mobile-first.
- Relacionamentos: Vínculos entre convidados.
- Espaço: Mesas (capacidade, formato) e Assentos.
- Financeiro: Orçamento, despesas, vencimentos, valores pagos.
- Autenticação: Registro/login por credenciais ou Google OAuth.
- Monetização: Assinatura via Stripe; plano `free`/`premium` no nível do Workspace.

Modelo multi-tenant:
- `Workspace` é o tenant (unidade de isolamento e de cobrança).
- `User` acessa N workspaces via `Membership` (role owner/admin/member).
- Todo `User` recebe um Workspace pessoal no primeiro acesso (registro ou OAuth).
- Todas as `Wedding` pertencem a um Workspace; acesso concedido por membership.

Atores:
- Usuário (role global: couple/planner): membro de um ou mais workspaces.
- Workspace (tenant): detém o plano de assinatura e as weddings.
- Convidado: entidade passiva; pode responder o próprio RSVP via token público.
