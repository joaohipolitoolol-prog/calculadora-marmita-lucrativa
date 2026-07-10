import { resolve } from 'path';
import { defineConfig } from 'vite';

const htmlRewrites = {
  '/upsell-paletas-premium': '/upsell-paletas-premium.html',
  '/postres/upsell': '/postres-upsell.html',
  '/upsell-postres-premium': '/postres-upsell.html',
  '/postres': '/postres.html',
  '/postresaviso': '/postres-aviso.html',
};

function devHtmlRewrites() {
  return {
    name: 'dev-html-rewrites',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const pathname = req.url?.split('?')[0] ?? '';
        const target = htmlRewrites[pathname];
        if (target) {
          const query = req.url?.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
          req.url = `${target}${query}`;
        }
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [devHtmlRewrites()],
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
