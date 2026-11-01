import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import MainLayout from './layouts/MainLayout.jsx';
import DashboardLayout from './layouts/DashboardLayout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Spinner from './components/ui/Spinner.jsx';
import ownerMenu from './pages/owner/ownerMenu.js';
import adminMenu from './pages/admin/adminMenu.js';
import HomePage from './pages/HomePage.jsx';
import RoomsPage from './pages/RoomsPage.jsx';
import RoomDetailPage from './pages/RoomDetailPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import BookingPage from './pages/BookingPage.jsx';
import VnpayReturnPage from './pages/VnpayReturnPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import ProfilePage from './pages/account/ProfilePage.jsx';
import MyBookingsPage from './pages/account/MyBookingsPage.jsx';
import BookingDetailPage from './pages/account/BookingDetailPage.jsx';
import FavoritesPage from './pages/account/FavoritesPage.jsx';

const OwnerDashboardPage = lazy(() => import('./pages/owner/OwnerDashboardPage.jsx'));
const OwnerRoomsPage = lazy(() => import('./pages/owner/OwnerRoomsPage.jsx'));
const OwnerRoomFormPage = lazy(() => import('./pages/owner/OwnerRoomFormPage.jsx'));
const OwnerBookingsPage = lazy(() => import('./pages/owner/OwnerBookingsPage.jsx'));
const OwnerReviewsPage = lazy(() => import('./pages/owner/OwnerReviewsPage.jsx'));
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage.jsx'));
const AdminRoomsPage = lazy(() => import('./pages/admin/AdminRoomsPage.jsx'));
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage.jsx'));
const AdminBookingsPage = lazy(() => import('./pages/admin/AdminBookingsPage.jsx'));
const PromotionsPage = lazy(() => import('./pages/PromotionsPage.jsx'));
const InvoicePage = lazy(() => import('./pages/account/InvoicePage.jsx'));
const OwnerCalendarPage = lazy(() => import('./pages/owner/OwnerCalendarPage.jsx'));
const OwnerCouponsPage = lazy(() => import('./pages/owner/OwnerCouponsPage.jsx'));
const AdminCouponsPage = lazy(() => import('./pages/admin/AdminCouponsPage.jsx'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage.jsx'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage.jsx'));
const NotificationsPage = lazy(() => import('./pages/account/NotificationsPage.jsx'));
const MessagesPage = lazy(() => import('./pages/account/MessagesPage.jsx'));
const BlogListPage = lazy(() => import('./pages/BlogListPage.jsx'));
const BlogDetailPage = lazy(() => import('./pages/BlogDetailPage.jsx'));
const ContactPage = lazy(() => import('./pages/ContactPage.jsx'));
const FaqPage = lazy(() => import('./pages/FaqPage.jsx'));
const AboutPage = lazy(() => import('./pages/AboutPage.jsx'));
const AdminPostsPage = lazy(() => import('./pages/admin/AdminPostsPage.jsx'));
const AdminPostFormPage = lazy(() => import('./pages/admin/AdminPostFormPage.jsx'));
const AdminContactsPage = lazy(() => import('./pages/admin/AdminContactsPage.jsx'));
const AdminReportsPage = lazy(() => import('./pages/admin/AdminReportsPage.jsx'));
const AdminReviewsPage = lazy(() => import('./pages/admin/AdminReviewsPage.jsx'));
const AdminSettingsPage = lazy(() => import('./pages/admin/AdminSettingsPage.jsx'));
const ComparePage = lazy(() => import('./pages/ComparePage.jsx'));
const HostProfilePage = lazy(() => import('./pages/HostProfilePage.jsx'));

const protect = (element, roles) => <ProtectedRoute roles={roles}>{element}</ProtectedRoute>;

export default function App() {
  return (
    <Suspense fallback={<Spinner fullPage />}>
      <Routes>
        <Route element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="rooms" element={<RoomsPage />} />
          <Route path="rooms/:slug" element={<RoomDetailPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route
            path="booking/:roomId"
            element={
              <ProtectedRoute roles={['customer']}>
                <BookingPage />
              </ProtectedRoute>
            }
          />
          <Route path="payment/vnpay-return" element={<VnpayReturnPage />} />
          <Route
            path="account/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="account/bookings"
            element={
              <ProtectedRoute>
                <MyBookingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="account/bookings/:id"
            element={
              <ProtectedRoute>
                <BookingDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="account/favorites"
            element={
              <ProtectedRoute>
                <FavoritesPage />
              </ProtectedRoute>
            }
          />
          <Route path="promotions" element={<PromotionsPage />} />
          <Route path="blog" element={<BlogListPage />} />
          <Route path="blog/:slug" element={<BlogDetailPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="faq" element={<FaqPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="compare" element={<ComparePage />} />
          <Route path="hosts/:id" element={<HostProfilePage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
          <Route path="reset-password/:token" element={<ResetPasswordPage />} />
          <Route path="account/bookings/:id/invoice" element={protect(<InvoicePage />)} />
          <Route path="account/notifications" element={protect(<NotificationsPage />)} />
          <Route path="account/messages" element={protect(<MessagesPage />)} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        <Route
          path="owner"
          element={
            <ProtectedRoute roles={['owner']}>
              <DashboardLayout menu={ownerMenu} title="Kênh chủ phòng" />
            </ProtectedRoute>
          }
        >
          <Route index element={<OwnerDashboardPage />} />
          <Route path="rooms" element={<OwnerRoomsPage />} />
          <Route path="rooms/new" element={<OwnerRoomFormPage />} />
          <Route path="rooms/:id/edit" element={<OwnerRoomFormPage />} />
          <Route path="bookings" element={<OwnerBookingsPage />} />
          <Route path="reviews" element={<OwnerReviewsPage />} />
          <Route path="calendar" element={<OwnerCalendarPage />} />
          <Route path="coupons" element={<OwnerCouponsPage />} />
          <Route path="messages" element={<MessagesPage embedded />} />
          <Route path="notifications" element={<NotificationsPage embedded />} />
          <Route path="profile" element={<ProfilePage embedded />} />
          <Route path="*" element={<NotFoundPage embedded />} />
        </Route>

        <Route
          path="admin"
          element={
            <ProtectedRoute roles={['admin']}>
              <DashboardLayout menu={adminMenu} title="Quản trị hệ thống" />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboardPage />} />
          <Route path="rooms" element={<AdminRoomsPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="bookings" element={<AdminBookingsPage />} />
          <Route path="coupons" element={<AdminCouponsPage />} />
          <Route path="posts" element={<AdminPostsPage />} />
          <Route path="posts/new" element={<AdminPostFormPage />} />
          <Route path="posts/:id/edit" element={<AdminPostFormPage />} />
          <Route path="contacts" element={<AdminContactsPage />} />
          <Route path="reports" element={<AdminReportsPage />} />
          <Route path="reviews" element={<AdminReviewsPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
          <Route path="notifications" element={<NotificationsPage embedded />} />
          <Route path="profile" element={<ProfilePage embedded />} />
          <Route path="*" element={<NotFoundPage embedded />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
