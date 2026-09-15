import api from '../api/axios';

type BalanceListener = (balance: { usdtBalance: number | null; fiatBalance: number | null } | null) => void;

const STORAGE_KEYS = ['kingshall_user', 'user'];
const BALANCE_EVENT = 'kingshall:balance-updated';
const BALANCE_REFRESH_ENDPOINT = '/api/auth/me';

let cachedBalance: number | null = null;
const listeners = new Set<BalanceListener>();

const readStoredBalance = () => {
  try {
    for (const key of STORAGE_KEYS) {
      const raw = window.localStorage.getItem(key);
      if (!raw) {
        continue;
      }

      const parsed = JSON.parse(raw) as { usdtBalance?: number; fiatBalance?: number };
      if (typeof parsed.usdtBalance === 'number') {
        return parsed.usdtBalance;
      }
    }
  } catch {
    return null;
  }

  return null;
};

const writeStoredBalance = (balance: number) => {
  for (const key of STORAGE_KEYS) {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      continue;
    }

    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const nextProfile = { ...parsed, usdtBalance: balance };
      window.localStorage.setItem(key, JSON.stringify(nextProfile));
    } catch {
      // Ignore malformed cached auth payloads.
    }
  }
};

const notifyListeners = (balance: { usdtBalance: number | null; fiatBalance: number | null } | null) => {
  listeners.forEach((listener) => listener(balance));
};

export const getCachedBalance = () => {
  if (typeof cachedBalance === 'number') {
    return cachedBalance;
  }

  if (typeof window === 'undefined') {
    return null;
  }

  cachedBalance = readStoredBalance();
  return cachedBalance;
};

export const setCachedBalance = (balance: number | null) => {
  cachedBalance = balance;

  if (typeof window !== 'undefined' && typeof balance === 'number') {
    writeStoredBalance(balance);
    window.dispatchEvent(new CustomEvent(BALANCE_EVENT, { detail: balance }));
  }

  notifyListeners({ usdtBalance: balance, fiatBalance: null });
};

export const syncBalanceFromBackend = async () => {
  const response = await api.get(BALANCE_REFRESH_ENDPOINT);
  const nextProfile = response.data?.user ?? response.data;

  if (typeof nextProfile?.usdtBalance === 'number') {
    setCachedBalance(nextProfile.usdtBalance);
  }

  return {
    usdtBalance: typeof nextProfile?.usdtBalance === 'number' ? nextProfile.usdtBalance : null,
    fiatBalance: typeof nextProfile?.fiatBalance === 'number' ? nextProfile.fiatBalance : null,
  };
};

export const subscribeBalance = (listener: BalanceListener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const balanceEventName = BALANCE_EVENT;

export const refreshBalanceFromBackend = async () => {
  const balance = await syncBalanceFromBackend();
  return balance;
};
