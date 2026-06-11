import { createCrudHooks } from "@/lib/hooks/use-crud";
import type {
  ApiGuest,
  ApiRelationship,
  GuestCreateInput,
  GuestUpdateInput,
  RelationshipCreateInput,
} from "@/types/api";

/** Hooks CRUD do módulo de convidados — piloto da factory (auditoria §1.4). */
export const guestHooks = createCrudHooks<ApiGuest, GuestCreateInput, GuestUpdateInput>(
  "guests",
  (weddingId) => `/api/weddings/${weddingId}/guests`,
);

/**
 * Relacionamentos entre convidados. O POST devolve o registro sem os
 * `include`s de guest/related; o resultado da mutação não é consumido —
 * a lista é re-buscada pela invalidação de ["rels", weddingId].
 */
export const relationshipHooks = createCrudHooks<ApiRelationship, RelationshipCreateInput>(
  "rels",
  (weddingId) => `/api/weddings/${weddingId}/relationships`,
);
