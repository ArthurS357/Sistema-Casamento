import { expect, test } from 'vitest';
import {
  canManageMultipleWeddings,
  canViewAdvancedAnalytics,
  canAccessManagerAnalytics,
  requiresUpgradeBanner,
  canAccessPremiumFeatures,
  canCreateWedding,
  canAddWorkspaceMember,
  maxWorkspaceMembers,
} from './permissions';

test('canManageMultipleWeddings', () => {
  expect(canManageMultipleWeddings('free')).toBe(false);
  expect(canManageMultipleWeddings('pro')).toBe(false);
  expect(canManageMultipleWeddings('gestor')).toBe(true);
});

test('canViewAdvancedAnalytics', () => {
  expect(canViewAdvancedAnalytics('free')).toBe(false);
  expect(canViewAdvancedAnalytics('pro')).toBe(true);
  expect(canViewAdvancedAnalytics('gestor')).toBe(true);
});

test('requiresUpgradeBanner', () => {
  expect(requiresUpgradeBanner('free')).toBe(true);
  expect(requiresUpgradeBanner('pro')).toBe(false);
  expect(requiresUpgradeBanner('gestor')).toBe(false);
});

test('canAccessPremiumFeatures gates Free out of gifts/tables', () => {
  expect(canAccessPremiumFeatures('free')).toBe(false);
  expect(canAccessPremiumFeatures('pro')).toBe(true);
  expect(canAccessPremiumFeatures('gestor')).toBe(true);
});

test('canViewAdvancedAnalytics vs canAccessManagerAnalytics', () => {
  // Analytics avançado (Pro+Gestor) vs Dashboard Analítico exclusivo do Gestor.
  expect(canAccessManagerAnalytics('free')).toBe(false);
  expect(canAccessManagerAnalytics('pro')).toBe(false);
  expect(canAccessManagerAnalytics('gestor')).toBe(true);
});

test('canCreateWedding: Free=1, Pro=2, Gestor=5', () => {
  // Free: 1 casamento no máximo.
  expect(canCreateWedding('free', 0)).toBe(true);
  expect(canCreateWedding('free', 1)).toBe(false);
  // Pro: até 2 casamentos.
  expect(canCreateWedding('pro', 0)).toBe(true);
  expect(canCreateWedding('pro', 1)).toBe(true);
  expect(canCreateWedding('pro', 2)).toBe(false);
  // Gestor: até 5 casamentos (não é mais ilimitado).
  expect(canCreateWedding('gestor', 0)).toBe(true);
  expect(canCreateWedding('gestor', 4)).toBe(true);
  expect(canCreateWedding('gestor', 5)).toBe(false);
  // Plano desconhecido cai no fail-safe restritivo (free).
  expect(canCreateWedding('desconhecido', 1)).toBe(false);
});

test('maxWorkspaceMembers: Free=1, Pro=2, Gestor=ilimitado', () => {
  expect(maxWorkspaceMembers('free')).toBe(1);
  expect(maxWorkspaceMembers('pro')).toBe(2);
  expect(maxWorkspaceMembers('gestor')).toBe(Infinity);
});

test('canAddWorkspaceMember: Free só o dono, Pro libera 1 extra', () => {
  // Free: só o dono (1) — não pode convidar.
  expect(canAddWorkspaceMember('free', 1)).toBe(false);
  // Pro: dono + 1 membro (2 no total).
  expect(canAddWorkspaceMember('pro', 1)).toBe(true);
  expect(canAddWorkspaceMember('pro', 2)).toBe(false);
  // Gestor: ilimitado.
  expect(canAddWorkspaceMember('gestor', 99)).toBe(true);
});
