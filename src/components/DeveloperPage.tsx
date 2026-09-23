import React from 'react';
import ParentPageLayout, { ParentPageCard } from './ParentPageLayout';

const destinations: ParentPageCard[] = [
  { label: 'Api Keys', description: 'Create and manage keys for secure API access.' },
  { label: 'Webhooks', description: 'Configure event notifications for your integrations.' },
  { label: 'Configure', description: 'Adjust developer tools and integration preferences.' },
];

const DeveloperPage = () => <ParentPageLayout title="Developer" description="Manage developer tools and integrations for your KingsHall Exchange account." cards={destinations} />;

export default DeveloperPage;
