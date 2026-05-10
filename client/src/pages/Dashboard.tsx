import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Plus, Users, Scissors, Clock, Loader2, UserCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";

export default function Dashboard() {
  const [, navigate] = useLocation();
  const [dataSelecionada, setDataSelecionada] = useState(() => {
    const hoje = new Date();
    return hoje.toISOString().split("T")[0];
  });

  const { data: agendamentos = [], isLoading: loadingAg } = trpc.agendamentos.list.useQuery();
  const { data: stats } = trpc.agendamentos.dashboard.useQuery();
  const { data: clientes = [] } = trpc.clientes.list.useQuery();
  const { data: servicos = [] } = trpc.servicos.list.useQuery();
  const { data: profissionais = [] } = trpc.profissionais.list.useQuery();

  const agendamentosDoDia = agendamentos.filter((a) => {
    const dataAg = new Date(a.dataHora).toISOString().split("T")[0];
    return dataAg === dataSelecionada;
  }).sort((a, b) => new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime());

  const mudarDia = (delta: number) => {
    const d = new Date(dataSelecionada + "T12:00:00");
    d.setDate(d.getDate() + delta);
    setDataSelecionada(d.toISOString().split("T")[0]);
  };

  const hoje = new Date().toISOString().split("T")[0];
  const dataFormatada = new Date(dataSelecionada + "T12:00:00").toLocaleDateString("pt-BR", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmado": return "default";
      case "concluido": return "secondary";
      case "cancelado": return "destructive";
      default: return "outline";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "confirmado": return "Confirmado";
      case "concluido": return "Concluído";
      case "cancelado": return "Cancelado";
      default: return status;
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1">Minha Agenda</h1>
            <p className="text-muted-foreground capitalize">{dataFormatada}</p>
          </div>
          <Button onClick={() => navigate("/agendamento")} className="gap-2">
            <Plus className="w-4 h-4" />
            Novo Agendamento
          </Button>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" /> Agendamentos Hoje
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {agendamentos.filter(a => new Date(a.dataHora).toISOString().split("T")[0] === hoje).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="w-4 h-4" /> Clientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{clientes.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Scissors className="w-4 h-4" /> Serviços
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{servicos.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <UserCheck className="w-4 h-4" /> Profissionais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{profissionais.filter(p => p.ativo).length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Navegação de Data */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Agenda do Dia
                </CardTitle>
                <CardDescription>{agendamentosDoDia.length} agendamento(s)</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => mudarDia(-1)}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setDataSelecionada(hoje)}>
                  Hoje
                </Button>
                <Button variant="outline" size="sm" onClick={() => mudarDia(1)}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loadingAg ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : agendamentosDoDia.length > 0 ? (
              <div className="space-y-3">
                {agendamentosDoDia.map((ag) => {
                  const dataHora = new Date(ag.dataHora);
                  const hora = dataHora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
                  return (
                    <div key={ag.id}
                      className="flex items-center justify-between p-4 bg-background rounded-lg border border-border hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="text-lg font-bold text-primary min-w-[50px]">{hora}</div>
                        <div>
                          <p className="font-medium text-foreground">{ag.clienteNome ?? "—"}</p>
                          <p className="text-sm text-muted-foreground">
                            {ag.servicoNome ?? "—"} • {ag.duracao} min
                            {ag.profissionalNome && ` • ${ag.profissionalNome}`}
                          </p>
                        </div>
                      </div>
                      <Badge variant={getStatusColor(ag.status) as any}>
                        {getStatusLabel(ag.status)}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-muted-foreground mb-4">Nenhum agendamento para este dia.</p>
                <Button onClick={() => navigate("/agendamento")} className="gap-2">
                  <Plus className="w-4 h-4" /> Novo Agendamento
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ações Rápidas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Button variant="outline" onClick={() => navigate("/clientes")} className="h-12 gap-2">
            <Users className="w-4 h-4" /> Clientes
          </Button>
          <Button variant="outline" onClick={() => navigate("/profissionais")} className="h-12 gap-2">
            <UserCheck className="w-4 h-4" /> Profissionais
          </Button>
          <Button variant="outline" onClick={() => navigate("/servicos")} className="h-12 gap-2">
            <Scissors className="w-4 h-4" /> Serviços
          </Button>
          <Button variant="outline" onClick={() => navigate("/agendamento")} className="h-12 gap-2">
            <Calendar className="w-4 h-4" /> Agendar
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
