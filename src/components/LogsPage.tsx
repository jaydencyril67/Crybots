import React from 'react';
import ParentPageLayout, { ParentPageCard } from './ParentPageLayout';
import NowBar from './NowBar';

const destinations: ParentPageCard[] = [
  { label: 'Transactions', description: 'View your transaction history and status.', route: '/transactions' },
  { label: 'App Usage', description: 'See how many times you have opened each protected page.', route: '/app-usage' },
];

const LogsPage = () => <><ParentPageLayout title="Logs" description="Review your transactions and app usage." cards={destinations} /><NowBar /></>;

export default LogsPage;
