/** Usuário local enquanto login/cadastro não está ativo */
export const LOCAL_USER = {
  uid: 'marmita_local',
  displayName: 'Minha Marmita',
  email: '',
};

export function getUserLabel(user) {
  if (!user) return 'Minha Marmita';
  return user.displayName || user.email?.split('@')[0] || 'Minha Marmita';
}
