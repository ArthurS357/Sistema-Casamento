import { expect, test } from 'vitest';
import { isPlan, isPaidPlan } from './plans';

test('isPlan validates correctly', () => {
  expect(isPlan('free')).toBe(true);
  expect(isPlan('pro')).toBe(true);
  expect(isPlan('gestor')).toBe(true);
  expect(isPlan('invalid')).toBe(false);
});

test('isPaidPlan validates correctly', () => {
  expect(isPaidPlan('free')).toBe(false);
  expect(isPaidPlan('pro')).toBe(true);
  expect(isPaidPlan('gestor')).toBe(true);
  expect(isPaidPlan('invalid')).toBe(false);
});
