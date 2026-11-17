import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";

import { useAuth } from "../features/auth/AuthContext.js";
import AdminHeader from "./AdminHeader.js";
import AdminSidebar from "./AdminSidebar.js";

function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    setLogoutError("");

    try {
      await logout();
      navigate("/admin/login", { replace: true });
    } catch {
      setLogoutError("Unable to sign out. Please try again.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed((current) => !current);
  };

  if (!admin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F5F7FB]">
      <AdminSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
      />

      <div
        className={`
          min-h-screen transition-[padding] duration-300 ease-in-out
          ${isSidebarCollapsed ? "lg:pl-[88px]" : "lg:pl-72"}
        `}
      >
        <AdminHeader
          admin={admin}
          onMenuClick={() => setIsSidebarOpen(true)}
          onLogout={() => void handleLogout()}
          isLoggingOut={isLoggingOut}
        />

        <main className="min-h-[calc(100vh-5rem)] px-5 py-7 sm:px-8 sm:py-9">
          {logoutError && (
            <div
              role="alert"
              className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              <p>{logoutError}</p>

              <button
                type="button"
                onClick={() => setLogoutError("")}
                className="shrink-0 font-medium transition hover:text-red-900"
              >
                Dismiss
              </button>
            </div>
          )}

          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
