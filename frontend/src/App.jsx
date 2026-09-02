import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AvailabilitySettings from './pages/AvailabilitySettings';
import PublicProfile from './pages/PublicProfile';
import BookEventType from './pages/BookEventType';
import BookingConfirmed from './pages/BookingConfirmed';
import MyBookings from './pages/MyBookings';

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute organizerOnly>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/availability"
          element={
            <ProtectedRoute organizerOnly>
              <AvailabilitySettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-bookings"
          element={
            <ProtectedRoute>
              <MyBookings />
            </ProtectedRoute>
          }
        />
        <Route path="/booking-confirmed" element={<BookingConfirmed />} />
        <Route path="/u/:username" element={<PublicProfile />} />
        <Route path="/u/:username/:slug" element={<BookEventType />} />
        <Route path="*" element={<div className="container">Page not found</div>} />
      </Routes>
    </>
  );
}
