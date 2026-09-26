import React from 'react';
import ParentPageLayout, { ParentPageCard } from './ParentPageLayout';

const destinations: ParentPageCard[] = [
  { label: 'Market', description: 'Follow live KingsHall market movement.', route: '/market' },
  { label: 'My Space', description: 'View your personal investment balance and performance.', route: '/my-space' },
  { label: 'Control Center', description: 'Automate point withdrawals and protect your initial capital.', route: '/control-center' },
  { label: 'Guide', description: 'Learn how the market works and how to participate.' },
];

const ExchangePage = () => <ParentPageLayout title="Exchange" description="Choose an exchange service to continue." cards={destinations} />;

export default ExchangePage;
