import { describe, it, expect } from 'vitest';
import {
  MIN_TEXT_LENGTH,
  MAX_TEXT_LENGTH,
  MAX_TASKS,
  validateTaskText,
  generateId,
  createTask,
} from '../src/task.js';

describe('constants', () => {
  it('exposes the configured limits', () => {
    expect(MIN_TEXT_LENGTH).toBe(3);
    expect(MAX_TEXT_LENGTH).toBe(50);
    expect(MAX_TASKS).toBe(1000);
  });
});

describe('validateTaskText', () => {
  it('trims and accepts text within range', () => {
    expect(validateTaskText('  hello  ')).toEqual({ ok: true, value: 'hello' });
  });

  it('accepts text at the minimum length after trim', () => {
    const text = 'a'.repeat(MIN_TEXT_LENGTH);
    expect(validateTaskText(`  ${text}  `)).toEqual({ ok: true, value: text });
  });

  it('accepts text at the maximum length after trim', () => {
    const text = 'a'.repeat(MAX_TEXT_LENGTH);
    expect(validateTaskText(`  ${text}  `)).toEqual({ ok: true, value: text });
  });

  it('rejects empty string with reason empty', () => {
    expect(validateTaskText('')).toEqual({ ok: false, reason: 'empty' });
  });

  it('rejects whitespace-only string with reason empty', () => {
    expect(validateTaskText('   \t\n ')).toEqual({ ok: false, reason: 'empty' });
  });

  it('rejects text shorter than the minimum after trim with reason too_short', () => {
    expect(validateTaskText('a')).toEqual({ ok: false, reason: 'too_short' });
    expect(validateTaskText('  ab  ')).toEqual({ ok: false, reason: 'too_short' });
  });

  it('rejects text longer than the limit after trim with reason too_long', () => {
    const text = 'a'.repeat(MAX_TEXT_LENGTH + 1);
    expect(validateTaskText(text)).toEqual({ ok: false, reason: 'too_long' });
  });

  it('does not throw on nullish input', () => {
    expect(validateTaskText(undefined)).toEqual({ ok: false, reason: 'empty' });
    expect(validateTaskText(null)).toEqual({ ok: false, reason: 'empty' });
  });
});

describe('generateId', () => {
  it('returns a string id', () => {
    expect(typeof generateId([])).toBe('string');
  });

  it('returns an id not present in existingIds (array)', () => {
    const existing = ['a', 'b', 'c'];
    const id = generateId(existing);
    expect(existing).not.toContain(id);
  });

  it('returns an id not present in existingIds (Set)', () => {
    const existing = new Set(['x', 'y']);
    const id = generateId(existing);
    expect(existing.has(id)).toBe(false);
  });

  it('produces unique ids across repeated calls', () => {
    const ids = new Set();
    for (let i = 0; i < 1000; i += 1) {
      ids.add(generateId(ids));
    }
    expect(ids.size).toBe(1000);
  });
});

describe('createTask', () => {
  it('creates a Task with unique id, given text, and completed false', () => {
    const task = createTask('Buy milk', []);
    expect(task.text).toBe('Buy milk');
    expect(task.completed).toBe(false);
    expect(typeof task.id).toBe('string');
    expect(task.id.length).toBeGreaterThan(0);
  });

  it('creates an id distinct from existing ids', () => {
    const existing = ['id-1', 'id-2'];
    const task = createTask('task', existing);
    expect(existing).not.toContain(task.id);
  });
});
