import React from 'react';
import ParentPageLayout, { ParentPageCard } from './ParentPageLayout';
import NowBar from './NowBar';

const destinations: ParentPageCard[] = [
  { label: 'Market', description: 'Follow live KingsHall market movement.', route: '/market' },
  { label: 'My Space', description: 'View your personal investment balance and performance.', route: '/my-space' },
  { label: 'Control Center', description: 'Automate point withdrawals and protect your initial capital.', route: '/control-center' },
];

const TradePage = () => <><ParentPageLayout title="Trade" description="Choose a trading service to continue." cards={destinations} /><NowBar /></>;

export default TradePage;
