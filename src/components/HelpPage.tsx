import React from 'react';
import ParentPageLayout, { ParentPageCard } from './ParentPageLayout';
import NowBar from './NowBar';

const destinations: ParentPageCard[] = [
  { label: 'FAQ', description: 'Find answers to frequently asked questions.', route: '/faq' },
  { label: 'Live Chat', description: 'Chat live with the CryBots support team.', route: '/chat' },
  { label: 'Tickets', description: 'Create and manage your support requests.', route: '/tickets' },
];

const HelpPage = () => <><ParentPageLayout title="Help" description="Find answers and connect with the CryBots support team." cards={destinations} /><NowBar /></>;

export default HelpPage;
