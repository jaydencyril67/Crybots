import React from 'react';
import ParentPageLayout, { ParentPageCard } from './ParentPageLayout';

const destinations: ParentPageCard[] = [
  { label: 'Playstore', description: 'Download the KingsHall app from Google Play.' },
  { label: 'AppStore', description: 'Download the KingsHall app from the App Store.' },
  { label: 'Android APK', description: 'Download the Android APK directly.' },
];

const LibraryPage = () => <ParentPageLayout title="Library" description="Choose a download option for the KingsHall Exchange app." cards={destinations} />;

export default LibraryPage;
