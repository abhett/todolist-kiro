import { defineConfig } from 'vitest/config';

// Konfigurasi Vitest untuk Todo_App.
//
// - Environment default `node`: cocok untuk test logika domain murni (task.js)
//   dan persistensi (store.js) yang tidak memerlukan DOM.
// - Test presentasi (view.js) yang membutuhkan DOM mengaktifkan jsdom per-file
//   dengan menambahkan komentar di baris atas file test:
//       // @vitest-environment jsdom
//   `jsdom` tersedia sebagai devDependency sehingga environment ini siap pakai.
// - Eksekusi tunggal (sekali jalan, bukan watch) dijalankan via `npm test`
//   yang memakai flag `--run`.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,mjs}', 'test/**/*.{test,spec}.{js,mjs}'],
    globals: true,
  },
});
