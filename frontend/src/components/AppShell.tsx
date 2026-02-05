import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../state/auth";
import { Button } from "./ui/Button";

const navLinkClass =
  "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition";

export function AppShell() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-linen">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 flex-col gap-6 bg-white px-6 py-8 shadow-card lg:flex">
          <div>
            <p className="heading text-xl">Linato POS</p>
            <p className="text-xs text-slate-500">Restaurant operations</p>
          </div>
          <nav className="flex flex-col gap-2">
            <NavLink
              to="/pos"
              className={({ isActive }) =>
                `${navLinkClass} ${
                  isActive ? "bg-basil text-white" : "text-slate-700 hover:bg-slate-100"
                }`
              }
            >
              POS Terminal
            </NavLink>
            <NavLink
              to="/orders"
              className={({ isActive }) =>
                `${navLinkClass} ${
                  isActive ? "bg-basil text-white" : "text-slate-700 hover:bg-slate-100"
                }`
              }
            >
              Orders
            </NavLink>
            <NavLink
              to="/kitchen"
              className={({ isActive }) =>
                `${navLinkClass} ${
                  isActive ? "bg-basil text-white" : "text-slate-700 hover:bg-slate-100"
                }`
              }
            >
              Kitchen
            </NavLink>
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `${navLinkClass} ${
                  isActive ? "bg-basil text-white" : "text-slate-700 hover:bg-slate-100"
                }`
              }
            >
              Admin
            </NavLink>
          </nav>
          <div className="mt-auto rounded-2xl bg-slate-100 p-4 text-sm">
            <p className="font-semibold">{user?.name}</p>
            <p className="text-xs text-slate-500">{user?.email}</p>
            <Button
              tone="danger"
              size="sm"
              className="mt-3 w-full"
              onClick={() => logout()}
            >
              Logout
            </Button>
          </div>
        </aside>

        <main className="flex-1 px-4 py-6 lg:px-8">
          <header className="mb-6 flex items-center justify-between gap-3 lg:hidden">
            <div>
              <p className="heading text-lg">Linato POS</p>
              <p className="text-xs text-slate-500">Restaurant operations</p>
            </div>
            <Button tone="danger" size="sm" onClick={() => logout()}>
              Logout
            </Button>
          </header>
          <nav className="mb-6 flex flex-wrap gap-2 lg:hidden">
            {[
              { to: "/pos", label: "POS" },
              { to: "/orders", label: "Orders" },
              { to: "/kitchen", label: "Kitchen" },
              { to: "/admin", label: "Admin" },
            ].map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 text-xs font-semibold ${
                    isActive ? "bg-basil text-white" : "bg-white text-slate-600"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
