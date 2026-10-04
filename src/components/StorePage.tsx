import React from 'react';
import ParentPageLayout, { ParentPageCard } from './ParentPageLayout';
import NowBar from './NowBar';

const destinations: ParentPageCard[] = [
  { label: 'Playstore', description: 'Download the KingsHall app from Google Play.' },
  { label: 'AppStore', description: 'Download the KingsHall app from the App Store.' },
  { label: 'Android APK', description: 'Download the Android APK directly.' },
];

const StorePage = () => <><ParentPageLayout title="Store" description="Choose a download option for the KingsHall crypto trading bot platform." cards={destinations} /><NowBar /></>;

export default StorePage;
