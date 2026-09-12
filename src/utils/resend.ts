import { Resend } from 'resend';

const resendApiKey = process.env.REACT_APP_RESEND_API_KEY;

let resendClient: Resend | null = null;

export const getResendClient = () => {
  if (!resendApiKey) {
    throw new Error('RESEND_API_KEY is not configured.');
  }

  if (!resendClient) {
    resendClient = new Resend(resendApiKey);
  }

  return resendClient;
};
