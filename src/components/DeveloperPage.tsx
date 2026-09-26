import React from 'react';
import ParentPageLayout, { ParentPageCard } from './ParentPageLayout';

const destinations: ParentPageCard[] = [
  { label: 'Api Keys', description: 'Create and manage keys for secure API access.', route: '/developer/api-keys' },
  { label: 'Webhooks', description: 'Configure event notifications for your integrations.', route: '/developer/webhooks' },
  { label: 'Configure', description: 'Adjust developer tools and integration preferences.', route: '/developer/configure' },
];

const DeveloperPage = () => <ParentPageLayout title="Developer" description="Manage developer tools and integrations for your KingsHall Exchange account." cards={destinations} />;

export default DeveloperPage;
