import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CSpinner } from '@coreui/react';

// Layouts
import DefaultLayout from './layout/DefaultLayout';

// Views
import Login from './views/Login';
import Dashboard from './views/Dashboard';
import Bookings from './views/Bookings';
import BookingDetails from './views/BookingDetails';
import VisitHistory from './views/VisitHistory';
import SessionTracking from './views/SessionTracking';
import Profile from './views/Profile';
import ClinicDetails from './views/ClinicDetails';
import HomeExercises from './views/HomeExercises';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-vh-100 d-flex justify-content-center align-items-center">
        <CSpinner color="primary" variant="grow" />
      </div>
    );
  }

  return user ? children : <Navigate to="/login" />;
};

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense
          fallback={
            <div className="min-vh-100 d-flex justify-content-center align-items-center">
              <CSpinner color="primary" variant="grow" />
            </div>
          }
        >
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <DefaultLayout />
                </PrivateRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="bookings" element={<Bookings />} />
              <Route path="bookings/:id" element={<BookingDetails />} />
              <Route path="bookings/:id/history" element={<VisitHistory />} />
              <Route path="bookings/:id/sessions" element={<SessionTracking />} />
              <Route path="bookings/:id/home-exercises" element={<HomeExercises />} />
              <Route path="profile" element={<Profile />} />
              <Route path="clinic" element={<ClinicDetails />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
