import React from 'react';
import ParentPageLayout, { ParentPageCard } from './ParentPageLayout';

const destinations: ParentPageCard[] = [
  { label: 'Transactions', description: 'View your transaction history and status.', route: '/transactions' },
  { label: 'Activity Log', description: 'Review actions from the last 24 hours.', route: '/activity-log' },
];

const RecordsPage = () => <ParentPageLayout title="Records" description="Review your transactions and account activity." cards={destinations} />;

export default RecordsPage;
