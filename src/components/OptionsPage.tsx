import React from 'react';
import ParentPageLayout, { ParentPageCard } from './ParentPageLayout';
import NowBar from './NowBar';

const destinations: ParentPageCard[] = [
  { label: 'NowBar', description: 'Manage the NowBar experience.', route: '/nowbar' },
  { label: 'Alert', description: 'Choose notification topics and delivery methods.', route: '/alert' },
];

const OptionsPage = () => <><ParentPageLayout title="Options" description="Customize your app experience and notification preferences." cards={destinations} /><NowBar /></>;

export default OptionsPage;
