import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';

// `import b64 from './model.glb?b64'` -> base64 string. Models ship inside the JS
// bundle so the build works on hosts that won't serve .glb files.
const base64Assets = () => ({
  name: 'base64-assets',
  enforce: 'pre',
  load(id) {
    if (!id.endsWith('?b64')) return null;
    const file = id.slice(0, -4);
    this.addWatchFile(file);
    return `export default ${JSON.stringify(readFileSync(file).toString('base64'))};`;
  },
});

export default defineConfig({
  base: './',
  plugins: [base64Assets()],
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 5000,
    rollupOptions: { output: { entryFileNames: 'assets/game.js' } },
  },
});
