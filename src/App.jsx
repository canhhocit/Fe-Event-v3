import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminDashboard from "./pages/AdminDashboard";
import OrganizerPage from "./pages/OrganizerPage";
import ForgotPassword from "./pages/ForgotPassword";
import StaffPage from "./pages/StaffPage";

function AuthRedirect() {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    if (token && user) {
      const scopes = user.scope ? user.scope.split(' ') : [];
      let targetRoute = null;

      if (scopes.includes('ROLE_ADMIN')) {
        targetRoute = '/admin';
      } else if (scopes.includes('ROLE_ORGANIZER')) {
        targetRoute = '/organizer';
      } else if (scopes.includes('ROLE_STAFF')) {
        targetRoute = '/staff';
      }

      if (targetRoute) {
        if (location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/') {
          navigate(targetRoute, { replace: true });
        }
      } else {
        // Logged in but invalid role for this portal
        if (location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/') {
          logout();
          alert("Tài khoản của bạn không có quyền truy cập vào hệ thống quản lý này.");
        }
      }
    }
  }, [token, user, navigate, location.pathname, logout]);

  return null;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AuthRedirect />
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/organizer" element={<OrganizerPage />} />
          <Route path="/staff" element={<StaffPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;