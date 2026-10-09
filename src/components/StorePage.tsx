import React from 'react';
import ParentPageLayout, { ParentPageCard } from './ParentPageLayout';
import NowBar from './NowBar';

const destinations: ParentPageCard[] = [
  { label: 'Download', description: 'Download the KingsHall app.' },
];

const StorePage = () => <><ParentPageLayout title="Store" description="Download the KingsHall app." cards={destinations} /><NowBar /></>;

export default StorePage;
