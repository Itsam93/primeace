import {
  Navigate,
  Outlet,
  useLocation
} from "react-router-dom";

import { useAuth } from "./AuthContext.js";

function ProtectedRoute() {
  const { status, refreshAdmin } = useAuth();
  const location = useLocation();

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="size-9 animate-spin rounded-full border-4 border-blue-100 border-t-[#1556D6]" />

          <p className="text-sm text-slate-500">
            Verifying administrator session...
          </p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-6 text-center">
        <h1 className="text-xl font-semibold text-[#07152F]">
          Unable to verify your session
        </h1>

        <p className="max-w-md text-sm leading-6 text-slate-500">
          We couldn't connect to the authentication service.
          Please check your connection and try again.
        </p>

        <button
          type="button"
          onClick={() => void refreshAdmin()}
          className="rounded-lg bg-[#1556D6] px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Try again
        </button>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <Navigate
        to="/admin/login"
        replace
        state={{ from: location }}
      />
    );
  }

  return <Outlet />;
}

export default ProtectedRoute;
