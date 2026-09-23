import React from 'react';
import ParentPageLayout, { ParentPageCard } from './ParentPageLayout';

const destinations: ParentPageCard[] = [
  { label: 'Information', description: 'Learn more about KingsHall Exchange and its services.', route: '/information' },
  { label: 'Privacy Policy', description: 'Review how account and platform information is handled.', route: '/privacy-policy' },
  { label: 'Community Standards', description: 'Explore the standards that help keep our community safe.', route: '/community-standards' },
];

const AboutPage = () => <ParentPageLayout title="About" description="Learn more about KingsHall Exchange, our policies, and the standards that guide our community." cards={destinations} />;

export default AboutPage;
