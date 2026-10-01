import React from 'react';
import ParentPageLayout, { ParentPageCard } from './ParentPageLayout';
import NowBar from './NowBar';

const destinations: ParentPageCard[] = [
  { label: 'Details', description: 'Manage your details.', route: '/details' },
  { label: 'Statistics', description: 'Review your account activity and totals.', route: '/statistics' },
  { label: 'Security', description: 'Manage your password and security controls.', route: '/security' },
  { label: 'Danger', description: 'Access recovery and account actions.', route: '/danger' },
];

const ProfilePage = () => <><ParentPageLayout title="Profile" description="Explore your account sections from focused pages with the controls and details you need." cards={destinations} /><NowBar /></>;

export default ProfilePage;
