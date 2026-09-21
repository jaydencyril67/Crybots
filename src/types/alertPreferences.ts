export type AlertPreferenceTopic = 'account' | 'security' | 'transactions' | 'market';
export type AlertPreferenceChannel = 'email' | 'push' | 'inApp';

export interface AlertPreferences {
  account: boolean;
  security: boolean;
  transactions: boolean;
  market: boolean;
  email: boolean;
  push: boolean;
  inApp: boolean;
}

export interface AlertPreferencesResponse {
  preferences: AlertPreferences;
}
