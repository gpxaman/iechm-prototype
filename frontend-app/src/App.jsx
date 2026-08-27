import { useEffect } from 'react';
import { Routes, Route, Outlet } from 'react-router-dom';
import { BottomNav, SheetHost, ToastHost } from './components/Shell.jsx';
import { useStore } from './lib/store.js';
import { api } from './lib/api.js';

import Welcome from './routes/onboarding/Welcome.jsx';
import AccountCreate from './routes/onboarding/AccountCreate.jsx';
import QuickStartBuy from './routes/onboarding/QuickStartBuy.jsx';
import QuickStartBuild from './routes/onboarding/QuickStartBuild.jsx';
import QuickStartEarn from './routes/onboarding/QuickStartEarn.jsx';

import BuyHome from './routes/buy/BuyHome.jsx';
import Discover from './routes/buy/Discover.jsx';
import SearchResults from './routes/buy/SearchResults.jsx';
import ProductDetail from './routes/buy/ProductDetail.jsx';
import Cart from './routes/buy/Cart.jsx';
import Checkout from './routes/buy/Checkout.jsx';

import BuildHome from './routes/build/BuildHome.jsx';
import FullAssistant from './routes/build/FullAssistant.jsx';
import RequirementList from './routes/build/RequirementList.jsx';
import ProjectOverview from './routes/build/ProjectOverview.jsx';
import RequirementDetail from './routes/build/RequirementDetail.jsx';
import CustomRequestForm from './routes/build/CustomRequestForm.jsx';
import CustomRequestReview from './routes/build/CustomRequestReview.jsx';
import PilotRun from './routes/build/PilotRun.jsx';

import EarnHome from './routes/earn/EarnHome.jsx';
import DealOnboarding from './routes/earn/DealOnboarding.jsx';
import SubmitOpportunity from './routes/earn/SubmitOpportunity.jsx';
import DealDetails from './routes/earn/DealDetails.jsx';
import Earnings from './routes/earn/Earnings.jsx';

import Projects from './routes/global/Projects.jsx';
import Activity from './routes/global/Activity.jsx';
import Notifications from './routes/global/Notifications.jsx';
import You from './routes/global/You.jsx';

import SupplierRegister from './routes/supplier/SupplierRegister.jsx';
import GstVerification from './routes/supplier/GstVerification.jsx';
import CatalogueUpload from './routes/supplier/CatalogueUpload.jsx';
import ScanningState from './routes/supplier/ScanningState.jsx';
import ExtractionResults from './routes/supplier/ExtractionResults.jsx';
import ExceptionReview from './routes/supplier/ExceptionReview.jsx';

function RootLayout() {
  return (
    <>
      <Outlet />
      <BottomNav />
    </>
  );
}

export default function App() {
  const setCartCount = useStore((s) => s.setCartCount);
  const setUnreadCount = useStore((s) => s.setUnreadCount);

  useEffect(() => {
    api.cart().then((c) => setCartCount(c.reduce((n, l) => n + l.qty, 0))).catch(() => {});
    api.notifications().then((n) => setUnreadCount(n.filter((x) => !x.read).length)).catch(() => {});
  }, []);

  return (
    <div className="app-shell">
      <div className="app-body">
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/account" element={<AccountCreate />} />
          <Route path="/quickstart/buy" element={<QuickStartBuy />} />
          <Route path="/quickstart/build" element={<QuickStartBuild />} />
          <Route path="/quickstart/earn" element={<QuickStartEarn />} />

          <Route element={<RootLayout />}>
            <Route path="/buy" element={<BuyHome />} />
            <Route path="/build" element={<BuildHome />} />
            <Route path="/earn" element={<EarnHome />} />
            <Route path="/discover" element={<Discover />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/activity" element={<Activity />} />
            <Route path="/you" element={<You />} />
          </Route>

          <Route path="/search-results" element={<SearchResults />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />

          <Route path="/build/assistant" element={<FullAssistant />} />
          <Route path="/build/requirements" element={<RequirementList />} />
          <Route path="/project/:id" element={<ProjectOverview />} />
          <Route path="/project/:projectId/requirement/:reqId" element={<RequirementDetail />} />
          <Route path="/custom-request/new" element={<CustomRequestForm />} />
          <Route path="/request/:id" element={<CustomRequestReview />} />
          <Route path="/project/:id/pilot" element={<PilotRun />} />

          <Route path="/earn/onboarding" element={<DealOnboarding />} />
          <Route path="/earn/submit" element={<SubmitOpportunity />} />
          <Route path="/deal/:id" element={<DealDetails />} />
          <Route path="/earn/earnings" element={<Earnings />} />

          <Route path="/notifications" element={<Notifications />} />

          <Route path="/supplier/register" element={<SupplierRegister />} />
          <Route path="/supplier/verify" element={<GstVerification />} />
          <Route path="/supplier/catalogue" element={<CatalogueUpload />} />
          <Route path="/supplier/scanning" element={<ScanningState />} />
          <Route path="/supplier/extraction" element={<ExtractionResults />} />
          <Route path="/supplier/exceptions" element={<ExceptionReview />} />
        </Routes>
      </div>
      <SheetHost />
      <ToastHost />
    </div>
  );
}
