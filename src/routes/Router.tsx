import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from '../pages/HomePage';
import BookingPage from '../pages/BookingPage';
import BookingSuccessPage from '../pages/BookingSuccessPage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import ProtectedRoute from './ProtectedRoute';
import Layout from '../components/Layout';
import ProfilePage from '../pages/ProfilePage';
import EditProfilePage from '../pages/EditProfilePage';
import BookingHistoryPage from '../pages/BookingHistoryPage';

// Admin
import AdminLayout from '../admin/components/AdminLayout';
import AdminDashboardPage from '../admin/pages/AdminDashboardPage';
import AdminDishPage from '../admin/pages/AdminDishPage';
import AdminBookingPage from '../admin/pages/AdminBookingPage';
import AdminUserPage from '../admin/pages/AdminUserPage';
import AdminDishFormPage from '../admin/pages/AdminDishFormPage';
import AdminNotificationPage from '../admin/pages/AdminNotificationPage';
import BookingDetailPage from '../pages/BookingDetailPage';


const AppRouter: React.FC = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={<Layout><LoginPage /></Layout>}
      />
      <Route
        path="/register"
        element={<Layout><RegisterPage /></Layout>}
      />
      <Route
        path="/"
        element={<Layout><HomePage /></Layout>}
      />
      <Route
        path="/home"
        element={<Layout><HomePage /></Layout>}
      />
      <Route
        path="/menu"
        element={<Layout><div>Menu Page</div></Layout>}
      />
      <Route
        path="/about"
        element={<Layout><div>About Page</div></Layout>}
      />
      <Route
        path="/contact"
        element={<Layout><div>Contact Page</div></Layout>}
      />

      {/* Protected user routes */}
      <Route element={<ProtectedRoute />}>
        <Route
          path="/booking"
          element={<Layout><BookingPage /></Layout>}
        />
        <Route
          path="/booking-success"
          element={<Layout><BookingSuccessPage /></Layout>}
        />
        <Route
          path="/profile"
          element={<Layout><ProfilePage /></Layout>}
        />
        <Route
          path="/profile/edit"
          element={<Layout><EditProfilePage /></Layout>}
        />
        <Route
          path="/booking-history"
          element={<Layout><BookingHistoryPage /></Layout>}
        />
        <Route
          path="/bookings-history/:id"
          element={<Layout><BookingDetailPage /></Layout>}
        />
      </Route>

      {/* Protected admin routes */}
      <Route element={<ProtectedRoute />}>
        {/* </Route><Route path="/admin" element={<AdminLayout />}> */}
          <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="dishes" element={<AdminDishPage />} />
          <Route path="/admin/dishes/new" element={<AdminDishFormPage />} />
          <Route path="/admin/dishes/:id/edit" element={<AdminDishFormPage />} />
          <Route path="/admin/dishes/:id" element={<AdminDishFormPage />} />
          <Route path="bookings" element={<AdminBookingPage />} />
          <Route path="/admin/bookings/:id" element={<AdminBookingPage />} />
          <Route path="users" element={<AdminUserPage />} />
          <Route path="/admin/notifications" element={<AdminNotificationPage />} />
          {/* Add other admin pages here */}
        </Route>
      </Route>
    </Routes>
  );
};

export default AppRouter;
