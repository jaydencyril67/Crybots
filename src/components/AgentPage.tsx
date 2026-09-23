import React from 'react';
import ParentPageLayout, { ParentPageCard } from './ParentPageLayout';

const destinations: ParentPageCard[] = [
  { label: 'Stats', description: 'Review your referrals, earnings, rankings, and progress.', route: '/agent/stats' },
  { label: 'Tools', description: 'Manage your referral code, invite link, and QR code.', route: '/agent/tools' },
  { label: 'Menu', description: 'Change referral settings and manage your agent earnings.', route: '/agent/menu' },
];

const AgentPage = () => <ParentPageLayout title="Agent" description="Manage your referrals, tools, performance, and rewards." cards={destinations} />;

export default AgentPage;
