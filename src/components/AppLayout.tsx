import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Calendar,
  ClipboardList,
  LogOut,
  ClipboardCheck,
  BarChart3,
  Cake,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  PieChart,
} from "lucide-react";
import logo from "@/assets/logo.png";
import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/students", label: "Alunos", icon: Users },
  { to: "/birthdays", label: "Aniversariantes", icon: Cake },
  { to: "/schedule", label: "Agenda", icon: Calendar },
  { to: "/plans/manage", label: "Planos", icon: ClipboardList },
  { to: "/classes", label: "Controle de Turmas", icon: Users },
  { to: "/attendance", label: "Controle de Presença", icon: ClipboardCheck },
  { to: "/frequency", label: "Frequência", icon: BarChart3 },
  { to: "/lesson-plan", label: "Plano de Aulas", icon: ClipboardList },
  { to: "/tests", label: "Provas", icon: ClipboardCheck },
  { to: "/finance/revenue", label: "Contas a Receber", icon: TrendingUp },
  { to: "/finance/expenses", label: "Contas a Pagar", icon: TrendingDown },
  { to: "/finance/cash-flow", label: "Fluxo de Caixa", icon: DollarSign },
  { to: "/finance/projection", label: "Projeção Financeira", icon: BarChart3 },
  { to: "/bi-dashboard", label: "Análise de BI", icon: PieChart },
];

const AppLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const pageLabel =
    navItems.find((i) => location.pathname.startsWith(i.to))?.label ?? "Painel";
  const { signOut } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("racket_sidebar_collapsed") === "true";
    }
    return false;
  });

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("racket_sidebar_collapsed", String(next));
      return next;
    });
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/", { replace: true });
  };

  return (
    <div className="flex min-h-screen">
      <aside
        className={cn(
          "relative bg-sidebar text-sidebar-foreground flex flex-col shrink-0 transition-all duration-300",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        {/* Toggle Collapse Button */}
        <button
          onClick={toggleCollapse}
          className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-sidebar-border bg-sidebar text-sidebar-foreground shadow-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground z-50 cursor-pointer"
          title={isCollapsed ? "Expandir Menu" : "Recolher Menu"}
        >
          {isCollapsed ? (
            <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5" />
          )}
        </button>

        <div
          className={cn(
            "p-6 border-b border-sidebar-border transition-all duration-300",
            isCollapsed ? "px-2 py-4 flex justify-center" : "p-6"
          )}
        >
          <div className="flex items-center gap-3">
            <img
              src={logo}
              alt="Beach Tennis Equipe Marco Roza"
              className="h-10 w-10 rounded-full shrink-0"
            />
            {!isCollapsed && (
              <div className="animate-in fade-in duration-300">
                <h1 className="text-base font-bold tracking-tight leading-tight whitespace-nowrap">
                  Equipe Marco Roza
                </h1>
                <p className="text-xs opacity-70">Beach Tennis</p>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                  isCollapsed ? "justify-center px-0 h-10 w-10 mx-auto" : "px-3",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "hover:bg-sidebar-accent/50 text-sidebar-foreground/80"
                )
              }
              title={isCollapsed ? item.label : undefined}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!isCollapsed && (
                <span className="animate-in fade-in duration-300 truncate">
                  {item.label}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div
          className={cn(
            "p-4 border-t border-sidebar-border transition-all duration-300",
            isCollapsed ? "px-2" : "p-4"
          )}
        >
          <button
            onClick={handleLogout}
            className={cn(
              "flex items-center gap-3 py-2.5 rounded-md text-sm font-medium hover:bg-sidebar-accent/50 text-sidebar-foreground/80 transition-colors",
              isCollapsed ? "justify-center w-10 h-10 mx-auto px-0" : "w-full px-3"
            )}
            title={isCollapsed ? "Sair" : undefined}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!isCollapsed && <span>Sair</span>}
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
