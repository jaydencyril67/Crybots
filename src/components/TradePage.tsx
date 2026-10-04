import React from 'react';
import ParentPageLayout, { ParentPageCard } from './ParentPageLayout';
import NowBar from './NowBar';

const destinations: ParentPageCard[] = [
  { label: 'Bot workspace', description: 'Monitor automated strategies and review the live crypto market.', route: '/trade/exchange' },
  { label: 'Active bot trades', description: 'Review positions opened by your trading bots.', route: '/trade/orders' },
  { label: 'Bot performance', description: 'View balances, positions and automated trading performance.', route: '/trade/portfolio' },
  { label: 'Bot trade history', description: 'Review completed and cancelled bot trades.', route: '/trade/history' },
];

const TradePage = () => <><ParentPageLayout title="Trade" description="Monitor your automated trading activity and manage the bots working in crypto markets." cards={destinations} /><NowBar /></>;

export default TradePage;
