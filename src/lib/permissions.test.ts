import { expect, test } from 'vitest';
import { canManageMultipleWeddings, canViewAdvancedAnalytics, requiresUpgradeBanner } from './permissions';

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
