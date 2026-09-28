import React from 'react';
import ParentPageLayout, { ParentPageCard } from './ParentPageLayout';

const destinations: ParentPageCard[] = [
  { label: 'API Keys', description: 'Create and manage keys for secure API access.', route: '/api-keys' },
  { label: 'Webhooks', description: 'Configure event notifications for your integrations.', route: '/webhooks' },
  { label: 'Configure', description: 'Adjust dev tools and integration preferences.', route: '/configure' },
];

const DevPage = () => <ParentPageLayout title="Dev" description="Manage dev tools and integrations for your KingsHall Exchange account." cards={destinations} />;

export default DevPage;
