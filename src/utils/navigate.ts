export const navigate = (path: string) => {
  if (window.location.pathname === path) {
    return;
  }

  window.dispatchEvent(new CustomEvent('ke:navigation-start', { detail: { path } }));
  window.history.pushState({}, '', path);
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  window.dispatchEvent(new PopStateEvent('popstate'));
};
