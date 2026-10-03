import React from 'react';
import ParentPageLayout, { ParentPageCard } from './ParentPageLayout';
import NowBar from './NowBar';

const destinations: ParentPageCard[] = [
  { label: 'Exchange', description: 'Place market orders against live market data.', route: '/trade/exchange' },
  { label: 'Open trades', description: 'Review your active rise and fall trades.', route: '/trade/orders' },
  { label: 'Portfolio', description: 'View positions, balances, and trading performance.', route: '/trade/portfolio' },
  { label: 'Trade history', description: 'Review completed and cancelled orders.', route: '/trade/history' },
];

const TradePage = () => <><ParentPageLayout title="Trade" description="Choose a trading service to continue." cards={destinations} /><NowBar /></>;

export default TradePage;
