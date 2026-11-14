// @vitest-environment jsdom
// Property-based test untuk lapisan presentasi (Task 5.4): renderTaskList.
// Memastikan gaya coretan (kelas `.completed`) diterapkan pada baris Task jika
// dan hanya jika Completion_Status (`completed`) bernilai true (Req 2.3).
// Dijalankan via Vitest + fast-check (minimum 100 iterasi).
import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { renderTaskList } from '../src/view.js';

// Generator Task_List acak dengan flag `completed` acak. Setiap Task memiliki
// id unik (indeks) dan text non-kosong; fokus property ada pada flag completed.
const taskWithRandomCompletedArb = fc.record({
  text: fc.string({ minLength: 1, maxLength: 60 }),
  completed: fc.boolean(),
});

const taskListArb = fc
  .array(taskWithRandomCompletedArb, { minLength: 1, maxLength: 30 })
  .map((tasks) =>
    tasks.map((task, index) => ({
      id: `task-${index}`,
      text: task.text,
      completed: task.completed,
    })),
  );

describe('Property-based: renderTaskList strikethrough', () => {
  let container;

  beforeEach(() => {
    document.body.replaceChildren();
    container = document.createElement('ul');
    document.body.appendChild(container);
  });

  // Feature: todolist-app, Property 6: Strikethrough sesuai Completion_Status
  it('menerapkan kelas .completed pada baris Task jika dan hanya jika completed bernilai true (Req 2.3)', () => {
    fc.assert(
      fc.property(taskListArb, (taskList) => {
        renderTaskList(container, taskList);

        const rows = container.querySelectorAll('li.task-item');

        // Jumlah baris yang dirender sesuai jumlah Task pada daftar.
        expect(rows).toHaveLength(taskList.length);

        rows.forEach((row, index) => {
          const task = taskList[index];
          // Baris dirender dalam urutan Task_List (verifikasi pemetaan via id).
          expect(row.dataset.id).toBe(task.id);

          const hasCompletedClass = row.classList.contains('completed');
          // Strikethrough (kelas .completed) ada jika dan hanya jika task.completed true.
          expect(hasCompletedClass).toBe(task.completed === true);
        });
      }),
      { numRuns: 100 },
    );
  });
});
