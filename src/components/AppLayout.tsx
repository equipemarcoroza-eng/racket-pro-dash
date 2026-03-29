import { NavLink, Outlet } from "react-router-dom";
import { LayoutDashboard, Users, Calendar, CreditCard, TrendingUp, TrendingDown, DollarSign, ClipboardList, LogOut } from "lucide-react";
import logo from "@/assets/logo.png";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/students", label: "Alunos", icon: Users },
  { to: "/schedule", label: "Agenda", icon: Calendar },
  { to: "/plans/manage", label: "Planos", icon: ClipboardList },
  { to: "/finance/revenue", label: "Contas a Receber", icon: TrendingUp },
  { to: "/finance/expenses", label: "Contas a Pagar", icon: TrendingDown },
  { to: "/finance/cash-flow", label: "Fluxo de Caixa", icon: DollarSign },
];

const AppLayout = () => {
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-sidebar text-sidebar-foreground flex flex-col shrink-0">
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Beach Tennis Equipe Marco Roza" className="h-10 w-10 rounded-full" />
            <div>
              <h1 className="text-base font-bold tracking-tight leading-tight">Equipe Marco Roza</h1>
              <p className="text-xs opacity-70">Beach Tennis</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "hover:bg-sidebar-accent/50 text-sidebar-foreground/80"
                }`
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-sidebar-border">
          <NavLink
            to="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium hover:bg-sidebar-accent/50 text-sidebar-foreground/80 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </NavLink>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
