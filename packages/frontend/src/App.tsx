import { Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { LandingPage } from '@/pages/LandingPage';
import { ScanPage } from '@/pages/ScanPage';
import { ReportPage } from '@/pages/ReportPage';
import { HistoryPage } from '@/pages/HistoryPage';
import { DashboardPage } from '@/pages/DashboardPage';
import Settings from '@/pages/Settings';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route element={<Layout />}>
        <Route path="/scan" element={<ScanPage />} />
        <Route path="/report/:scanId" element={<ReportPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}
