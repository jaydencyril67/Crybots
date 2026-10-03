import React from 'react';
import LegalPage from './LegalPage';

const InformationPage = () => (
  <LegalPage
    eyebrow="A clear guide to KingsHall Exchange"
    title="Information"
    summary="Learn how KingsHall Exchange handles accounts, assets, orders, portfolio records, security and market information supplied by the hosted Market service."
    updated="September 23, 2026"
    sections={[
      { title: '1. About KingsHall Exchange', content: <><p>KingsHall Exchange is a digital-asset platform for eligible users to manage accounts, review market information, hold supported assets and access exchange features.</p><p>Features, assets, limits and availability may vary by jurisdiction, verification level, account status and operational conditions.</p></> },
      { title: '2. Market data and charts', content: <><p>KingsHall may display live prices, charts and other market information supplied by the hosted Market service or other third-party sources.</p><p>Data can be delayed, incomplete, unavailable or inaccurate. A displayed price is not a guarantee that an order will execute at that price.</p></> },
      { title: '3. Orders and execution', content: <><p>Orders, balances, execution, positions, portfolio records and trade history are managed by KingsHall.</p><p>Review the symbol, side and trade amount before submitting. Market orders execute at the current available market price, which can change as the market moves.</p></> },
      { title: '4. Accounts and eligibility', content: <p>Provide accurate information and use only your own account. Eligibility can depend on age, location, identity verification, sanctions screening and product requirements.</p> },
      { title: '5. Digital-asset risks', content: <p>Digital assets involve volatility, illiquidity, technical failure, cyberattack, counterparty risk, regulatory change, operational delay and possible loss of some or all value. Use only funds you can afford to lose.</p> },
      { title: '6. Deposits, withdrawals and transfers', content: <p>Network confirmations, congestion, payment providers, risk reviews and legal obligations can affect processing times. Confirm the correct asset, network and destination before submitting an irreversible transfer.</p> },
      { title: '7. Limits', content: <p>Trading minimums, limits, spreads and network costs may apply where relevant. The applicable information should be shown during the relevant flow or in the associated product terms.</p> },
      { title: '8. Portfolio and records', content: <p>Review balances, positions, portfolio values and trade history regularly. Records can be delayed or corrected when an error, reversal or network update is identified.</p> },
      { title: '9. Security', content: <p>Protect your password, passkeys, recovery methods, devices, email account and authentication codes. KingsHall support will not ask for private keys, recovery phrases, passwords or one-time codes.</p> },
      { title: '10. Verification and reviews', content: <p>We may request identity, address, source-of-funds or other information to protect accounts and meet legal obligations. Reviews may temporarily restrict activity.</p> },
      { title: '11. Notifications', content: <p>Operational, security, verification and legal notices may be sent even when optional communications are disabled. Keep your contact information current.</p> },
      { title: '12. Support', content: <p>Use the official support channels provided within KingsHall. Include timestamps, references and screenshots with credentials and unnecessary personal information removed.</p> },
      { title: '13. Third-party services', content: <p>KingsHall may rely on independent networks, payment providers, infrastructure providers and market-data services. Their availability, terms and performance may differ from ours.</p> },
      { title: '14. Availability', content: <p>Maintenance, upgrades, network failures, attacks, third-party outages and extraordinary demand can interrupt services. Do not repeatedly submit an instruction when its status is unclear.</p> },
      { title: '15. Responsible use', content: <p>Do not use KingsHall for fraud, money laundering, sanctions evasion, unauthorized access, market manipulation, impersonation, malware or activity intended to conceal asset sources or destinations.</p> },
      { title: '16. Privacy', content: <p>We handle information to operate accounts, process instructions, provide support, prevent abuse, meet legal obligations and protect users. Review the Privacy Policy for more detail.</p> },
      { title: '17. Independent decisions', content: <p>Market information is not investment, legal or tax advice. Make your own assessment and consider qualified professional advice for your circumstances.</p> },
      { title: '18. Changes to services', content: <p>Products, supported assets, interfaces, limits, providers and availability may change as the platform develops. Review current terms before relying on a feature.</p> },
      { title: '19. Before submitting an order', content: <ul><li>Confirm the correct account and available funds.</li><li>Check the symbol, side and trade amount.</li><li>Review the current-price execution conditions.</li><li>Save the confirmation and reference when appropriate.</li></ul> },
      { title: '20. Final reminder', content: <p>If anything is unclear, pause before acting and contact official support. Never let an unsolicited message pressure you into trading or sharing account credentials.</p> },
    ]}
  />
);

export default InformationPage;
