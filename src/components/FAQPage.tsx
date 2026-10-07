import React from 'react';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import { useAppTheme } from './AppTheme';
import { navigate } from '../utils/navigate';
import NowBar from './NowBar';

type FAQItem = {
  question: string;
  answer: string;
};

type FAQSection = {
  title: string;
  items: FAQItem[];
};

const faqSections: FAQSection[] = [
  {
    title: 'Getting started',
    items: [
      { question: 'What is CryBots?', answer: 'CryBots is a crypto trading bot platform where users can rent ready-made bots, build automated strategies and buy bots to trade crypto markets, while managing funds and reviewing performance.' },
      { question: 'How do I create an account?', answer: 'Choose Sign up, enter your details, and confirm your email using the verification message we send you. After confirmation, sign in to access your account.' },
      { question: 'Why do I need to verify my email?', answer: 'Email verification helps protect your account and makes sure important security, account, and transaction messages reach you.' },
      { question: 'I forgot my password. What should I do?', answer: 'Use Forgot password on the sign-in page and follow the email instructions to create a new password. Never share a password or verification code with anyone.' },
    ],
  },
  {
    title: 'Account security',
    items: [
      { question: 'How can I protect my account?', answer: 'Use a unique password, keep your email secure, enable two-factor authentication or a passkey from Security, and review notifications for unfamiliar activity.' },
      { question: 'What are passkeys and two-factor authentication?', answer: 'A passkey lets a supported device authenticate you without typing a password. Two-factor authentication adds a second verification step, such as an authenticator code, when you sign in.' },
      { question: 'Why was my withdrawal or transfer blocked?', answer: 'Security controls can temporarily block fund movements after sensitive account changes or when additional verification is required. Review Security and contact support if the block remains.' },
      { question: 'What should I do if I see activity I do not recognise?', answer: 'Secure your email and account immediately, change your password, review Security and active sessions, and contact support with the relevant transaction or notification details.' },
    ],
  },
  {
    title: 'Deposits and withdrawals',
    items: [
      { question: 'How do I deposit crypto?', answer: 'Open Deposit, choose the supported asset and network, then send funds only to the address and network shown for that deposit. Sending an unsupported asset or using the wrong network may result in permanent loss.' },
      { question: 'Which networks and assets are supported?', answer: 'The available choices are shown in the Deposit and Withdraw pages and can change over time. Always check the selected asset and network immediately before sending funds.' },
      { question: 'Why has my deposit not appeared yet?', answer: 'Blockchain deposits need network confirmations before they are credited. Check that the transaction was sent to the displayed address on the correct network, then use its transaction hash when contacting support.' },
      { question: 'How do I withdraw funds?', answer: 'Open Withdrawals, select the asset and network, enter the destination address and amount, review every detail, and complete the requested security verification before submitting.' },
      { question: 'Can I cancel a withdrawal?', answer: 'A withdrawal may only be cancelled while it is still pending and the option is available in the app. Once broadcast to the blockchain, it generally cannot be reversed.' },
      { question: 'Why did I receive less than the amount I entered?', answer: 'Network fees, platform fees, or the recipient network may affect the final amount. Review the fee and net amount shown before confirming the withdrawal.' },
    ],
  },
  {
    title: 'Trading bots, performance, and transfers',
    items: [
      { question: 'How do I use a trading bot?', answer: 'Open the bot marketplace or builder, review the strategy, markets, risk settings and terms, then rent, build or buy a bot and activate it when you are ready. Automated trading results are not guaranteed.' },
      { question: 'Are bot results or trade prices guaranteed?', answer: 'No. Digital-asset prices, market data, liquidity and bot performance can change quickly. Historical results do not guarantee future performance.' },
      { question: 'What is shown in bot performance?', answer: 'Performance views can show balances, active positions, bot activity, realized and unrealized results, and related value information. Market values are estimates and can change as markets move.' },
      { question: 'How do I send funds to another user?', answer: 'Open Transfer, enter the recipient details and amount, carefully review the destination, and complete the security checks. Transfers are different from blockchain withdrawals.' },
      { question: 'Where can I find my bot and transaction history?', answer: 'Open the bot performance, trade history or Transactions and Logs areas to review bot activity, deposits, withdrawals, trades and transfers with their current status.' },
    ],
  },
  {
    title: 'Account controls and support',
    items: [
      { question: 'How do I update my profile or preferences?', answer: 'Use Profile for personal details and Manage or Options for account preferences. Some sensitive changes may require your password or additional verification.' },
      { question: 'How do I disable or self-exclude my account?', answer: 'Open Danger from your account area. Disable temporarily restricts access, while self-exclusion is a stronger account-safety action. Read the warnings carefully because these actions can affect access to your account.' },
      { question: 'Can I delete my account?', answer: 'Yes, the account deletion option is available under Danger. Deletion is a serious action; confirm that you understand the consequences and keep any records you may need before proceeding.' },
      { question: 'How do I contact support?', answer: 'Open Help to find the available support options. Include your account email, transaction ID or blockchain hash, and a clear description of the issue. Never include your password, private key, or one-time security code.' },
      { question: 'How do notifications and alerts work?', answer: 'Notifications keep you informed about account and transaction events. Alert Settings lets you control supported alerts so you can respond quickly to important activity.' },
    ],
  },
];

