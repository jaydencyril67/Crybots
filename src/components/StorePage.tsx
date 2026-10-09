import React from 'react';
import ParentPageLayout, { ParentPageCard } from './ParentPageLayout';
import NowBar from './NowBar';

const destinations: ParentPageCard[] = [
  { label: 'Application', description: 'Download the KingsHall app.', route: '/download' },
  { label: 'WorldScope', description: 'Global rankings, bot performance and market intelligence.', route: '/worldscope' },
];

const StorePage = () => <><ParentPageLayout title="Store" description="Explore KingsHall applications and tools." cards={destinations} /><NowBar /></>;

export default StorePage;
