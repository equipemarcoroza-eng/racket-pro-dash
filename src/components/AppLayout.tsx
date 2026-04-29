import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, Calendar, CreditCard, TrendingUp, TrendingDown, DollarSign, ClipboardList, LogOut, ClipboardCheck, BarChart3, Cake } from "lucide-react";
import logo from "@/assets/logo.png";
import { useAuth } from "@/contexts/AuthContext";

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
  { to: "/finance/revenue", label: "Contas a Receber", icon: TrendingUp },
  { to: "/finance/expenses", label: "Contas a Pagar", icon: TrendingDown },
  { to: "/finance/cash-flow", label: "Fluxo de Caixa", icon: DollarSign },
  { to: "/finance/projection", label: "Projeção Financeira", icon: BarChart3 },
];

const AppLayout = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate("/", { replace: true });
  };

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
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium hover:bg-sidebar-accent/50 text-sidebar-foreground/80 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sair
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
