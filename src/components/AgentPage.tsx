import React from 'react';
import ParentPageLayout, { ParentPageCard } from './ParentPageLayout';
import NowBar from './NowBar';

const destinations: ParentPageCard[] = [
  { label: 'Stats', description: 'Review your referrals, earnings, rankings, and progress.', route: '/stats' },
  { label: 'Tools', description: 'Manage your referral code, invite link, and QR code.', route: '/tools' },
  { label: 'Menu', description: 'Change referral settings and manage your agent earnings.', route: '/menu' },
];

const AgentPage = () => <><ParentPageLayout title="Agent" description="Manage your referrals, tools, performance, and rewards." cards={destinations} /><NowBar /></>;

export default AgentPage;
