import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Footer } from './components/Footer';
import { Navbar } from './components/Navbar';
import { usePolicies } from './hooks/usePolicies';
import { AssistantPage } from './pages/AssistantPage';
import { HomePage } from './pages/HomePage';
import { MyBenefitsPage } from './pages/MyBenefitsPage';
import { PoliciesPage } from './pages/PoliciesPage';

export default function App() {
  const { policies, meta, isLoading, error, refetch } = usePolicies();

  return (
    <BrowserRouter>
      <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route
              path="/"
              element={<HomePage policies={policies} isLoading={isLoading} />}
            />
            <Route
              path="/policies"
              element={
                <PoliciesPage
                  policies={policies}
                  meta={meta}
                  isLoading={isLoading}
                  error={error}
                  onRefresh={refetch}
                />
              }
            />
            <Route
              path="/assistant"
              element={
                <AssistantPage
                  policies={policies}
                  isLoadingPolicies={isLoading}
                />
              }
            />
            <Route
              path="/my-benefits"
              element={<MyBenefitsPage policies={policies} />}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
