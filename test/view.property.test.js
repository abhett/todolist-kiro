// @vitest-environment jsdom
//
// Property-based test untuk lapisan presentasi (view.js).
// Dijalankan via Vitest dengan fast-check (minimum 100 iterasi) di lingkungan
// jsdom agar `renderTaskList` dapat merender ke DOM nyata (jsdom).
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { renderTaskList, MAX_RENDERED_TASKS } from '../src/view.js';

// Generator satu Task acak: id unik dijamin di level daftar (lihat taskListArb),
// text sembarang, completed acak.
const taskArb = fc.record({
  text: fc.string({ minLength: 0, maxLength: 60 }),
  completed: fc.boolean(),
});

// Generator Task_List acak dengan panjang bervariasi, termasuk daftar kosong
// serta daftar besar yang MELEBIHI batas render (>1000) agar batas 1000 teruji.
// id diberikan berdasarkan indeks pembuatan sehingga unik dan sekaligus
// menjadi penanda urutan pembuatan (paling awal → paling akhir).
const taskListArb = fc
  .oneof(
    // Daftar kecil termasuk kemungkinan kosong (0–50 Task).
    fc.array(taskArb, { minLength: 0, maxLength: 50 }),
    // Daftar besar yang melebihi batas render (1001–1200 Task).
    fc.array(taskArb, { minLength: MAX_RENDERED_TASKS + 1, maxLength: MAX_RENDERED_TASKS + 200 }),
  )
  .map((tasks) =>
    tasks.map((task, index) => ({
      id: `task-${index}`,
      text: task.text,
      completed: task.completed,
    })),
  );

describe('Property-based: renderTaskList (view.js)', () => {
  // Feature: todolist-app, Property 5: Urutan dan batas render dipertahankan
  it('render mempertahankan urutan Task_List (paling awal → paling akhir) dan jumlah baris tidak melebihi 1000 (Req 2.1)', () => {
    fc.assert(
      fc.property(taskListArb, (taskList) => {
        const container = document.createElement('ul');

        renderTaskList(container, taskList);

        // Ambil hanya baris Task yang dirender (identifikasi via dataset.id).
        const renderedRows = Array.from(container.querySelectorAll('.task-item'));

        // Jumlah baris yang dirender tidak pernah melebihi batas 1000.
        expect(renderedRows.length).toBeLessThanOrEqual(MAX_RENDERED_TASKS);

        // Jumlah baris adalah min(panjang daftar, MAX_RENDERED_TASKS):
        // seluruh Task tampil bila di bawah batas, dipotong hingga batas bila melebihi.
        const expectedCount = Math.min(taskList.length, MAX_RENDERED_TASKS);
        expect(renderedRows.length).toBe(expectedCount);

        // Urutan baris yang dirender sama persis dengan urutan Task_List
        // (prefix sepanjang expectedCount), dibandingkan lewat id.
        const renderedIds = renderedRows.map((row) => row.dataset.id);
        const expectedIds = taskList.slice(0, expectedCount).map((task) => task.id);
        expect(renderedIds).toEqual(expectedIds);
      }),
      { numRuns: 100 },
    );
  }, 60000);
});
