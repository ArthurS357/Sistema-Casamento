"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

interface MutateOptions<TResult> {
  /** Executado após a invalidação padrão do cache. */
  onSuccess?: (result: TResult) => void;
}

/**
 * Factory de hooks CRUD sobre TanStack Query v5 (auditoria §1.4-1).
 * Substitui o trio `useQuery + useMutation + invalidateQueries` copiado
 * nas páginas.
 *
 * Contrato de cache: queryKey `[key, scopeId]` — exatamente o formato já
 * usado hoje (ex.: `["guests", weddingId]`), preservando invalidação
 * cruzada entre módulos. Toda mutação invalida a lista do escopo.
 *
 * Convenções de rota assumidas (padrão de todas as APIs do projeto):
 *   GET/POST  path(scopeId)            — listar / criar
 *   PUT/DELETE path(scopeId)/{itemId}  — atualizar / remover
 *
 * @example
 * const guestHooks = createCrudHooks<ApiGuest, GuestCreateInput, GuestUpdateInput>(
 *   "guests",
 *   (weddingId) => `/api/weddings/${weddingId}/guests`,
 * );
 */
export function createCrudHooks<
  TItem extends { id: string },
  TCreate extends object,
  TUpdate extends object = Partial<TCreate>,
>(key: string, path: (scopeId: string) => string) {
  function useList(scopeId: string) {
    return useQuery<TItem[]>({
      queryKey: [key, scopeId],
      queryFn: () => apiFetch<TItem[]>(path(scopeId)),
    });
  }

  function useCreate(scopeId: string, options?: MutateOptions<TItem>) {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: (body: TCreate) =>
        apiFetch<TItem>(path(scopeId), { method: "POST", body: JSON.stringify(body) }),
      onSuccess: (item) => {
        qc.invalidateQueries({ queryKey: [key, scopeId] });
        options?.onSuccess?.(item);
      },
    });
  }

  function useUpdate(scopeId: string, options?: MutateOptions<TItem>) {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: ({ id, data }: { id: string; data: TUpdate }) =>
        apiFetch<TItem>(`${path(scopeId)}/${id}`, {
          method: "PUT",
          body: JSON.stringify(data),
        }),
      onSuccess: (item) => {
        qc.invalidateQueries({ queryKey: [key, scopeId] });
        options?.onSuccess?.(item);
      },
    });
  }

  function useDelete(scopeId: string, options?: MutateOptions<void>) {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: (id: string) =>
        apiFetch<void>(`${path(scopeId)}/${id}`, { method: "DELETE" }),
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: [key, scopeId] });
        options?.onSuccess?.();
      },
    });
  }

  return { useList, useCreate, useUpdate, useDelete };
}
