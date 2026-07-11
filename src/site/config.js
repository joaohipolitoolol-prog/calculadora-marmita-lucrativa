/** URL canônica do produto — atualizar se mudar domínio */
export const SITE_URL = 'https://paletasparawhatsapp.vercel.app';

export const LOGIN_PATH = '/login';
export const REGISTER_PATH = '/cadastrar';
export const MEMBERS_PATH = '/app';
export const APP_PATH = '/app';
export const UPSELL_PATH = '/upsell-paletas-premium';

export const LOGIN_URL = `${SITE_URL}${LOGIN_PATH}`;
export const REGISTER_URL = `${SITE_URL}${REGISTER_PATH}`;
export const MEMBERS_URL = `${SITE_URL}${MEMBERS_PATH}`;
export const APP_URL = `${SITE_URL}${APP_PATH}`;
export const POST_PURCHASE_UPSELL_URL = `${SITE_URL}${UPSELL_PATH}`;
export const ACCESS_SHORT_PATH = '/acesso';
export const ACCESS_SHORT_URL = `${SITE_URL}${ACCESS_SHORT_PATH}`;
export const POST_PURCHASE_LOGIN_URL = `${REGISTER_URL}?compra=1&src=hotmart&line=paletas`;
export const POST_PURCHASE_APP_URL = `${APP_URL}?compra=1&src=hotmart&line=paletas`;
