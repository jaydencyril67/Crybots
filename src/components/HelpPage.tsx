import React from 'react';
import ParentPageLayout, { ParentPageCard } from './ParentPageLayout';
import NowBar from './NowBar';

const destinations: ParentPageCard[] = [
  { label: 'FAQ', description: 'Find answers to frequently asked questions.', route: '/faq' },
  { label: 'Live Chat', description: 'Chat live with the KingsHall support team.', route: '/chat' },
  { label: 'Tickets', description: 'Create and manage your support requests.', route: '/tickets' },
  { label: 'Tutorial', description: 'Learn how to rent, build and manage KingsHall trading bots.' },
];

const HelpPage = () => <><ParentPageLayout title="Help" description="Find answers and connect with the KingsHall support team." cards={destinations} /><NowBar /></>;

export default HelpPage;
