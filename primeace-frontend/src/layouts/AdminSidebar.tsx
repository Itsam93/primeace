import {
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  FileText,
  FolderKanban,
  LayoutDashboard,
  Layers3,
  Mail,
  MessageSquareText,
  Settings2,
  Star,
  Users,
  X
} from "lucide-react";
import { NavLink } from "react-router-dom";

interface IAdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const navigationGroups = [
  {
    title: "Overview",
    items: [
      {
        label: "Dashboard",
        href: "/admin",
        icon: LayoutDashboard,
        end: true
      }
    ]
  },
  {
    title: "Management",
    items: [
      {
        label: "Service Requests",
        href: "/admin/requests",
        icon: MessageSquareText
      },
      {
        label: "Clients",
        href: "/admin/clients",
        icon: Users
      },
      {
        label: "Quotations",
        href: "/admin/quotations",
        icon: FileText
      },
      {
        label: "Contracts",
        href: "/admin/contracts",
        icon: BriefcaseBusiness
      },
      {
        label: "Projects",
        href: "/admin/projects",
        icon: FolderKanban
      },
      {
        label: "Reviews",
        href: "/admin/reviews",
        icon: Star
      },
      {
        label: "Review Invitations",
        href: "/admin/review-invitations",
        icon: Mail
      }
    ]
  },
  {
    title: "Configuration",
    items: [
      {
        label: "Services",
        href: "/admin/services",
        icon: Layers3
      },
      {
        label: "Settings",
        href: "/admin/settings",
        icon: Settings2
      }
    ]
  }
];

function AdminSidebar({
  isOpen,
  onClose,
  isCollapsed,
  onToggleCollapse
}: IAdminSidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-[#07152F]/60 backdrop-blur-[2px] lg:hidden"
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50
          flex flex-col
          border-r border-white/10
          bg-[#07152F] text-white
          shadow-2xl shadow-slate-950/10
          transition-[width,transform] duration-300 ease-in-out
          ${isCollapsed ? "lg:w-[88px]" : "lg:w-72"}
          w-72
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Brand */}
        <div
          className={`
            flex h-20 shrink-0 items-center
            border-b border-white/[0.08]
            ${isCollapsed ? "justify-center px-3" : "justify-between px-6"}
          `}
        >
          <NavLink
            to="/admin"
            onClick={onClose}
            title="PrimeAce Dashboard"
            className="flex min-w-0 items-center gap-3"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1556D6] text-xl font-bold text-white shadow-lg shadow-blue-950/30">
              P
            </span>

            {!isCollapsed && (
              <span className="min-w-0">
                <span className="block text-[19px] font-bold tracking-tight text-white">
                  PrimeAce
                </span>
                <span className="mt-0.5 block text-[9px] font-semibold uppercase tracking-[0.2em] text-blue-300">
                  Administration
                </span>
              </span>
            )}
          </NavLink>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white lg:hidden"
          >
            <X size={19} />
          </button>
        </div>

        {/* Navigation */}
        <nav
          aria-label="Admin navigation"
          className="flex-1 space-y-7 overflow-y-auto overflow-x-hidden px-3 py-7"
        >
          {navigationGroups.map((group) => (
            <div key={group.title}>
              {!isCollapsed ? (
                <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                  {group.title}
                </p>
              ) : (
                <div className="mx-auto mb-4 h-px w-8 bg-white/10" />
              )}

              <div className="space-y-1.5">
                {group.items.map((item) => {
                  const Icon = item.icon;

                  return (
                    <NavLink
                      key={item.href}
                      to={item.href}
                      end={"end" in item ? item.end : false}
                      onClick={onClose}
                      title={isCollapsed ? item.label : undefined}
                      className={({ isActive }) =>
                        `
                          group relative flex min-h-11 items-center
                          rounded-xl text-[13px] font-medium
                          transition-all duration-200
                          ${
                            isCollapsed
                              ? "justify-center px-2"
                              : "gap-3 px-3.5"
                          }
                          ${
                            isActive
                              ? "bg-[#1556D6] text-white shadow-lg shadow-blue-950/20"
                              : "text-slate-400 hover:bg-white/[0.06] hover:text-white"
                          }
                        `
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && (
                            <span className="absolute bottom-2 left-0 top-2 w-[3px] rounded-r-full bg-blue-300" />
                          )}

                          <Icon
                            size={19}
                            strokeWidth={1.8}
                            className={`shrink-0 transition-colors ${
                              isActive
                                ? "text-white"
                                : "text-slate-400 group-hover:text-white"
                            }`}
                          />

                          {!isCollapsed && (
                            <span className="truncate">
                              {item.label}
                            </span>
                          )}
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="shrink-0 border-t border-white/[0.08] p-3">
          {!isCollapsed ? (
            <div className="rounded-xl bg-white/[0.04] px-4 py-4">
              <p className="text-xs font-semibold text-slate-300">
                PrimeAce Workspace
              </p>
              <p className="mt-1.5 text-[11px] leading-5 text-slate-500">
                Manage your business operations from one place.
              </p>
            </div>
          ) : (
            <div
              title="PrimeAce Administration"
              className="flex justify-center py-2 text-[10px] font-bold tracking-widest text-slate-500"
            >
              PA
            </div>
          )}
        </div>

        {/* Desktop collapse control */}
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={
            isCollapsed ? "Expand sidebar" : "Collapse sidebar"
          }
          title={
            isCollapsed ? "Expand sidebar" : "Collapse sidebar"
          }
          className="
            absolute -right-3 top-24 hidden
            h-7 w-7 items-center justify-center
            rounded-full border border-slate-200
            bg-white text-slate-600 shadow-md
            transition hover:border-blue-200
            hover:bg-blue-50 hover:text-[#1556D6]
            lg:flex
          "
        >
          {isCollapsed ? (
            <ChevronRight size={15} />
          ) : (
            <ChevronLeft size={15} />
          )}
        </button>
      </aside>
    </>
  );
}

export default AdminSidebar;
