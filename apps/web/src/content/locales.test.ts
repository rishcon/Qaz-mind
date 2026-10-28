import assert from 'node:assert/strict';
import { test } from 'node:test';
import { locales } from './locales';

/** Replaces every leaf with its type, so two languages can be compared by structure. */
const shape = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(shape);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, shape(item)]));
  }
  return typeof value;
};

/** Every string in a locale, at any depth. */
const strings = (value: unknown): string[] => {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
};

test('Kazakh copy has the same structure as Russian copy', () => {
  assert.deepEqual(shape(locales.kz), shape(locales.ru));
});

test('no landing string is empty', () => {
  for (const language of ['ru', 'kz'] as const) {
    for (const text of strings(locales[language])) {
      assert.ok(text.trim().length > 0, `${language}: empty string`);
    }
  }
});
