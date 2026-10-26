import { defineConfig } from 'vite';

/**
 * O site usa rotas reais (History API), portanto o servidor precisa devolver
 * index.html em rotas profundas. Vite já faz isso no `dev`; Netlify está
 * configurado em netlify.toml e o build copia index.html para 404.html para
 * funcionar no GitHub Pages.
 *
 * Em produção, VITE_BASE_PATH permite publicar em subpastas (ex.: /space-law/).
 */
export default defineConfig(() => {
  const base = process.env.VITE_BASE_PATH || '/';

  return {
    base,
    build: {
      target: 'es2022',
      sourcemap: false,
    },
    server: {
      port: 5173,
      strictPort: false,
    },
    preview: {
      port: 4173,
      strictPort: false,
    },
  };
});
