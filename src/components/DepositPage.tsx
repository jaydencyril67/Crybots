import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BadgeDollarSign, Building2, CreditCard, ShieldCheck, Wallet } from 'lucide-react';
import AppHeader from './AppHeader';
import NowBar from './NowBar';
import { navigate } from '../utils/navigate';

const authToken = window.localStorage.getItem('token') ?? '';

const paystackPublicKey = process.env.REACT_APP_PAYSTACK_PUBLIC_KEY ?? '';

type DepositMethod = 'fiat' | 'crypto';

type FiatFormState = {
  amount: string;
};

const styles = {
  page: {
    minHeight: '100vh',
    padding: '24px 16px 104px',
    background: 'radial-gradient(circle at top, rgba(37,99,235,0.18), transparent 35%), linear-gradient(180deg, #07111f 0%, #050b14 100%)',
    color: '#eef4ff',
  },
  shell: {
    width: 'min(920px, 100%)',
    margin: '0 auto',
  },
  card: {
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '28px',
    background: 'rgba(8,14,26,0.82)',
    boxShadow: '0 24px 60px rgba(0,0,0,0.36)',
    backdropFilter: 'blur(18px)',
    WebkitBackdropFilter: 'blur(18px)',
    padding: '22px',
  },
  headerRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    marginBottom: '18px',
    flexWrap: 'wrap' as const,
  },
  backButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.04)',
    color: '#eef4ff',
    borderRadius: '999px',
    padding: '10px 14px',
    cursor: 'pointer',
  },
  title: {
    fontSize: 'clamp(28px, 5vw, 42px)',
    margin: 0,
  },
  subtitle: {
    margin: '10px 0 0',
    color: 'rgba(238,244,255,0.74)',
    lineHeight: 1.6,
  },
  selector: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '14px',
    marginTop: '22px',
    marginBottom: '22px',
  },
  option: {
    textAlign: 'left' as const,
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.03)',
    color: '#eef4ff',
    borderRadius: '22px',
    padding: '18px',
    cursor: 'pointer',
  },
  optionActive: {
    borderColor: 'rgba(96,165,250,0.7)',
    background: 'rgba(59,130,246,0.14)',
  },
  optionTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '18px',
    fontWeight: 700,
    margin: 0,
  },
  optionText: {
    margin: '10px 0 0',
    color: 'rgba(238,244,255,0.72)',
    lineHeight: 1.5,
  },
  form: {
    display: 'grid',
    gap: '14px',
    marginTop: '18px',
  },
  field: {
    display: 'grid',
    gap: '8px',
  },
  label: {
    fontSize: '13px',
    color: 'rgba(238,244,255,0.72)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
  },
  input: {
    width: '100%',
    borderRadius: '16px',
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.04)',
    color: '#eef4ff',
    padding: '14px 16px',
    fontSize: '16px',
    outline: 'none',
  },
  helper: {
    color: 'rgba(238,244,255,0.68)',
    fontSize: '14px',
  },
  buttonRow: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap' as const,
    marginTop: '8px',
  },
  primaryButton: {
    border: 'none',
    background: 'linear-gradient(135deg, #60a5fa, #a78bfa)',
    color: '#08111f',
    padding: '14px 18px',
    borderRadius: '16px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  mutedCard: {
    marginTop: '16px',
    borderRadius: '22px',
    padding: '18px',
    border: '1px dashed rgba(255,255,255,0.12)',
    color: 'rgba(238,244,255,0.72)',
  },
};

