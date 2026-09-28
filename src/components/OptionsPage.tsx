import React from 'react';
import ParentPageLayout, { ParentPageCard } from './ParentPageLayout';

const destinations: ParentPageCard[] = [
  { label: 'Theme', description: 'Choose your preferred app theme.', route: '/theme' },
  { label: 'Nowbar Settings', description: 'Manage the NowBar experience.', route: '/nowbar-settings' },
  { label: 'Alert', description: 'Choose notification topics and delivery methods.', route: '/alert' },
];

const OptionsPage = () => <ParentPageLayout title="Options" description="Customize your app experience and notification preferences." cards={destinations} />;

export default OptionsPage;
