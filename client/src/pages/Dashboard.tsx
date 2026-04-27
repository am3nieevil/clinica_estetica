import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Plus, Users, Scissors, Clock } from "lucide-react";
import { useLocation } from "wouter";
import Sidebar from "@/components/Sidebar";

interface Agendamento {
  id: string;
  cliente: string;
  servico: string;
  data: string;
  hora: string;
  duracao: number;
}

export default function Dashboard() {
  const [, navigate] = useLocation();
  const [agendamentos] = useState<Agendamento[]>([
    {
      id: "1",
      cliente: "Maria Silva",
      servico: "Limpeza de Pele",
      data: "2026-04-27",
      hora: "09:00",
      duracao: 60,
    },
    {
      id: "2",
      cliente: "João Santos",
      servico: "Micropigmentação",
      data: "2026-04-27",
      hora: "10:30",
      duracao: 90,
    },
    {
      id: "3",
      cliente: "Ana Costa",
      servico: "Botox",
      data: "2026-04-27",
      hora: "14:00",
      duracao: 30,
    },
  ]);

  const [currentDate] = useState(new Date("2026-04-27"));
  const agendamentosHoje = agendamentos.filter(
    (a) => a.data === currentDate.toISOString().split("T")[0]
  );

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-8 max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2">Minha Agenda</h1>
            <p className="text-muted-foreground">
              {currentDate.toLocaleDateString("pt-BR", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Agendamentos Hoje
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">
                  {agendamentosHoje.length}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Clientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">12</div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Scissors className="w-4 h-4" />
                  Serviços
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">5</div>
              </CardContent>
            </Card>
          </div>

          {/* Agenda do Dia */}
          <Card className="border-border bg-card mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Agenda de Hoje
              </CardTitle>
              <CardDescription>Seus compromissos para o dia</CardDescription>
            </CardHeader>
            <CardContent>
              {agendamentosHoje.length > 0 ? (
                <div className="space-y-4">
                  {agendamentosHoje.map((agendamento) => (
                    <div
                      key={agendamento.id}
                      className="flex items-center justify-between p-4 bg-background rounded-lg border border-border hover:bg-muted transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="text-lg font-semibold text-primary">
                            {agendamento.hora}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">
                              {agendamento.cliente}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {agendamento.servico} • {agendamento.duracao} min
                            </p>
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Editar
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">Nenhum agendamento para hoje</p>
                  <Button onClick={() => navigate("/agendamento")} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Novo Agendamento
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ações Rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={() => navigate("/clientes")}
              variant="outline"
              className="h-12 text-base gap-2"
            >
              <Users className="w-5 h-5" />
              Gerenciar Clientes
            </Button>
            <Button
              onClick={() => navigate("/servicos")}
              variant="outline"
              className="h-12 text-base gap-2"
            >
              <Scissors className="w-5 h-5" />
              Gerenciar Serviços
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
