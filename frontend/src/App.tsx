import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ErrorBoundary } from './components/ErrorBoundary'
import { LoadingSpinner } from './components/LoadingSpinner'
import { useAuthStore } from './stores/auth.store'

// Layouts
const DashboardLayout = lazy(() => import('./modules/dashboard/components/DashboardLayout'))

// Pages
const LoginPage = lazy(() => import('./modules/auth/pages/LoginPage'))
const DashboardPage = lazy(() => import('./modules/dashboard/pages/DashboardPage'))
const AthletesPage = lazy(() => import('./modules/athletes/pages/AthletesPage'))
const AthleteDetailPage = lazy(() => import('./modules/athletes/pages/AthleteDetailPage'))
const AthleteFormPage = lazy(() => import('./modules/athletes/pages/AthleteFormPage'))
const WellnessPage = lazy(() => import('./modules/wellness/pages/WellnessPage'))
const TrainingLoadPage = lazy(() => import('./modules/training-load/pages/TrainingLoadPage'))
const AlertsPage = lazy(() => import('./modules/alerts/pages/AlertsPage'))
const SettingsPage = lazy(() => import('./modules/settings/pages/SettingsPage'))
const InjuriesPage = lazy(() => import('./modules/injuries/pages/InjuriesPage'))
const ReportsPage = lazy(() => import('./modules/reports/pages/ReportsPage'))
const NotFoundPage = lazy(() => import('./modules/common/pages/NotFoundPage'))

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingSpinner fullScreen />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="athletes" element={<AthletesPage />} />
            <Route path="athletes/new" element={<AthleteFormPage />} />
            <Route path="athletes/:id" element={<AthleteDetailPage />} />
            <Route path="athletes/:id/edit" element={<AthleteFormPage />} />
            
            {/* Sprint 3 routes */}
            <Route path="training" element={<TrainingLoadPage />} />
            <Route path="wellness" element={<WellnessPage />} />
            <Route path="injuries" element={<InjuriesPage />} />
            <Route path="alerts" element={<AlertsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  )
}

export default App
