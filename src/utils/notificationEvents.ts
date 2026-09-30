export const NOTIFICATIONS_CHANGED_EVENT = 'ke:notifications-changed';
export const AUTH_CHANGED_EVENT = 'ke:auth-changed';

export const notifyNotificationsChanged = (detail?: { unreadCount?: number }) => {
  window.dispatchEvent(new CustomEvent(NOTIFICATIONS_CHANGED_EVENT, { detail }));
};

export const notifyAuthChanged = () => {
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
};
