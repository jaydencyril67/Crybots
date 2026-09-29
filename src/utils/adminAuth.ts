export const isAdminToken = (token: string | null) => {
  if (!token) return false;

  try {
    const payload = JSON.parse(window.atob(token.split('.')[1])) as { exp?: number; isAdmin?: boolean };
    return payload.isAdmin === true && typeof payload.exp === 'number' && payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};
