import React from 'react';
import ParentPageLayout, { ParentPageCard } from './ParentPageLayout';
import NowBar from './NowBar';

const destinations: ParentPageCard[] = [
  { label: 'Information', description: 'Learn how KingsHall helps you rent, build and buy crypto trading bots.', route: '/information' },
  { label: 'Privacy Policy', description: 'Review how account and platform information is handled.', route: '/privacy-policy' },
  { label: 'Community Standards', description: 'Explore the standards that help keep our community safe.', route: '/community-standards' },
];

const AboutPage = () => <><ParentPageLayout title="About" description="Learn how KingsHall helps you rent, build and buy automated crypto trading bots, plus review our policies and community standards." cards={destinations} /><NowBar /></>;

export default AboutPage;
