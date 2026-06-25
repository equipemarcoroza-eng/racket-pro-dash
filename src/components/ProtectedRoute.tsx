import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isAdmin, loading } = useAuth();
  const [roleResolved, setRoleResolved] = useState(false);

  useEffect(() => {
    if (!user) {
      setRoleResolved(false);
      return;
    }
    // isAdmin is set asynchronously after auth state changes; give it a tick to resolve
    const t = setTimeout(() => setRoleResolved(true), 150);
    return () => clearTimeout(t);
  }, [user, isAdmin]);

  if (loading || (user && !roleResolved)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground text-sm">Carregando...</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  return <>{children}</>;
};

export default ProtectedRoute;
