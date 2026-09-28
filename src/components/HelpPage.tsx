import React from 'react';
import ParentPageLayout, { ParentPageCard } from './ParentPageLayout';

const destinations: ParentPageCard[] = [
  { label: 'FAQ', description: 'Find answers to frequently asked questions.', route: '/faq' },
  { label: 'Live Chat', description: 'Chat with our support team in real time.' },
  { label: 'Tickets', description: 'Create and manage your support requests.' },
  { label: 'Tutorial', description: 'Learn how to use KingsHall Exchange.' },
];

const HelpPage = () => <ParentPageLayout title="Help" description="Find answers and connect with the KingsHall support team." cards={destinations} />;

export default HelpPage;
