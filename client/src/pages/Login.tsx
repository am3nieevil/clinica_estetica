import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, Scissors } from "lucide-react";

export default function Login() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Register state
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regLoading, setRegLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      toast.error("Preencha e-mail e senha.");
      return;
    }
    setLoginLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erro ao fazer login.");
        return;
      }
      await utils.auth.me.invalidate();
      toast.success(`Bem-vindo, ${data.name}!`);
      navigate("/");
    } catch {
      toast.error("Erro de conexão. Tente novamente.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPassword) {
      toast.error("Preencha todos os campos.");
      return;
    }
    if (regPassword.length < 6) {
      toast.error("A senha deve ter ao menos 6 caracteres.");
      return;
    }
    setRegLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: regName, email: regEmail, password: regPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erro ao registrar.");
        return;
      }
      await utils.auth.me.invalidate();
      toast.success(`Conta criada com sucesso! Bem-vindo, ${data.name}!`);
      navigate("/");
    } catch {
      toast.error("Erro de conexão. Tente novamente.");
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50 p-4">
      <div className="w-full max-w-md">
        {/* Logo / Título */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-pink-100 rounded-full mb-4">
            <Scissors className="w-8 h-8 text-pink-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Clínica Estética</h1>
          <p className="text-gray-500 mt-1">Sistema de Agendamento</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl text-center">Acesse sua conta</CardTitle>
            <CardDescription className="text-center">
              Entre ou crie uma conta para continuar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Entrar</TabsTrigger>
                <TabsTrigger value="register">Criar conta</TabsTrigger>
              </TabsList>

              {/* ABA LOGIN */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">E-mail</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={loginEmail}
                      onChange={e => setLoginEmail(e.target.value)}
                      disabled={loginLoading}
                      autoComplete="email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Senha</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                      disabled={loginLoading}
                      autoComplete="current-password"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loginLoading}>
                    {loginLoading ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Entrando...</>
                    ) : "Entrar"}
                  </Button>
                </form>
              </TabsContent>

              {/* ABA REGISTRO */}
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reg-name">Nome completo</Label>
                    <Input
                      id="reg-name"
                      type="text"
                      placeholder="Seu nome"
                      value={regName}
                      onChange={e => setRegName(e.target.value)}
                      disabled={regLoading}
                      autoComplete="name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-email">E-mail</Label>
                    <Input
                      id="reg-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={regEmail}
                      onChange={e => setRegEmail(e.target.value)}
                      disabled={regLoading}
                      autoComplete="email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-password">Senha</Label>
                    <Input
                      id="reg-password"
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      value={regPassword}
                      onChange={e => setRegPassword(e.target.value)}
                      disabled={regLoading}
                      autoComplete="new-password"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={regLoading}>
                    {regLoading ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Criando conta...</>
                    ) : "Criar conta"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
