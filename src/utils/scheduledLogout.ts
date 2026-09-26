export const SCHEDULED_LOGOUT_STORAGE_KEY = 'kingshall_scheduled_logout';

export const getScheduledLogout = () => window.localStorage.getItem(SCHEDULED_LOGOUT_STORAGE_KEY) || '';

export const setScheduledLogout = (value: string) => {
  if (value) {
    window.localStorage.setItem(SCHEDULED_LOGOUT_STORAGE_KEY, value);
  } else {
    window.localStorage.removeItem(SCHEDULED_LOGOUT_STORAGE_KEY);
  }

  window.dispatchEvent(new Event('ke:scheduled-logout-change'));
};

export const isScheduledLogoutDue = (value: string, now = Date.now()) => {
  const scheduledTime = new Date(value).getTime();
  return Number.isFinite(scheduledTime) && scheduledTime <= now;
};
