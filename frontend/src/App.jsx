import { Navigate, BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { PlatformProvider } from './context/PlatformContext'
import PortalLayout from './components/layout/PortalLayout'
import SplashScreen from './components/SplashScreen'
import Login from './pages/Login'
import Jobs from './pages/Jobs'
import Dashboard from './pages/Dashboard'
import Tasks from './pages/Tasks'
import TaskExecution from './pages/TaskExecution'
import TaskHistory from './pages/TaskHistory'
import Earnings from './pages/Earnings'
import Profile from './pages/Profile'
import EditProfile from './pages/EditProfile'
import Kyc from './pages/Kyc'
import BankDetails from './pages/BankDetails'
import Inbox from './pages/Inbox'
import Notifications from './pages/Notifications'
import SettingsPage from './pages/Settings'
import Help from './pages/Help'
import Legal from './pages/Legal'
import VerifyEmail from './pages/VerifyEmail'
import { SecurityProvider } from './context/SecurityContext'

function ProtectedArea() {
  const { user, profile, loading, restoreError } = useAuth()
  const location = useLocation()
  if (loading) return <SplashScreen />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (restoreError || !profile) return <Navigate to="/login" replace state={{ error: restoreError }} />
  if (profile.onboardingStatus === 'applicant') return <Navigate to="/jobs" replace />
  return <PortalLayout />
}

function PublicOnly({ children }) {
  const { user, profile, loading } = useAuth()
  if (loading) return <SplashScreen />
  if (user && profile?.onboardingStatus === 'applicant') return <Navigate to="/jobs" replace />
  if (user && profile) return <Navigate to="/" replace />
  return children
}

function EmployeePortalRoutes() {
  const { loading } = useAuth()

  if (loading) return <SplashScreen />

  return (
    <Routes>
      <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/jobs" element={<Jobs />} />
      <Route element={<ProtectedArea />}>
        <Route index element={<Dashboard />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="tasks/:assignmentId" element={<TaskExecution />} />
        <Route path="task-history" element={<TaskHistory />} />
        <Route path="earnings" element={<Earnings />} />
        <Route path="profile" element={<Profile />} />
        <Route path="profile/edit" element={<EditProfile />} />
        <Route path="profile/kyc" element={<Kyc />} />
        <Route path="profile/bank" element={<BankDetails />} />
        <Route path="inbox" element={<Inbox />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="help" element={<Help />} />
        <Route path="privacy" element={<Legal type="privacy" />} />
        <Route path="terms" element={<Legal type="terms" />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SecurityProvider>
          <PlatformProvider>
            <EmployeePortalRoutes />
          </PlatformProvider>
        </SecurityProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
