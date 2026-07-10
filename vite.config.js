import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        login: resolve(__dirname, 'login.html'),
        cadastrar: resolve(__dirname, 'cadastrar.html'),
        app: resolve(__dirname, 'app.html'),
        membros: resolve(__dirname, 'membros.html'),
        upsell: resolve(__dirname, 'upsell-paletas-premium.html'),
        postres: resolve(__dirname, 'postres.html'),
        postresUpsell: resolve(__dirname, 'postres-upsell.html'),
        postresAviso: resolve(__dirname, 'postres-aviso.html'),
        admin: resolve(__dirname, 'admin.html'),
        acesso: resolve(__dirname, 'acesso.html'),
        menuPublic: resolve(__dirname, 'm.html'),
      },
    },
  },
});
