import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useApi } from "../hooks/useApi";
import Sidebar, { MENU } from "../components/admin/Sidebar";
import DashboardPage  from "../components/admin/DashboardPage";
import EventsPage     from "../components/admin/EventsPage";
import UsersPage      from "../components/admin/UsersPage";
import CategoriesPage from "../components/admin/CategoriesPage";
import AdminBlogManager from "../components/admin/AdminBlogManager";
import ProfileModal from "../components/admin/ProfileModal";

export default function AdminDashboard() {
  const api = useApi();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [active, setActive] = useState("dashboard");
  const [showProfile, setShowProfile] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const PAGE = {
    dashboard:  <DashboardPage  api={api} />,
    events:     <EventsPage     api={api} />,
    users:      <UsersPage      api={api} />,
    categories: <CategoriesPage api={api} />,
    blog:       <AdminBlogManager api={api} />,
  };

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleInform = () => {
    alert("Tính năng đang được phát triển :))");
  }

  const activeMenu = MENU.find((m) => m.key === active);

  return (
    <div className={`d-flex ${isSidebarOpen ? 'sidebar-open' : ''}`} style={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
      <div className="sidebar-container" style={{ flexShrink: 0 }}>
        <Sidebar 
          active={active} 
          onSelect={(key) => { setActive(key); setIsSidebarOpen(false); }} 
          onProfileClick={() => setShowProfile(true)} 
        />
      </div>

      {isSidebarOpen && (
        <div 
          className="position-fixed top-0 start-0 w-100 h-100 bg-dark opacity-50 d-md-none" 
          style={{ zIndex: 1040 }} 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className="flex-grow-1" style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {/* Top Navbar */}
        <header className="bg-white px-3 px-md-4 py-3 d-flex justify-content-between align-items-center shadow-sm border-bottom" style={{ minHeight: '64px' }}>
          <div className="d-flex align-items-center">
            <button 
              className="btn btn-light d-md-none me-3 rounded-circle shadow-sm"
              onClick={() => setIsSidebarOpen(true)}
            >
              ☰
            </button>
            <h5 className="mb-0 fw-bold me-2" style={{ color: '#2d3436', fontSize: 'clamp(1rem, 4vw, 1.25rem)' }}>
              {activeMenu?.icon} {activeMenu?.label}
            </h5>
          </div>
          <div className="d-flex align-items-center gap-2 gap-md-3">
             <div 
               className="d-flex align-items-center gap-2 px-3 py-1 cursor-pointer hover-bg-light rounded-pill border" 
               style={{ cursor: 'pointer', transition: 'all 0.2s' }}
               onClick={() => setShowProfile(true)}
             >
                <div className="rounded-circle bg-warning text-dark d-flex align-items-center justify-content-center fw-bold" style={{ width: 32, height: 32, fontSize: 12 }}>A</div>
                <div className="d-none d-sm-block">
                  <div className="fw-bold text-dark" style={{ fontSize: 13, lineHeight: 1 }}>{user?.sub ?? "Admin"}</div>
                </div>
             </div>
             <button 
               className="btn btn-outline-danger btn-sm rounded-pill px-3 fw-bold border-2" 
               onClick={handleLogout}
               style={{ fontSize: 12 }}
             >
               Đăng xuất
             </button>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="main-content flex-grow-1 p-3 p-md-4" style={{ overflowY: "auto" }}>
          {PAGE[active] ?? <div className="text-center mt-5 text-muted">Đang phát triển...</div>}
        </main>
      </div>

      {showProfile && (
        <ProfileModal 
          api={api} 
          onClose={() => setShowProfile(false)} 
          onUpdateSuccess={() => {}} 
        />
      )}
    </div>
  );
}