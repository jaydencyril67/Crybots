import api from '../api/axios';

export type ClientActivityAction = 'create' | 'update' | 'delete' | 'submit' | 'enable' | 'disable' | 'login' | 'logout' | 'other';

export const logClientActivity = (params: {
  action?: ClientActivityAction;
  title: string;
  description: string;
}) => {
  if (!localStorage.getItem('token')) return;

  void api.post('/api/activity/custom', {
    action: params.action || 'update',
    title: params.title,
    description: params.description,
  }).catch(() => {
    // Activity logging must never interrupt a user's settings change.
  });
};
