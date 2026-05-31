# Segurança

Autenticação e Autorização:
- NextAuth.js v5 (beta).
- Middleware (`src/middleware.ts`) bloqueia `/dashboard`, `/weddings`, `/settings`. Redireciona `/login`.
- Criptografia senhas: `argon2`.

Vulnerabilidades e Riscos (OWASP):

| Severidade | Arquivo | Risco | Correção |
|------------|---------|-------|----------|
| Média | `next.config.ts` | Faltam Headers (CSP, X-Frame-Options) | Inserir `headers()` no config. |
| Baixa | `schema.prisma` | Senha opcional no model User (OAuth) | Validar provider antes de exigir senha. |
| Baixa | `package.json` | NextAuth Beta em uso | Monitorar atualização para release estável. |
| Informativa| `src/app/api/` | Validação de Entrada | Aplicar Zod em todos payloads. |

Tratamento de Dependências:
- Uso de lockfile (`package-lock.json`) ativo.

Exposição Dados:
- DB local (`dev.db`) ignorado pelo Git (verificar `.gitignore`).
- Segredos contidos em `.env` (não versionado).
