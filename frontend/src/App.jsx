import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import ChangePassword from './pages/ChangePassword';
import Dashboard from './pages/Dashboard';
import MasterAdminDashboard from './pages/MasterAdminDashboard';
import AvailabilitySettings from './pages/AvailabilitySettings';
import PublicProfile from './pages/PublicProfile';
import BookEventType from './pages/BookEventType';
import BookingConfirmed from './pages/BookingConfirmed';

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/change-password"
          element={
            <ProtectedRoute>
              <ChangePassword />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requiredRole="advisor">
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/availability"
          element={
            <ProtectedRoute requiredRole="advisor">
              <AvailabilitySettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/master-admin"
          element={
            <ProtectedRoute requiredRole="master_admin">
              <MasterAdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/booking-confirmed" element={<BookingConfirmed />} />
        <Route path="/advisor/:username" element={<PublicProfile />} />
        <Route path="/advisor/:username/:slug" element={<BookEventType />} />
        <Route path="*" element={<div className="container">Page not found</div>} />
      </Routes>
    </>
  );
}