const getStyles = (theme: typeof HYBRID_THEME_TOKENS.dark) => ({
  page: { minHeight: '100vh', overflowX: 'hidden' as const, overflowY: 'auto' as const, paddingBottom: '90px', background: theme.background, color: theme.text },
  shell: { width: '100%', maxWidth: '920px', margin: '0 auto', padding: 'clamp(18px, 4vw, 36px) clamp(14px, 3vw, 28px) 28px', boxSizing: 'border-box' as const },
  content: { display: 'grid', gap: '14px', marginTop: '10px' },
  rowList: { display: 'grid', gap: '10px', width: '100%', minWidth: 0, padding: '10px', borderRadius: '16px', border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass, boxSizing: 'border-box' as const },
  faqRow: { width: '100%', maxWidth: '100%', display: 'grid', gap: '6px', background: theme.surfaceMuted, border: `1px solid ${theme.borderGlass}`, borderRadius: '15px', padding: '13px 14px', boxSizing: 'border-box' as const },
  summary: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', cursor: 'pointer', listStyle: 'none' as const },
  question: { margin: 0, fontSize: '0.94rem', fontWeight: 800, color: theme.text },
  answer: { margin: '10px 0 0', fontSize: '0.84rem', color: theme.textMuted, lineHeight: 1.55 },
  sectionTitle: { margin: 0, fontSize: '1.15rem', fontWeight: 900, letterSpacing: '-0.02em', color: theme.text },
  sectionText: { margin: '3px 0 0', fontSize: '0.82rem', color: theme.textMuted, lineHeight: 1.4, maxWidth: '62ch' },
  back: { display: 'inline-flex', alignItems: 'center', alignSelf: 'start', justifySelf: 'start', width: 'fit-content', gap: '6px', border: `1px solid ${theme.borderGlass}`, borderRadius: '10px', padding: '7px 10px', background: theme.surfaceGlass, color: theme.text, cursor: 'pointer', fontSize: '0.84rem', marginBottom: '12px' },
});

const FAQPage = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const styles = getStyles(theme);

  return (
    <HybridTheme mode={themeMode}>
      <div style={styles.page}>
        <div style={styles.shell}>
          <div style={styles.content}>
            <button type="button" style={styles.back} onClick={() => navigate('/help')}><ArrowLeft size={17} /> Help</button>
            <div style={styles.rowList}>
                <header>
                  <h2 style={styles.sectionTitle}>Frequently asked questions</h2>
                  <p style={styles.sectionText}>Helpful answers about your CryBots account, security, funds, and support.</p>
                </header>
                {faqSections.map((section) => (
                  <section key={section.title}>
                    <h3 style={styles.sectionTitle}>{section.title}</h3>
                    <p style={styles.sectionText}>Quick guidance for common {section.title.toLowerCase()} questions.</p>
                    <div style={{ display: 'grid', gap: '8px', marginTop: '10px' }}>
                      {section.items.map((item, index) => (
                        <details key={item.question} style={styles.faqRow} open={index === 0 && section.title === 'Getting started'}>
                          <summary style={styles.summary}><span style={styles.question}>{item.question}</span><ChevronDown size={17} /></summary>
                          <p style={styles.answer}>{item.answer}</p>
                        </details>
                      ))}
                    </div>
                  </section>
                ))}
            </div>
          </div>
        </div>
      </div>
      <NowBar />
    </HybridTheme>
  );
};

export default FAQPage;
