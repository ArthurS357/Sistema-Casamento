import { expect, test } from 'vitest';
import {
  canManageMultipleWeddings,
  canViewAdvancedAnalytics,
  requiresUpgradeBanner,
  canAccessPremiumFeatures,
  canCreateWedding,
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

test('canCreateWedding caps non-gestor plans at 1 wedding', () => {
  // Free: 1 casamento no máximo.
  expect(canCreateWedding('free', 0)).toBe(true);
  expect(canCreateWedding('free', 1)).toBe(false);
  // Pro: também limitado a 1 (só gestor é multi).
  expect(canCreateWedding('pro', 0)).toBe(true);
  expect(canCreateWedding('pro', 1)).toBe(false);
  // Gestor: ilimitado.
  expect(canCreateWedding('gestor', 0)).toBe(true);
  expect(canCreateWedding('gestor', 5)).toBe(true);
});
