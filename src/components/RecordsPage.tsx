import React from 'react';
import ParentPageLayout, { ParentPageCard } from './ParentPageLayout';

const destinations: ParentPageCard[] = [
  { label: 'Transactions', description: 'View your transaction history and status.', route: '/transactions' },
  { label: 'App Usage', description: 'See how many times you have opened each protected page.', route: '/app-usage' },
];

const RecordsPage = () => <ParentPageLayout title="Records" description="Review your transactions and app usage." cards={destinations} />;

export default RecordsPage;
