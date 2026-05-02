/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {ThemeModeProvider} from '@/components/ThemeModeProvider';
import {BrowserRouter, Routes, Route, Navigate} from 'react-router-dom';
import {AuthProvider, useAuth} from '@/lib/auth';
import {Toaster} from '@/components/ui/sonner';
import {AnalyticsTracker} from '@/components/AnalyticsTracker';
import Layout from '@/components/Layout';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import CreateExam from '@/pages/CreateExam';
import Schedule from '@/pages/Schedule';
import Archives from '@/pages/Archives';
import Settings from '@/pages/Settings';
import Dev from '@/pages/Dev';

import PendingApproval from '@/pages/PendingApproval';

function ProtectedRoute({children, allowedRoles, adminOnly}: {children: React.ReactNode, allowedRoles?: string[], adminOnly?: boolean}) {
  const {user} = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.approvalStatus !== 'approved' && !user.isAdmin) {
    return <PendingApproval />;
  }

  if (adminOnly && !user.isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (user.isAdmin && !adminOnly) {
    return <Navigate to="/dev" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <ThemeModeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AnalyticsTracker />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/dev" element={
              <ProtectedRoute adminOnly={true}>
                <Dev />
              </ProtectedRoute>
            } />
            
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="create-exam" element={
                <ProtectedRoute allowedRoles={['teacher']}>
                  <CreateExam />
                </ProtectedRoute>
              } />
              <Route path="archives" element={
                <ProtectedRoute allowedRoles={['teacher']}>
                  <Archives />
                </ProtectedRoute>
              } />
              <Route path="schedule" element={<Schedule />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
          <Toaster position="bottom-center" />
        </BrowserRouter>
      </AuthProvider>
    </ThemeModeProvider>
  );
}
