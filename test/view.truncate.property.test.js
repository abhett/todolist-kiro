// Property-based test untuk pemotongan teks tampilan (Task 5.5).
// Dijalankan via Vitest dengan fast-check (minimum 100 iterasi).
//
// Fokus: toDisplayText menghasilkan teks dengan panjang konten paling banyak
// 50 karakter disertai penanda pemotongan bila teks asli melebihi 50 karakter,
// tanpa mengubah teks asli yang diteruskan (Req 2.5).
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  toDisplayText,
  DISPLAY_TEXT_LIMIT,
  TRUNCATION_MARKER,
} from '../src/view.js';

// Generator string sembarang, mencakup string dengan panjang melebihi batas 50
// maupun yang berada di/ di bawah batas, sehingga kedua cabang perilaku
// (dipotong vs apa adanya) tercakup.
const anyTextArb = fc.oneof(
  // String umum sembarang (dapat pendek maupun panjang).
  fc.string({ minLength: 0, maxLength: 120 }),
  // String yang dijamin melebihi batas (> 50 karakter) agar cabang pemotongan
  // sering terpicu, termasuk yang mengandung whitespace di tepi.
  fc
    .string({ minLength: 0, maxLength: 80 })
    .map((s) => `${'a'.repeat(DISPLAY_TEXT_LIMIT + 1)}${s}`),
);

describe('Property-based: toDisplayText', () => {
  // Feature: todolist-app, Property 7: Pemotongan teks tampilan tidak mengubah data
  it('teks tampilan paling banyak 50 karakter + penanda bila asli > 50, dan teks asli tidak berubah (Req 2.5)', () => {
    fc.assert(
      fc.property(anyTextArb, (text) => {
        // Snapshot teks asli untuk memverifikasi tidak termutasi.
        const original = text;

        const result = toDisplayText(text);

        if (original.length > DISPLAY_TEXT_LIMIT) {
          // Teks asli melebihi batas: hasil = 50 karakter konten + penanda.
          expect(result.endsWith(TRUNCATION_MARKER)).toBe(true);

          // Panjang konten (tanpa penanda) paling banyak 50 karakter.
          const content = result.slice(0, result.length - TRUNCATION_MARKER.length);
          expect(content.length).toBeLessThanOrEqual(DISPLAY_TEXT_LIMIT);

          // Konten merupakan prefiks dari teks asli (hanya dipotong, tidak diubah).
          expect(original.startsWith(content)).toBe(true);
        } else {
          // Teks asli tidak melebihi batas: dikembalikan apa adanya.
          expect(result).toBe(original);
          expect(result.length).toBeLessThanOrEqual(DISPLAY_TEXT_LIMIT);
        }

        // Teks asli yang diteruskan tetap tidak berubah (immutability).
        expect(text).toBe(original);
        expect(text.length).toBe(original.length);
      }),
      { numRuns: 100 },
    );
  });
});
