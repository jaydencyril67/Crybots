import React from 'react';
import ParentPageLayout, { ParentPageCard } from './ParentPageLayout';
import NowBar from './NowBar';

const destinations: ParentPageCard[] = [
  { label: 'Application', description: 'Download the KingsHall app.', route: '/download' },
];

const StorePage = () => <><ParentPageLayout title="Store" description="Download the KingsHall app." cards={destinations} /><NowBar /></>;

export default StorePage;
