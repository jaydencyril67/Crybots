import React from 'react';
import ParentPageLayout, { ParentPageCard } from './ParentPageLayout';

const destinations: ParentPageCard[] = [
  { label: 'Coin Staking', description: 'Put your coins to work with staking plans.', route: '/staking' },
  { label: 'Cloud Mining', description: 'Explore cloud mining opportunities.' },
  { label: 'Copy Trading', description: 'Follow and copy experienced traders.' },
];

const ExchangePage = () => <ParentPageLayout title="Exchange" description="Choose an exchange service to continue." cards={destinations} />;

export default ExchangePage;
