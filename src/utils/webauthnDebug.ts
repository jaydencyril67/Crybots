export type WebAuthnDebugLevel = 'info' | 'success' | 'warning' | 'error';

export type WebAuthnDebugEntry = {
  id: string;
  time: string;
  level: WebAuthnDebugLevel;
  stage: string;
  message: string;
  details?: unknown;
};

type DebugListener = (entry: WebAuthnDebugEntry) => void;

const listeners = new Set<DebugListener>();
const history: WebAuthnDebugEntry[] = [];
let sequence = 0;

const safeDetails = (value: unknown): unknown => {
  if (value instanceof Error) {
    return { name: value.name, message: value.message, stack: value.stack };
  }
  try {
    return JSON.parse(JSON.stringify(value, (key, item) => {
      if (/challenge|token|cookie|authorization|secret|password|credential.?id|raw.?id|user.?id|clientDataJSON|attestationObject|signature/i.test(key)) {
        if (typeof item === 'string') return '[REDACTED]';
      }
      return item;
    }));
  } catch {
    return String(value);
  }
};

export const logWebAuthnDebug = (
  stage: string,
  level: WebAuthnDebugLevel,
  message: string,
  details?: unknown,
) => {
  const entry: WebAuthnDebugEntry = {
    id: `${Date.now()}-${++sequence}`,
    time: new Date().toISOString(),
    level,
    stage,
    message,
    ...(details === undefined ? {} : { details: safeDetails(details) }),
  };
  history.push(entry);
  if (history.length > 500) history.splice(0, history.length - 500);
  listeners.forEach((listener) => listener(entry));
  return entry;
};

export const getWebAuthnDebugHistory = () => [...history];

export const subscribeWebAuthnDebug = (listener: DebugListener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const clearWebAuthnDebugHistory = () => {
  history.splice(0, history.length);
};
