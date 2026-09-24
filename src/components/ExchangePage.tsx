import React from 'react';
import ParentPageLayout, { ParentPageCard } from './ParentPageLayout';

const destinations: ParentPageCard[] = [
  { label: 'KingsPool', description: 'Follow KingsHall trading through the shared funds pool.' },
  { label: 'My Space', description: 'View your personal investment balance and performance.' },
  { label: 'Control Center', description: 'Manage your investment settings and account controls.' },
];

const ExchangePage = () => <ParentPageLayout title="Exchange" description="Choose an exchange service to continue." cards={destinations} />;

export default ExchangePage;