const DepositPage = () => {
  const [method, setMethod] = useState<DepositMethod>('fiat');
  const [fiatForm, setFiatForm] = useState<FiatFormState>({ amount: '' });
  const [isPaystackLoading, setIsPaystackLoading] = useState(false);
  const [paystackScriptLoaded, setPaystackScriptLoaded] = useState(false);

  useEffect(() => {
    if (window.PaystackPop) {
      setPaystackScriptLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    script.onload = () => setPaystackScriptLoaded(true);
    script.onerror = () => setPaystackScriptLoaded(false);
    document.body.appendChild(script);

    return () => {
      script.onload = null;
      script.onerror = null;
    };
  }, []);

  const amountNumber = Number(fiatForm.amount);
  const canStartFiatDeposit = Boolean(amountNumber >= 100 && paystackPublicKey);

  const cryptoContent = useMemo(() => (
    <div style={styles.mutedCard}>
      <strong>Crypto deposits</strong>
      <p style={{ margin: '10px 0 0' }}>
        Crypto deposits are coming next. We will add wallet network selection, address generation, and transaction tracking after the fiat flow is live.
      </p>
    </div>
  ), []);

  const openPaystackCheckout = () => {
    const amountInKobo = Math.round(amountNumber * 100);
    const publicKey = paystackPublicKey;

    if (!publicKey) {
      window.alert('Paystack public key is missing. Set REACT_APP_PAYSTACK_PUBLIC_KEY to enable fiat deposits.');
      return;
    }

    if (!window.PaystackPop) {
      window.alert('Paystack checkout is not loaded yet. Please refresh the page and try again.');
      return;
    }

    setIsPaystackLoading(true);
    const handler = window.PaystackPop.setup({
      key: publicKey,
      email: authToken ? JSON.parse(window.localStorage.getItem('kingshall_user') ?? window.localStorage.getItem('user') ?? '{}')?.email ?? '' : '',
      amount: amountInKobo,
      currency: 'USD',
      metadata: {
        source: 'KingsHall deposit page',
        method: 'fiat',
        depositType: 'fiat',
        userId: JSON.parse(window.localStorage.getItem('kingshall_user') ?? window.localStorage.getItem('user') ?? '{}')?.id ?? '',
      },
      callback: (response: { reference?: string }) => {
        void (async () => {
          try {
            const reference = response?.reference;
            if (!reference) {
              throw new Error('Missing payment reference.');
            }

            const verificationResponse = await fetch('/api/paystack/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${authToken}`,
              },
              body: JSON.stringify({ reference }),
            });

            if (!verificationResponse.ok) {
              throw new Error('Deposit verification failed.');
            }

            window.alert('Payment successful. Your fiat balance has been updated.');
          } catch (error) {
            window.alert(error instanceof Error ? error.message : 'Payment verification failed.');
          } finally {
            setIsPaystackLoading(false);
          }
        })();
      },
      onClose: () => {
        setIsPaystackLoading(false);
      },
    });

    handler.openIframe();
  };

  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <AppHeader />
        <div style={styles.card}>
          <div style={styles.headerRow}>
            <button type="button" style={styles.backButton} onClick={() => navigate('dashboard')}>
              <ArrowLeft size={18} /> Back
            </button>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
              <ShieldCheck size={18} />
              <span>Secure deposits</span>
            </div>
          </div>

          <h1 style={styles.title}>Deposit funds</h1>
          <p style={styles.subtitle}>
            Choose fiat or crypto. Fiat deposits are available now through Paystack; crypto deposits will be added next.
          </p>

          <div style={styles.selector}>
            <button type="button" style={{ ...styles.option, ...(method === 'fiat' ? styles.optionActive : {}) }} onClick={() => setMethod('fiat')}>
              <h2 style={styles.optionTitle}><BadgeDollarSign size={18} /> Fiat deposit</h2>
              <p style={styles.optionText}>Fund your account with card or supported local payment methods through Paystack.</p>
            </button>
            <button type="button" style={{ ...styles.option, ...(method === 'crypto' ? styles.optionActive : {}) }} onClick={() => setMethod('crypto')}>
              <h2 style={styles.optionTitle}><Wallet size={18} /> Crypto deposit</h2>
              <p style={styles.optionText}>We’ll add on-chain deposits with network and wallet address selection soon.</p>
            </button>
          </div>

          {method === 'fiat' ? (
            <div style={styles.form}>
              <label style={styles.field}>
                <span style={styles.label}>Amount</span>
                <input
                  style={styles.input}
                  type="number"
                  min="100"
                  step="1"
                  value={fiatForm.amount}
                  onChange={(event) => setFiatForm((current) => ({ ...current, amount: event.target.value }))}
                  placeholder="Enter deposit amount"
                />
                <span style={styles.helper}>Minimum fiat deposit is 100.</span>
              </label>
              <div style={styles.buttonRow}>
                <button type="button" style={styles.primaryButton} onClick={openPaystackCheckout} disabled={!canStartFiatDeposit || isPaystackLoading || !paystackScriptLoaded || !authToken}>
                  {isPaystackLoading ? 'Opening Paystack...' : !paystackScriptLoaded ? 'Loading Paystack...' : 'Deposit with Paystack'}
                </button>
              </div>
              {!authToken ? (
                <div style={styles.mutedCard}>
                  Please sign in first so we can attach your account to the deposit.
                </div>
              ) : null}
              {!paystackPublicKey ? (
                <div style={styles.mutedCard}>
                  Paystack is not configured yet. Add <code>REACT_APP_PAYSTACK_PUBLIC_KEY</code> to enable checkout.
                </div>
              ) : null}
              {!paystackScriptLoaded ? (
                <div style={styles.mutedCard}>
                  Loading Paystack checkout...
                </div>
              ) : null}
            </div>
          ) : (
            cryptoContent
          )}
        </div>
        <NowBar />
      </div>
    </div>
  );
};

export default DepositPage;

declare global {
  interface Window {
    PaystackPop?: {
      setup: (options: {
        key: string;
        email: string;
        amount: number;
        currency: string;
        metadata?: Record<string, string>;
        callback: (response: { reference?: string }) => void;
        onClose: () => void;
      }) => { openIframe: () => void };
    };
  }
}
