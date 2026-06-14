import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { prisma } from '@/lib/db';
import * as guards from '@/lib/auth/guards';
import * as ai from 'ai';

// --- MOCKS ---

// Mock do banco de dados (Prisma)
vi.mock('@/lib/db', () => ({
  prisma: {
    guest: { findMany: vi.fn(), update: vi.fn() },
    table: { findMany: vi.fn() },
    guestRelationship: { findMany: vi.fn() },
    $transaction: vi.fn(),
  },
}));

// Mock dos guards para evitar complexidade e acesso real a banco
vi.mock('@/lib/auth/guards', () => {
  class AuthError extends Error {
    constructor(public status: number, message: string) {
      super(message);
      this.name = 'AuthError';
    }
  }

  return {
    AuthError,
    requireUserId: vi.fn(),
    assertWeddingAccess: vi.fn(),
    requirePremiumWeddingFeature: vi.fn(),
    enforceUserRateLimit: vi.fn(),
    errorResponse: vi.fn((e: unknown) => {
      if (e instanceof AuthError) return Response.json({ error: e.message }, { status: e.status });
      return Response.json({ error: 'InternalError' }, { status: 500 });
    }),
  };
});

// Mock da biblioteca do Vercel AI SDK
vi.mock('ai', async (importOriginal) => {
  const actual = await importOriginal<typeof ai>();
  return {
    ...actual,
    generateObject: vi.fn(),
  };
});

// Mock do provider Google
vi.mock('@ai-sdk/google', () => ({
  google: vi.fn(() => ({ id: 'mock-model' })),
}));

// Mock do lia-model (para não quebrar no createFallback com mocks vazios)
vi.mock('@/lib/ai/lia-model', () => ({
  liaModel: { id: 'mock-fallback' },
  LIA_GUARDRAILS: 'mock-guardrails',
}));

describe('Allocate Tables AI Route', () => {
  const mockWeddingId = 'wedding-123';
  const mockUserId = 'user-123';
  
  // Arrange global - Reset mocks e setup básico
  beforeEach(() => {
    vi.clearAllMocks();

    // Comportamento default de sucesso para os guards
    vi.mocked(guards.requireUserId).mockResolvedValue(mockUserId);
    vi.mocked(guards.assertWeddingAccess).mockResolvedValue(undefined);
    vi.mocked(guards.requirePremiumWeddingFeature).mockResolvedValue(undefined);
    vi.mocked(guards.enforceUserRateLimit).mockResolvedValue(null);
  });

  function createMockRequest() {
    return new Request(`http://localhost:3000/api/weddings/${mockWeddingId}/ai/allocate-tables`, {
      method: 'POST',
    });
  }

  it('deve retornar erro 403 se o usuário não tiver plano Premium', async () => {
    // Arrange
    const req = createMockRequest();
    vi.mocked(guards.requirePremiumWeddingFeature).mockRejectedValue(
      new guards.AuthError(403, 'Recurso disponível apenas nos planos Pro e Gestor.')
    );

    // Act
    const response = await POST(req, { params: Promise.resolve({ id: mockWeddingId }) });
    const json = await response.json();

    // Assert
    expect(response.status).toBe(403);
    expect(json).toEqual({ error: 'Recurso disponível apenas nos planos Pro e Gestor.' });
    expect(prisma.guest.findMany).not.toHaveBeenCalled();
  });

  it('deve retornar sucesso e chamar o Prisma corretamente quando a IA mockada devolver o payload esperado', async () => {
    // Arrange
    const req = createMockRequest();

    // 1. Mock Prisma returns
    const mockGuests = [
      { id: 'guest-1', name: 'João', notes: null, dietaryRestrictions: null },
      { id: 'guest-2', name: 'Maria', notes: null, dietaryRestrictions: null }
    ];
    
    const mockTables = [
      {
        id: 'table-1',
        name: 'Mesa 1',
        capacity: 4,
        seats: [
          { id: 'seat-1', number: 1, guest: null },
          { id: 'seat-2', number: 2, guest: null },
        ]
      }
    ];

    vi.mocked(prisma.guest.findMany).mockResolvedValue(mockGuests as never);
    vi.mocked(prisma.table.findMany).mockResolvedValue(mockTables as never);
    vi.mocked(prisma.guestRelationship.findMany).mockResolvedValue([] as never);

    // 2. Mock AI SDK payload
    const expectedAllocations = {
      allocations: [
        { guestId: 'guest-1', tableId: 'table-1' },
      ]
    };
    vi.mocked(ai.generateObject).mockResolvedValue({ object: expectedAllocations } as never);

    // Act
    const response = await POST(req, { params: Promise.resolve({ id: mockWeddingId }) });
    const json = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(json).toEqual({ allocated: 2 }); // guest-1 via IA, guest-2 via fallback determinístico
    
    // Verifica se a chamada do AI SDK foi feita
    expect(ai.generateObject).toHaveBeenCalled();
    
    // Verifica se salvou as transações no banco
    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it('deve respeitar o fallback determinístico sentando convidados restantes', async () => {
    // Arrange
    const req = createMockRequest();

    const mockGuests = [
      { id: 'guest-1', name: 'João', notes: null, dietaryRestrictions: null },
      { id: 'guest-2', name: 'Maria', notes: null, dietaryRestrictions: null }
    ];
    
    const mockTables = [
      {
        id: 'table-1',
        name: 'Mesa 1',
        capacity: 2,
        seats: [
          { id: 'seat-1', number: 1, guest: null },
          { id: 'seat-2', number: 2, guest: null },
        ]
      }
    ];

    vi.mocked(prisma.guest.findMany).mockResolvedValue(mockGuests as never);
    vi.mocked(prisma.table.findMany).mockResolvedValue(mockTables as never);
    vi.mocked(prisma.guestRelationship.findMany).mockResolvedValue([] as never);

    // Mock IA: só aloca o guest-1. O guest-2 deve ser alocado pelo fallback determinístico.
    vi.mocked(ai.generateObject).mockResolvedValue({
      object: {
        allocations: [{ guestId: 'guest-1', tableId: 'table-1' }]
      }
    } as never);

    // Act
    await POST(req, { params: Promise.resolve({ id: mockWeddingId }) });

    // Assert
    // O fallback irá verificar que há 1 assento livre e alocará guest-2 nele
    expect(prisma.$transaction).toHaveBeenCalledWith([
      prisma.guest.update({ where: { id: 'guest-1' }, data: { seatId: 'seat-1' } }),
      prisma.guest.update({ where: { id: 'guest-2' }, data: { seatId: 'seat-2' } }),
    ]);
  });
});
