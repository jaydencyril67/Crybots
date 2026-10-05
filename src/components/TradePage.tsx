import React from 'react';
import ParentPageLayout, { ParentPageCard } from './ParentPageLayout';
import NowBar from './NowBar';

const destinations: ParentPageCard[] = [
  { label: 'Chart', description: 'Monitor automated strategies and review the live crypto market.', route: '/chart' },
  { label: 'Market', description: 'Review positions opened by your trading bots.', route: '/market' },
  { label: 'Portfolio', description: 'Review your balances, positions, and trading performance.', route: '/portfolio' },
  { label: 'Trade history', description: 'Review completed and cancelled trades from your bots.', route: '/trade/history' },
];

const TradePage = () => <><ParentPageLayout title="Trade" description="Monitor your automated trading activity and manage the bots working in crypto markets." cards={destinations} /><NowBar /></>;

export default TradePage;
