import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  Users,
  Calendar,
  ClipboardList,
  ClipboardCheck,
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  PieChart,
  LineChart,
  RotateCcw,
  Tv,
} from "lucide-react";
import logo from "@/assets/logo.png";
import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { DiscreetModeToggle } from "@/components/DiscreetModeToggle";
import { usePrivacy } from "@/contexts/PrivacyContext";
import { ShieldCheck } from "lucide-react";

const navItems = [
  { to: "/arena-live", label: "Modo TV / Arena Live", icon: Tv },
  { to: "/bi-history", label: "BI Financeiro", icon: LineChart },
  { to: "/bi-dashboard", label: "BI Comportamental", icon: PieChart },
  { to: "/students", label: "Alunos", icon: Users },
  { to: "/schedule", label: "Agenda", icon: Calendar },
  { to: "/plans/manage", label: "Planos", icon: ClipboardList },
  { to: "/classes", label: "Controle de Turmas", icon: Users },
  { to: "/attendance", label: "Controle de Presença", icon: ClipboardCheck },
  { to: "/frequency", label: "Frequência", icon: BarChart3 },
  { to: "/class-replacements", label: "Reposição de Aulas", icon: RotateCcw },
  { to: "/lesson-plan", label: "Plano de Aulas", icon: ClipboardList },
  { to: "/tests", label: "Provas", icon: ClipboardCheck },
  { to: "/finance/revenue", label: "Contas a Receber", icon: TrendingUp },
  { to: "/finance/expenses", label: "Contas a Pagar", icon: TrendingDown },
  { to: "/finance/cash-flow", label: "Fluxo de Caixa", icon: DollarSign },
  { to: "/finance/projection", label: "Projeção Financeira", icon: BarChart3 },
];

const AppLayout = () => {
  const location = useLocation();
  const { isDiscreetMode } = usePrivacy();
  const pageLabel =
    navItems.find((i) => location.pathname.startsWith(i.to))?.label ?? "Painel";
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

  return (
    <div className="flex min-h-screen">
      <Helmet>
        <title>{`${pageLabel} | Equipe Marco Roza`}</title>
        <meta name="description" content={`${pageLabel} da plataforma de gestão da Equipe Marco Roza.`} />
        <meta name="robots" content="noindex, nofollow" />
        <meta property="og:title" content={`${pageLabel} | Equipe Marco Roza`} />
        <meta property="og:url" content={`https://equipemr.marcoroza.com.br${location.pathname}`} />
        <link rel="canonical" href={`https://equipemr.marcoroza.com.br${location.pathname}`} />
      </Helmet>
      <aside
        className={cn(
          "sticky top-0 h-screen bg-sidebar text-sidebar-foreground flex flex-col shrink-0 transition-all duration-300 z-40",
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
            "p-4 border-b border-sidebar-border transition-all duration-300",
            isCollapsed ? "px-2 py-3.5 flex justify-center" : "px-4 py-3.5"
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

        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto no-scrollbar">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isCollapsed ? "justify-center px-0 h-9 w-9 mx-auto" : "px-3",
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

        {/* Rodapé da Sidebar: Acesso ao Modo Discreto */}
        <div className="p-3 border-t border-sidebar-border mt-auto">
          <DiscreetModeToggle variant="sidebar" isCollapsed={isCollapsed} />
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Barra Superior / Header do Sistema */}
        <header className="sticky top-0 z-30 h-16 border-b border-border/40 bg-card/75 backdrop-blur-md px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground truncate">
                  {pageLabel}
                </h1>
                {isDiscreetMode && (
                  <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-300/60 animate-in fade-in">
                    <ShieldCheck className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                    Proteção Arena Ativa
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground hidden sm:block">
                Arena Equipe Marco Roza • Gestão Beach Tennis
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <DiscreetModeToggle variant="header" />
          </div>
        </header>

        <main className="flex-1 min-w-0 overflow-auto p-6 lg:p-8 app-glass-theme relative isolation-isolate">
          {/* Esferas de iluminação ambiental tridimensional para o efeito Glassmorphism */}
          <div className="bi-glass-ambient-orbs">
            <div className="bi-orb-1" />
            <div className="bi-orb-2" />
            <div className="bi-orb-3" />
            <div className="bi-orb-4" />
          </div>

          <div className="relative z-10">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Botão Flutuante Rápido no Tablet / Mobile */}
      <DiscreetModeToggle variant="floating" />
    </div>
  );
};

export default AppLayout;
