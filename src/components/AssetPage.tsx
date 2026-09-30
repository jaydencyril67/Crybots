import React from 'react';
import ParentPageLayout, { ParentPageCard } from './ParentPageLayout';
import NowBar from './NowBar';

const destinations: ParentPageCard[] = [
  { label: 'Deposit', description: 'Add USDT to your wallet from an external address.', route: '/deposit' },
  { label: 'Withdraw', description: 'Send USDT from your wallet to an external address.', route: '/withdrawals' },
  { label: 'Transfer', description: 'Send USDT to another KingsHall user.', route: '/transfer' },
  { label: 'Manage', description: 'Review and manage your assets.', route: '/manage' },
];

const AssetPage = () => <><ParentPageLayout title="Assets" description="Manage your funds and choose an asset action below." cards={destinations} /><NowBar /></>;

export default AssetPage;
