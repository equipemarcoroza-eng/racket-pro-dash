import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import PlansManage from "./pages/PlansManage";
import Students from "./pages/Students";
import Schedule from "./pages/Schedule";
import ClassManagement from "./pages/ClassManagement";
import AttendanceControl from "./pages/AttendanceControl";
import FrequencyReport from "./pages/FrequencyReport";
import Revenue from "./pages/Revenue";
import Expenses from "./pages/Expenses";
import CashFlow from "./pages/CashFlow";
import AppLayout from "./components/AppLayout";
import NotFound from "./pages/NotFound";
import { AppProvider } from "./contexts/AppContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/plans/manage" element={<PlansManage />} />
              <Route path="/students" element={<Students />} />
              <Route path="/schedule" element={<Schedule />} />
              <Route path="/classes" element={<ClassManagement />} />
              <Route path="/attendance" element={<AttendanceControl />} />
              <Route path="/frequency" element={<FrequencyReport />} />
              <Route path="/finance/revenue" element={<Revenue />} />
              <Route path="/finance/expenses" element={<Expenses />} />
              <Route path="/finance/cash-flow" element={<CashFlow />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AppProvider>
  </QueryClientProvider>
);

export default App;
