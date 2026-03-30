import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import logo from "@/assets/logo.png";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/dashboard");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center">
          <img src={logo} alt="Equipe Marco Roza" className="h-20 w-20 rounded-full mb-2" />
          <CardTitle className="text-2xl">Login e Acesso</CardTitle>
          <CardDescription />
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" placeholder="digite seu e-mail" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" placeholder="digite sua senha" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" className="w-full">Entrar</Button>
            <Button type="button" variant="outline" className="w-full" onClick={() => navigate("/dashboard")}>Cadastrar-se</Button>
            <p className="text-center text-sm text-muted-foreground">Acesso ao sistema mediante credenciais válidas</p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
