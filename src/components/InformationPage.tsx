import React from 'react';
import LegalPage from './LegalPage';

const InformationPage = () => (
  <LegalPage
    eyebrow="A clear guide to CryBots trading bots"
    title="Information"
    summary="Learn how CryBots helps users rent, build and buy crypto trading bots, manage assets, review bot performance and understand market risks."
    updated="September 23, 2026"
    sections={[
      { title: '1. About CryBots trading bots', content: <><p>CryBots is a digital-asset platform where eligible users can rent ready-made trading bots, build automated strategies and buy bots offered through the platform to trade crypto markets.</p><p>Bot availability, strategy features, supported assets, limits and access may vary by jurisdiction, verification level, account status and operational conditions.</p></> },
      { title: '2. Market data and bot activity', content: <><p>CryBots may display live prices, charts and other market information supplied by third-party sources to help you monitor automated strategies.</p><p>Data can be delayed, incomplete, unavailable or inaccurate. Bot decisions and executions may differ from displayed prices because markets move quickly and liquidity can change.</p></> },
      { title: '3. Bots and execution', content: <><p>Bot configurations, balances, executions, positions, portfolio records and trade history are managed through CryBots.</p><p>Review a bot's strategy, markets, risk settings, rental or purchase terms and permissions before activating it. Automated execution occurs at available market conditions and is not guaranteed.</p></> },
      { title: '4. Accounts and eligibility', content: <p>Provide accurate information and use only your own account. Eligibility can depend on age, location, identity verification, sanctions screening and product requirements.</p> },
      { title: '5. Digital-asset risks', content: <p>Digital assets involve volatility, illiquidity, technical failure, cyberattack, counterparty risk, regulatory change, operational delay and possible loss of some or all value. Use only funds you can afford to lose.</p> },
      { title: '6. Deposits, withdrawals and transfers', content: <p>Network confirmations, congestion, payment providers, risk reviews and legal obligations can affect processing times. Confirm the correct asset, network and destination before submitting an irreversible transfer.</p> },
      { title: '7. Bot plans and limits', content: <p>Bot rental periods, purchase prices, usage limits, trading minimums, spreads and network costs may apply. The applicable information should be shown in the bot marketplace, builder or associated product terms.</p> },
      { title: '8. Bot performance and records', content: <p>Review balances, positions, bot activity, portfolio values and trade history regularly. Performance records can be delayed or corrected when an error, reversal or market or network update is identified.</p> },
      { title: '9. Security', content: <p>Protect your passkeys, recovery methods, devices, email account and authentication codes. CryBots support will not ask for private keys, recovery phrases or one-time codes.</p> },
      { title: '10. Verification and reviews', content: <p>We may request identity, address, source-of-funds or other information to protect accounts and meet legal obligations. Reviews may temporarily restrict activity.</p> },
      { title: '11. Notifications', content: <p>Operational, security, verification and legal notices may be sent even when optional communications are disabled. Keep your contact information current.</p> },
      { title: '12. Support', content: <p>Use the official support channels provided within CryBots. Include timestamps, references and screenshots with credentials and unnecessary personal information removed.</p> },
      { title: '13. Third-party services', content: <p>CryBots may rely on independent networks, payment providers, infrastructure providers and market-data services. Their availability, terms and performance may differ from ours.</p> },
      { title: '14. Availability', content: <p>Maintenance, upgrades, network failures, attacks, third-party outages and extraordinary demand can interrupt services. Do not repeatedly submit an instruction when its status is unclear.</p> },
      { title: '15. Responsible use', content: <p>Do not use CryBots for fraud, money laundering, sanctions evasion, unauthorized access, market manipulation, impersonation, malware or activity intended to conceal asset sources or destinations.</p> },
      { title: '16. Privacy', content: <p>We handle information to operate accounts, process instructions, provide support, prevent abuse, meet legal obligations and protect users. Review the Privacy Policy for more detail.</p> },
      { title: '17. Independent decisions', content: <p>Bot descriptions, historical results and market information are not investment, legal or tax advice and do not guarantee future performance. Make your own assessment and consider qualified professional advice for your circumstances.</p> },
      { title: '18. Changes to services', content: <p>Products, supported assets, interfaces, limits, providers and availability may change as the platform develops. Review current terms before relying on a feature.</p> },
      { title: '19. Before activating a bot', content: <ul><li>Confirm the correct account and available funds.</li><li>Review the bot strategy, markets, permissions and risk settings.</li><li>Check rental, purchase or usage terms and possible costs.</li><li>Understand that automated trading can lose money and save the activation reference when appropriate.</li></ul> },
      { title: '20. Final reminder', content: <p>If anything is unclear, pause before activating, renting or buying a bot and contact official support. Never let an unsolicited message pressure you into trading or sharing account credentials.</p> },
    ]}
  />
);

export default InformationPage;
