import React from 'react';
import ParentPageLayout, { ParentPageCard } from './ParentPageLayout';
import NowBar from './NowBar';

const destinations: ParentPageCard[] = [
  { label: 'Auto Exit', description: 'Choose idle or scheduled session exits.', route: '/auto-exit' },
  { label: 'Manual Exit', description: 'Review the warning before ending your session.', route: '/manual-exit' },
];

const ExitPage = () => <><ParentPageLayout title="Exit" description="Choose how you want to end your session, either automatically when idle or manually when you are ready." cards={destinations} /><NowBar /></>;

export default ExitPage;
