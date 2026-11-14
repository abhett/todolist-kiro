// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  renderTaskList,
  confirmDelete,
  EMPTY_MESSAGE,
} from '../src/view.js';

// Unit test untuk pesan daftar kosong dan dialog konfirmasi hapus (Task 5.6).
// - Pesan "belum ada tugas" tampil tanpa baris Task saat daftar kosong
//   (Req 2.2, 5.5).
// - confirmDelete memunculkan dialog konfirmasi hapus di DOM (Req 5.1).

describe('renderTaskList - pesan daftar kosong (Req 2.2, 5.5)', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('ul');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it('menampilkan pesan "belum ada tugas" tanpa baris Task saat daftar kosong', () => {
    renderTaskList(container, []);

    const emptyMessage = container.querySelector('[data-empty="true"]');
    expect(emptyMessage).not.toBeNull();
    expect(emptyMessage.textContent).toBe(EMPTY_MESSAGE);

    // Tidak ada satu pun baris Task yang dirender.
    expect(container.querySelectorAll('.task-item')).toHaveLength(0);
    expect(container.querySelectorAll('li')).toHaveLength(0);
  });

  it('menampilkan pesan kosong setelah Task terakhir dihapus (render daftar kosong)', () => {
    // Render dengan satu Task lalu render ulang dengan daftar kosong,
    // mensimulasikan penghapusan Task terakhir (Req 5.5).
    renderTaskList(container, [{ id: '1', text: 'satu tugas', completed: false }]);
    expect(container.querySelectorAll('.task-item')).toHaveLength(1);

    renderTaskList(container, []);

    const emptyMessage = container.querySelector('[data-empty="true"]');
    expect(emptyMessage).not.toBeNull();
    expect(emptyMessage.textContent).toBe(EMPTY_MESSAGE);
    expect(container.querySelectorAll('.task-item')).toHaveLength(0);
  });
});

describe('confirmDelete - dialog konfirmasi hapus (Req 5.1)', () => {
  afterEach(() => {
    // Bersihkan overlay yang mungkin tersisa di body.
    const overlay = document.getElementById('nb-confirm-overlay');
    if (overlay) overlay.remove();
  });

  it('memunculkan dialog konfirmasi di DOM', () => {
    const overlay = confirmDelete(
      () => {},
      () => {},
    );

    // Overlay terpasang pada DOM.
    expect(overlay.isConnected).toBe(true);
    expect(document.getElementById('nb-confirm-overlay')).toBe(overlay);

    // Dialog konfirmasi hadir dengan peran dialog.
    const dialog = overlay.querySelector('[role="dialog"]');
    expect(dialog).not.toBeNull();

    // Terdapat pilihan menyetujui dan membatalkan penghapusan.
    expect(overlay.querySelector('.nb-confirm__confirm')).not.toBeNull();
    expect(overlay.querySelector('.nb-confirm__cancel')).not.toBeNull();
  });
});
