export const isTokenValid = (token: string) => {
  try {
    const payload = JSON.parse(window.atob(token.split('.')[1]));
    return typeof payload.exp === 'number' ? payload.exp * 1000 > Date.now() : false;
  } catch {
    return false;
  }
};
