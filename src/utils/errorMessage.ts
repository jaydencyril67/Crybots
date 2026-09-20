import axios from 'axios';

const friendlyMessages: Array<[RegExp, string]> = [
  [/insufficient\s+(?:usdt\s+)?balance|not enough\s+(?:usdt\s+)?balance|insufficient funds/i, 'You do not have enough USDT balance to complete this transaction.'],
  [/invalid\s+security\s+code|incorrect\s+security\s+code|security\s+code.*(?:invalid|incorrect)/i, 'That security code is incorrect. Please check it and try again.'],
  [/invalid\s+(?:current\s+)?password|incorrect\s+(?:current\s+)?password/i, 'The password you entered is incorrect.'],
  [/user not found|recipient.*not found|account.*not found/i, 'We could not find that account. Please check the details and try again.'],
  [/network error|timeout|timed out/i, 'We could not connect right now. Please check your connection and try again.'],
];

const getMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: unknown; error?: unknown } | undefined;
    if (typeof data?.message === 'string') return data.message;
    if (typeof data?.error === 'string') return data.error;
  }

  if (error instanceof Error) return error.message;
  return '';
};

export const getFriendlyErrorMessage = (error: unknown, fallback: string): string => {
  const message = getMessage(error).trim();
  const friendlyMessage = friendlyMessages.find(([pattern]) => pattern.test(message));
  if (friendlyMessage) return friendlyMessage[1];
  if (!message || /^(?:error|request failed|internal server error)$/i.test(message)) return fallback;
  return message;
};
