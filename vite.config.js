import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        login: resolve(__dirname, 'login.html'),
        app: resolve(__dirname, 'app.html'),
        membros: resolve(__dirname, 'membros.html'),
        upsell: resolve(__dirname, 'upsell-paletas-premium.html'),
      },
    },
  },
});
