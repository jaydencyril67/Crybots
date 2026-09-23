import React from 'react';
import ParentPageLayout, { ParentPageCard } from './ParentPageLayout';

const destinations: ParentPageCard[] = [
  { label: 'Theme Settings', description: 'Choose your preferred app theme.', route: '/theme-settings' },
  { label: 'Nowbar Settings', description: 'Manage the NowBar experience.', route: '/nowbar-settings' },
  { label: 'Alert Settings', description: 'Choose notification topics and delivery methods.', route: '/alert-settings' },
];

const OptionsPage = () => <ParentPageLayout title="Options" description="Customize your app experience and notification preferences." cards={destinations} />;

export default OptionsPage;
