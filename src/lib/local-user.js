/** Usuario local mientras login/cadastro no está activo */
export const LOCAL_USER = {
  uid: 'paletas_local',
  displayName: 'Mi Kit',
  email: '',
};

export function getUserLabel(user) {
  if (!user) return 'Mi Kit';
  return user.displayName || user.email?.split('@')[0] || 'Mi Kit';
}
