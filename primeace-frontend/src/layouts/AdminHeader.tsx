import {
  LogOut,
  Menu,
  UserRound
} from "lucide-react";

import type { IAdmin } from "../features/auth/auth.type";

interface IAdminHeaderProps {
  admin: IAdmin;
  onMenuClick: () => void;
  onLogout: () => void;
  isLoggingOut: boolean;
}

function AdminHeader({
  admin,
  onMenuClick,
  onLogout,
  isLoggingOut
}: IAdminHeaderProps) {
  const initials = admin.fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return (
    <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-slate-200/90 bg-white px-5 sm:px-8">
      {/* Left section */}
      <div className="flex min-w-0 items-center gap-4">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 hover:text-[#07152F] lg:hidden"
        >
          <Menu size={21} strokeWidth={1.8} />
        </button>

        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold tracking-tight text-[#07152F]">
            Administration
          </p>

          <p className="mt-0.5 hidden text-xs text-slate-400 sm:block">
            PrimeAce Management Workspace
          </p>
        </div>
      </div>

      {/* Right section */}
      <div className="flex shrink-0 items-center gap-3 sm:gap-5">
        {/* Administrator identity */}
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-blue-100 bg-[#F0F5FF] text-sm font-semibold text-[#1556D6]">
            {initials || <UserRound size={18} />}
          </div>

          <div className="hidden min-w-0 sm:block">
            <p className="max-w-40 truncate text-[13px] font-semibold text-[#07152F]">
              {admin.fullName}
            </p>

            <p className="mt-0.5 max-w-40 truncate text-[11px] text-slate-400">
              {admin.email}
            </p>
          </div>
        </div>

        <div className="h-9 w-px bg-slate-200" />

        {/* Logout */}
        <button
          type="button"
          onClick={onLogout}
          disabled={isLoggingOut}
          className="
            inline-flex h-10 items-center gap-2
            rounded-lg border border-slate-200
            px-3 sm:px-3.5
            text-[13px] font-medium text-slate-600
            transition-colors
            hover:border-red-200 hover:bg-red-50 hover:text-red-600
            disabled:cursor-not-allowed disabled:opacity-50
          "
        >
          <LogOut size={16} strokeWidth={1.8} />

          <span className="hidden sm:inline">
            {isLoggingOut ? "Signing out..." : "Sign out"}
          </span>
        </button>
      </div>
    </header>
  );
}

export default AdminHeader;
