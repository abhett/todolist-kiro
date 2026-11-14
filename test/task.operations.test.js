// Unit/example tests untuk operasi Task_List murni (Task 2.2).
// Fokus: addTask, toggleTask, editTask, deleteTask — immutabilitas,
// urutan, keunikan id, serta pelestarian id/status sesuai spec.
import { describe, it, expect } from 'vitest';
import {
  addTask,
  toggleTask,
  editTask,
  deleteTask,
  MAX_TEXT_LENGTH,
} from '../src/task.js';

// Helper: bangun Task_List dengan menambah beberapa teks berurutan.
function buildList(texts) {
  let list = [];
  for (const t of texts) {
    const result = addTask(list, t);
    expect(result.ok).toBe(true);
    list = result.taskList;
  }
  return list;
}

describe('addTask', () => {
  it('menambahkan Task valid dengan teks ter-trim dan completed=false (Req 1.1)', () => {
    const result = addTask([], '  Beli susu  ');
    expect(result.ok).toBe(true);
    expect(result.taskList).toHaveLength(1);
    const task = result.taskList[0];
    expect(task.text).toBe('Beli susu');
    expect(task.completed).toBe(false);
    expect(typeof task.id).toBe('string');
    expect(task.id.length).toBeGreaterThan(0);
  });

  it('meng-append Task baru ke akhir mempertahankan urutan pembuatan (Req 1.1, 2.1)', () => {
    const list = buildList(['satu', 'dua', 'tiga']);
    expect(list.map((t) => t.text)).toEqual(['satu', 'dua', 'tiga']);
  });

  it('menghasilkan id unik untuk setiap Task (Req 1.2)', () => {
    const list = buildList(['aaa', 'bbb', 'ccc', 'ddd']);
    const ids = list.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('tidak memutasi Task_List masukan (immutable)', () => {
    const original = [];
    const result = addTask(original, 'halo');
    expect(original).toHaveLength(0);
    expect(result.taskList).not.toBe(original);
  });

  it('menolak teks kosong/whitespace dengan reason empty tanpa mengubah daftar (Req 1.4)', () => {
    const list = buildList(['tetap']);
    const result = addTask(list, '    ');
    expect(result).toEqual({ ok: false, reason: 'empty' });
    expect(list).toHaveLength(1);
  });

  it('menolak teks melebihi 50 karakter dengan reason too_long (Req 1.5)', () => {
    const result = addTask([], 'x'.repeat(MAX_TEXT_LENGTH + 1));
    expect(result).toEqual({ ok: false, reason: 'too_long' });
  });

  it('menerima teks tepat pada batas 50 karakter', () => {
    const result = addTask([], 'y'.repeat(MAX_TEXT_LENGTH));
    expect(result.ok).toBe(true);
    expect(result.taskList[0].text).toHaveLength(MAX_TEXT_LENGTH);
  });
});

describe('toggleTask', () => {
  it('membalik completed Task yang cocok, mempertahankan id dan text (Req 3.1, 3.2)', () => {
    const list = buildList(['tugas']);
    const id = list[0].id;
    const toggled = toggleTask(list, id);
    expect(toggled[0].completed).toBe(true);
    expect(toggled[0].id).toBe(id);
    expect(toggled[0].text).toBe('tugas');
  });

  it('bersifat involusi: dua kali toggle kembali ke semula (Req 3.1, 3.2)', () => {
    const list = buildList(['tugas']);
    const id = list[0].id;
    const twice = toggleTask(toggleTask(list, id), id);
    expect(twice[0].completed).toBe(false);
    expect(twice[0].id).toBe(id);
    expect(twice[0].text).toBe('tugas');
  });

  it('tidak memutasi daftar maupun objek Task masukan (immutable)', () => {
    const list = buildList(['tugas']);
    const id = list[0].id;
    const toggled = toggleTask(list, id);
    expect(list[0].completed).toBe(false);
    expect(toggled).not.toBe(list);
    expect(toggled[0]).not.toBe(list[0]);
  });

  it('mempertahankan urutan dan task lain tidak berubah', () => {
    const list = buildList(['aaa', 'bbb', 'ccc']);
    const id = list[1].id;
    const toggled = toggleTask(list, id);
    expect(toggled.map((t) => t.text)).toEqual(['aaa', 'bbb', 'ccc']);
    expect(toggled[0]).toBe(list[0]);
    expect(toggled[2]).toBe(list[2]);
    expect(toggled[1].completed).toBe(true);
  });

  it('mengembalikan daftar setara tanpa perubahan bila id tidak ditemukan', () => {
    const list = buildList(['aaa', 'bbb']);
    const toggled = toggleTask(list, 'tidak-ada');
    expect(toggled).toEqual(list);
    expect(toggled).not.toBe(list);
  });
});

describe('editTask', () => {
  it('memperbarui text ke nilai ter-trim, mempertahankan id dan completed (Req 4.1, 4.3)', () => {
    let list = buildList(['lama']);
    const id = list[0].id;
    list = toggleTask(list, id); // completed = true
    const result = editTask(list, id, '  baru  ');
    expect(result.ok).toBe(true);
    expect(result.taskList[0].text).toBe('baru');
    expect(result.taskList[0].id).toBe(id);
    expect(result.taskList[0].completed).toBe(true);
  });

  it('menolak teks tidak valid tanpa mengubah Task (Req 4.2)', () => {
    const list = buildList(['tetap']);
    const id = list[0].id;
    const empty = editTask(list, id, '   ');
    expect(empty).toEqual({ ok: false, reason: 'empty' });
    const tooLong = editTask(list, id, 'z'.repeat(MAX_TEXT_LENGTH + 1));
    expect(tooLong).toEqual({ ok: false, reason: 'too_long' });
    expect(list[0].text).toBe('tetap');
  });

  it('tidak memutasi daftar maupun objek Task masukan (immutable)', () => {
    const list = buildList(['lama']);
    const id = list[0].id;
    const result = editTask(list, id, 'baru');
    expect(list[0].text).toBe('lama');
    expect(result.taskList).not.toBe(list);
    expect(result.taskList[0]).not.toBe(list[0]);
  });

  it('mempertahankan urutan dan task lain tidak berubah', () => {
    const list = buildList(['aaa', 'bbb', 'ccc']);
    const id = list[1].id;
    const result = editTask(list, id, 'BBB');
    expect(result.taskList.map((t) => t.text)).toEqual(['aaa', 'BBB', 'ccc']);
    expect(result.taskList[0]).toBe(list[0]);
    expect(result.taskList[2]).toBe(list[2]);
  });
});

describe('deleteTask', () => {
  it('menghapus Task ber-id dan mengurangi panjang tepat satu (Req 5.2)', () => {
    const list = buildList(['aaa', 'bbb', 'ccc']);
    const id = list[1].id;
    const result = deleteTask(list, id);
    expect(result).toHaveLength(2);
    expect(result.map((t) => t.text)).toEqual(['aaa', 'ccc']);
    expect(result.some((t) => t.id === id)).toBe(false);
  });

  it('mempertahankan urutan task tersisa (Req 5.2)', () => {
    const list = buildList(['aaa', 'bbb', 'ccc', 'ddd']);
    const result = deleteTask(list, list[0].id);
    expect(result.map((t) => t.text)).toEqual(['bbb', 'ccc', 'ddd']);
  });

  it('tidak memutasi daftar masukan (immutable)', () => {
    const list = buildList(['aaa', 'bbb']);
    const result = deleteTask(list, list[0].id);
    expect(list).toHaveLength(2);
    expect(result).not.toBe(list);
  });

  it('mengembalikan daftar setara bila id tidak ditemukan', () => {
    const list = buildList(['aaa', 'bbb']);
    const result = deleteTask(list, 'tidak-ada');
    expect(result.map((t) => t.text)).toEqual(['aaa', 'bbb']);
    expect(result).not.toBe(list);
  });

  it('menghasilkan daftar kosong setelah menghapus satu-satunya Task (Req 5.5)', () => {
    const list = buildList(['satu']);
    const result = deleteTask(list, list[0].id);
    expect(result).toHaveLength(0);
  });
});
