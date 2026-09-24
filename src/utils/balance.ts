import api from '../api/axios';

export type BalanceState = { usdtBalance: number | null; poolBalance: number | null } | null;

const STORAGE_KEYS = ['kingshall_user', 'user'];
const BALANCE_EVENT = 'kingshall:balance-updated';
const BALANCE_REFRESH_ENDPOINT = '/api/auth/me';

type BalanceListener = (balance: BalanceState) => void;

let cachedBalance: number | null = null;
let cachedPoolBalance: number | null = null;
const listeners = new Set<BalanceListener>();

const readStoredBalance = () => {
  try {
    for (const key of STORAGE_KEYS) {
      const raw = window.localStorage.getItem(key);
      if (!raw) {
        continue;
      }

      const parsed = JSON.parse(raw) as { usdtBalance?: number; poolBalance?: number };
      if (typeof parsed.poolBalance === 'number') {
        cachedPoolBalance = parsed.poolBalance;
      }
      if (typeof parsed.usdtBalance === 'number') {
        return parsed.usdtBalance;
      }
    }
  } catch {
    return null;
  }

  return null;
};

const writeStoredBalance = (balance: number, poolBalance: number | null = cachedPoolBalance) => {
  for (const key of STORAGE_KEYS) {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      continue;
    }

    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const nextProfile = { ...parsed, usdtBalance: balance, ...(typeof poolBalance === 'number' ? { poolBalance } : {}) };
      window.localStorage.setItem(key, JSON.stringify(nextProfile));
    } catch {
      // Ignore malformed cached auth payloads.
    }
  }
};

const notifyListeners = (balance: BalanceState) => {
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

export const getCachedPoolBalance = () => {
  if (typeof cachedPoolBalance === 'number') {
    return cachedPoolBalance;
  }

  if (typeof window === 'undefined') {
    return null;
  }

  readStoredBalance();
  return cachedPoolBalance;
};

export const setCachedBalance = (balance: number | null, poolBalance: number | null = cachedPoolBalance) => {
  cachedBalance = balance;
  cachedPoolBalance = poolBalance;

  if (typeof window !== 'undefined' && typeof balance === 'number') {
    writeStoredBalance(balance, poolBalance);
    window.dispatchEvent(new CustomEvent(BALANCE_EVENT, { detail: { usdtBalance: balance, poolBalance } }));
  }

  notifyListeners({ usdtBalance: balance, poolBalance });
};

export const syncBalanceFromBackend = async () => {
  const response = await api.get(BALANCE_REFRESH_ENDPOINT);
  const nextProfile = response.data?.user ?? response.data;

  const nextPoolBalance = typeof nextProfile?.poolBalance === 'number' ? nextProfile.poolBalance : null;
  if (typeof nextProfile?.usdtBalance === 'number') {
    setCachedBalance(nextProfile.usdtBalance, nextPoolBalance);
  } else if (typeof nextPoolBalance === 'number') {
    cachedPoolBalance = nextPoolBalance;
  }

  return {
    usdtBalance: typeof nextProfile?.usdtBalance === 'number' ? nextProfile.usdtBalance : null,
    poolBalance: nextPoolBalance,

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
