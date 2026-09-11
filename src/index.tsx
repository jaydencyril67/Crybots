import React, { Suspense } from 'react';
import './theme.css';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
// Lazy-load heavy pages to reduce initial bundle size
const Login = React.lazy(() => import('./pages/Login'));
const Register = React.lazy(() => import('./pages/Register'));
const Dashboard = React.lazy(() => import('./components/Dashboard'));

// Lazy-load larger route components to reduce initial bundle size
const EditBasicSettings = React.lazy(() => import('./pages/EditBasicSettings'));
const PrivacySettings = React.lazy(() => import('./pages/PrivacySettings'));
const AdditionalSettings = React.lazy(() => import('./pages/AdditionalSettings'));
import ProtectedRoute from './components/ProtectedRoute';
import AdminProtectedRoute from './components/AdminProtectedRoute';
const Deposit = React.lazy(() => import('./pages/Deposit'));
const Withdraw = React.lazy(() => import('./pages/Withdraw'));
const Transfer = React.lazy(() => import('./pages/Transfer'));
const TwoFASettings = React.lazy(() => import('./pages/TwoFASettings'));
import { ThemeProvider } from './ThemeContext';
import { HelmetProvider } from 'react-helmet-async';
const TransactionHistory = React.lazy(() => import('./pages/TransactionHistory'));
const NotificationsPage = React.lazy(() => import('./pages/NotificationsPage'));
const AdminLogin = React.lazy(() => import('./pages/AdminLogin'));
const AdminSignup = React.lazy(() => import('./pages/AdminSignup'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const AdminUsers = React.lazy(() => import('./pages/AdminUsers'));
const AdminWithdrawals = React.lazy(() => import('./pages/AdminWithdrawals'));
const AdminRecent = React.lazy(() => import('./pages/AdminRecent'));
const Trash = React.lazy(() => import('./pages/Trash'));
import { NetworkStatusProvider } from './NetworkStatusProvider';
const Trading = React.lazy(() => import('./pages/Trading'));
const Orders = React.lazy(() => import('./pages/Orders'));
const AdminChat = React.lazy(() => import('./pages/AdminChat'));
const ForgotPassword = React.lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = React.lazy(() => import('./pages/ResetPassword'));
const WebauthnManagement = React.lazy(() => import('./pages/WebauthnManagement'));
const AdminPlatformStats = React.lazy(() => import('./pages/AdminPlatformStats'));
const AdminSendFunds = React.lazy(() => import('./pages/AdminSendFunds'));

const WalletSettings = React.lazy(() => import('./pages/WalletSettings'));
const GlobalTokenValidator = React.lazy(() => import('./components/GlobalTokenValidator'));
const VerifyEmail = React.lazy(() => import('./pages/VerifyEmail'));
// Mining component removed
const CopyTrading = React.lazy(() => import('./pages/CopyTrading'));
const Staking = React.lazy(() => import('./pages/Staking'));
const Contact = React.lazy(() => import('./pages/Contact'));
const NotificationPreferences = React.lazy(() => import('./pages/NotificationPreferences'));
const Agent = React.lazy(() => import('./pages/Agent'));
const ProfileStats = React.lazy(() => import('./pages/ProfileStats'));
const StatisticsProfile = React.lazy(() => import('./pages/StatisticsProfile'));

const container = document.getElementById('root');
if (!container) throw new Error('Root container missing in index.html');
const root = ReactDOM.createRoot(container);

// Hide loading screen when React is ready
const hideLoader = () => {
  const loader = document.getElementById('tradespot-loader');
  if (loader) {
    loader.classList.add('hidden');
    // Remove loader from DOM after fade out animation
    setTimeout(() => {
      loader.remove();
    }, 300);
  }
};

// Component to hide loader after minimum display time
const AppLoader = () => {
  React.useEffect(() => {
    const DISPLAY_TIME = 3000; // Always show for 3 seconds
    
    // Always show splash screen for full 3 seconds regardless of load speed
    const timer = setTimeout(() => {
      hideLoader();
    }, DISPLAY_TIME);
    
    return () => clearTimeout(timer);
  }, []);
  return null;
};

root.render(
  <React.StrictMode>
    <AppLoader />
    <NetworkStatusProvider>
      <ThemeProvider>
        <HelmetProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Suspense fallback={null}>
            <GlobalTokenValidator>
              <Routes>
              {/* Public routes */}
              <Route path="/" element={<Home />} />
              {/* FAQ page removed */}
              <Route path="/l" element={<Login />} />
              <Route path="/r" element={<Register />} />
              <Route path="/ve" element={<VerifyEmail />} />
              <Route path="/fp" element={<ForgotPassword />} />
              <Route path="/rp" element={<ResetPassword />} />
              <Route path="/co" element={<Contact />} />
              {/* Admin login and signup routes */}
              <Route path="/al" element={<AdminLogin />} />
              <Route path="/as" element={<AdminSignup />} />
              {/* Add more admin/protected routes here later */}
              <Route path="/d" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/se" element={
                <ProtectedRoute>
                  <EditBasicSettings />
                </ProtectedRoute>
              } />
              <Route path="/sp" element={
                <ProtectedRoute>
                  <PrivacySettings />
                </ProtectedRoute>
              } />
              <Route path="/sa" element={
                <ProtectedRoute>
                  <AdditionalSettings />
                </ProtectedRoute>
              } />
              <Route path="/sw" element={
                <ProtectedRoute>
                  <WalletSettings />
                </ProtectedRoute>
              } />
              <Route path="/st" element={
                <ProtectedRoute>
                  <StatisticsProfile />
                </ProtectedRoute>
              } />
              <Route path="/ps" element={
                <ProtectedRoute>
                  <ProfileStats />
                </ProtectedRoute>
              } />
              <Route path="/dp" element={
                <ProtectedRoute>
                  <Deposit />
                </ProtectedRoute>
              } />
              <Route path="/w" element={
                <ProtectedRoute>
                  <Withdraw />
                </ProtectedRoute>
              } />
              <Route path="/tr" element={
                <ProtectedRoute>
                  <Transfer />
                </ProtectedRoute>
              } />
              <Route path="/s2" element={
                <ProtectedRoute>
                  <TwoFASettings />
                </ProtectedRoute>
              } />
              <Route path="/th" element={
                <ProtectedRoute>
                  <TransactionHistory />
                </ProtectedRoute>
              } />
              <Route path="/n" element={
                <ProtectedRoute>
                  <NotificationsPage />
                </ProtectedRoute>
              } />
              <Route path="/np" element={
                <ProtectedRoute>
                  <NotificationPreferences />
                </ProtectedRoute>
              } />
              {/* KYC page removed */}
              <Route path="/a" element={
                <AdminProtectedRoute>
                  <AdminDashboard />
                </AdminProtectedRoute>
              } />
              <Route path="/au" element={
                <AdminProtectedRoute>
                  <AdminUsers />
                </AdminProtectedRoute>
              } />
              <Route path="/aw" element={
                <AdminProtectedRoute>
                  <AdminWithdrawals />
                </AdminProtectedRoute>
              } />

              <Route path="/ar" element={
                <AdminProtectedRoute>
                  <AdminRecent />
                </AdminProtectedRoute>
              } />
              <Route path="/atr" element={
                <AdminProtectedRoute>
                  <Trash />
                </AdminProtectedRoute>
              } />
              <Route path="/aps" element={
                <AdminProtectedRoute>
                  <AdminPlatformStats />
                </AdminProtectedRoute>
              } />
              <Route path="/asf" element={
                <AdminProtectedRoute>
                  <AdminSendFunds />
                </AdminProtectedRoute>
              } />

              <Route path="/trading" element={
                <ProtectedRoute>
                  <Trading />
                </ProtectedRoute>
              } />
              <Route path="/orders" element={
                <ProtectedRoute>
                  <Orders />
                </ProtectedRoute>
              } />
              <Route path="/ac" element={
                <AdminProtectedRoute>
                  <AdminChat />
                </AdminProtectedRoute>
              } />
              <Route path="/swm" element={
                <ProtectedRoute>
                  <WebauthnManagement />
                </ProtectedRoute>
              } />

              {/* Mining route removed */}
              <Route path="/ct" element={
                <ProtectedRoute>
                  <CopyTrading />
                </ProtectedRoute>
              } />
              <Route path="/stk" element={
                <ProtectedRoute>
                  <Staking />
                </ProtectedRoute>
              } />
              <Route path="/ag" element={
                <ProtectedRoute>
                  <Agent />
                </ProtectedRoute>
              } />
            </Routes>
          </GlobalTokenValidator>
          </Suspense>
        </BrowserRouter>
      </HelmetProvider>
    </ThemeProvider>
  </NetworkStatusProvider>
  </React.StrictMode>
);
