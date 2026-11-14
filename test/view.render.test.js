// @vitest-environment jsdom
// Unit/example tests untuk lapisan presentasi (Task 5.1): renderTaskList dan
// toDisplayText. Fokus: urutan render, batas 1000, kelas .completed, pemotongan
// teks tampilan (tanpa mengubah data), kelas Neobrutalism .nb-card, dan pesan
// kosong. Property test terkait (urutan/batas, strikethrough, pemotongan)
// ditulis pada tugas terpisah (5.3-5.5).
import { describe, it, expect, beforeEach } from 'vitest';
import {
  renderTaskList,
  toDisplayText,
  DISPLAY_TEXT_LIMIT,
  TRUNCATION_MARKER,
  MAX_RENDERED_TASKS,
  EMPTY_MESSAGE,
} from '../src/view.js';

function makeTask(id, text, completed = false) {
  return { id, text, completed };
}

describe('toDisplayText', () => {
  it('mengembalikan teks apa adanya bila <= 50 karakter', () => {
    const text = 'Beli susu';
    expect(toDisplayText(text)).toBe('Beli susu');
  });

  it('mengembalikan teks apa adanya tepat pada batas 50 karakter', () => {
    const text = 'a'.repeat(DISPLAY_TEXT_LIMIT);
    const result = toDisplayText(text);
    expect(result).toBe(text);
    expect(result).toHaveLength(DISPLAY_TEXT_LIMIT);
  });

  it('memotong hingga 50 karakter + penanda bila teks melebihi batas (Req 2.5)', () => {
    const text = 'b'.repeat(DISPLAY_TEXT_LIMIT + 20);
    const result = toDisplayText(text);
    expect(result).toBe('b'.repeat(DISPLAY_TEXT_LIMIT) + TRUNCATION_MARKER);
    expect(result.startsWith('b'.repeat(DISPLAY_TEXT_LIMIT))).toBe(true);
    expect(result.endsWith(TRUNCATION_MARKER)).toBe(true);
  });

  it('tidak mengubah string input (Req 2.5)', () => {
    const text = 'c'.repeat(DISPLAY_TEXT_LIMIT + 5);
    const copy = text;
    toDisplayText(text);
    expect(text).toBe(copy);
    expect(text).toHaveLength(DISPLAY_TEXT_LIMIT + 5);
  });
});

describe('renderTaskList', () => {
  let container;

  beforeEach(() => {
    document.body.innerHTML = '<ul id="task-list"></ul>';
    container = document.getElementById('task-list');
  });

  it('menampilkan pesan kosong tanpa baris Task saat daftar kosong (Req 2.2, 5.5)', () => {
    renderTaskList(container, []);
    expect(container.textContent).toContain(EMPTY_MESSAGE);
    expect(container.querySelectorAll('.task-item')).toHaveLength(0);
    expect(container.querySelector('[data-empty="true"]')).not.toBeNull();
  });

  it('merender Task sesuai urutan Task_List (Req 2.1)', () => {
    const list = [
      makeTask('1', 'satu'),
      makeTask('2', 'dua'),
      makeTask('3', 'tiga'),
    ];
    renderTaskList(container, list);
    const texts = [...container.querySelectorAll('.task-text')].map((el) => el.textContent);
    expect(texts).toEqual(['satu', 'dua', 'tiga']);
  });

  it('menerapkan kelas Neobrutalism .nb-card pada setiap baris Task', () => {
    renderTaskList(container, [makeTask('1', 'a'), makeTask('2', 'b')]);
    const rows = container.querySelectorAll('.task-item');
    expect(rows).toHaveLength(2);
    rows.forEach((row) => expect(row.classList.contains('nb-card')).toBe(true));
  });

  it('menerapkan kelas .completed hanya pada Task berstatus selesai (Req 2.3)', () => {
    const list = [makeTask('1', 'aktif', false), makeTask('2', 'selesai', true)];
    renderTaskList(container, list);
    const rows = container.querySelectorAll('.task-item');
    expect(rows[0].classList.contains('completed')).toBe(false);
    expect(rows[1].classList.contains('completed')).toBe(true);
    expect(rows[1].querySelector('.task-toggle').checked).toBe(true);
  });

  it('menampilkan teks tampilan terpotong tanpa mengubah data tersimpan (Req 2.5)', () => {
    const longText = 'x'.repeat(DISPLAY_TEXT_LIMIT + 30);
    const task = makeTask('1', longText);
    renderTaskList(container, [task]);
    const label = container.querySelector('.task-text');
    expect(label.textContent).toBe('x'.repeat(DISPLAY_TEXT_LIMIT) + TRUNCATION_MARKER);
    // Data asli pada objek Task tidak diubah.
    expect(task.text).toBe(longText);
  });

  it('membatasi jumlah baris yang ditampilkan hingga 1000 (Req 2.1)', () => {
    const list = Array.from({ length: MAX_RENDERED_TASKS + 50 }, (_, i) =>
      makeTask(String(i), `t${i}`),
    );
    renderTaskList(container, list);
    expect(container.querySelectorAll('.task-item')).toHaveLength(MAX_RENDERED_TASKS);
  });

  it('mengosongkan container pada render ulang (tidak menumpuk baris)', () => {
    renderTaskList(container, [makeTask('1', 'a')]);
    renderTaskList(container, [makeTask('2', 'b'), makeTask('3', 'c')]);
    const texts = [...container.querySelectorAll('.task-text')].map((el) => el.textContent);
    expect(texts).toEqual(['b', 'c']);
  });

  it('memanggil handler saat interaksi pengguna (toggle/edit/delete)', () => {
    const calls = [];
    const handlers = {
      onToggle: (id) => calls.push(['toggle', id]),
      onEdit: (id) => calls.push(['edit', id]),
      onDelete: (id) => calls.push(['delete', id]),
    };
    renderTaskList(container, [makeTask('42', 'tugas')], handlers);
    container.querySelector('.task-toggle').dispatchEvent(new window.Event('change'));
    container.querySelector('.task-edit').dispatchEvent(new window.MouseEvent('click'));
    container.querySelector('.task-delete').dispatchEvent(new window.MouseEvent('click'));
    expect(calls).toEqual([
      ['toggle', '42'],
      ['edit', '42'],
      ['delete', '42'],
    ]);
  });
});
