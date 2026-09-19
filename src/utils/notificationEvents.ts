export const NOTIFICATIONS_CHANGED_EVENT = 'ke:notifications-changed';
export const AUTH_CHANGED_EVENT = 'ke:auth-changed';

export const notifyNotificationsChanged = () => {
  window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT));
};

export const notifyAuthChanged = () => {
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
};
