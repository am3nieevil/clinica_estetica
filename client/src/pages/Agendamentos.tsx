import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Plus, Search, Loader2, Trash2, Edit, CheckCircle, XCircle, Clock, Eye, User, Scissors, Calendar, MessageSquare, DollarSign } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

type StatusType = "confirmado" | "cancelado" | "concluido";

type Servico = {
  servicoId: number | null;
  servicoNome: string | null;
  servicoValor: string | null;
  servicoDuracao: number | null;
};

type Agendamento = {
  id: number;
  dataHora: Date;
  duracao: number;
  valorTotal: string | null;
  status: string;
  notas: string | null;
  clienteId: number | null;
  profissionalId: number | null;
  clienteNome: string | null;
  clienteTelefone: string | null;
  profissionalNome: string | null;
  profissionalEspecialidade: string | null;
  servicos: Servico[];
  servicoNome: string;
  servicoValor: string | null;
};

export default function Agendamentos() {
  const [, navigate] = useLocation();
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [editando, setEditando] = useState<number | null>(null);
  const [novoStatus, setNovoStatus] = useState<StatusType>("confirmado");
  const [viewAgendamento, setViewAgendamento] = useState<Agendamento | null>(null);

  const utils = trpc.useUtils();
  const { data: agendamentos = [], isLoading } = trpc.agendamentos.list.useQuery();

  const updateMutation = trpc.agendamentos.update.useMutation({
    onSuccess: () => {
      utils.agendamentos.list.invalidate();
      setEditando(null);
      toast.success("Status atualizado com sucesso!");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.agendamentos.delete.useMutation({
    onSuccess: () => {
      utils.agendamentos.list.invalidate();
      toast.success("Agendamento removido com sucesso!");
    },
    onError: (err) => toast.error(err.message),
  });

  const agendamentosFiltrados = (agendamentos as Agendamento[]).filter((a) => {
    const matchBusca =
      (a.clienteNome ?? "").toLowerCase().includes(busca.toLowerCase()) ||
      (a.servicoNome ?? "").toLowerCase().includes(busca.toLowerCase()) ||
      (a.profissionalNome ?? "").toLowerCase().includes(busca.toLowerCase());
    const matchStatus = filtroStatus === "todos" || a.status === filtroStatus;
    return matchBusca && matchStatus;
  }).sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime());

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmado": return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100"><Clock className="w-3 h-3 mr-1" />Confirmado</Badge>;
      case "concluido": return <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><CheckCircle className="w-3 h-3 mr-1" />Concluído</Badge>;
      case "cancelado": return <Badge className="bg-red-100 text-red-800 hover:bg-red-100"><XCircle className="w-3 h-3 mr-1" />Cancelado</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const abrirEdicao = (id: number, statusAtual: StatusType) => {
    setEditando(id);
    setNovoStatus(statusAtual);
  };

  const salvarStatus = () => {
    if (editando === null) return;
    updateMutation.mutate({ id: editando, status: novoStatus });
  };

  const formatarDuracao = (minutos: number) => {
    if (minutos < 60) return `${minutos} min`;
    const h = Math.floor(minutos / 60);
    const m = minutos % 60;
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1">Agendamentos</h1>
            <p className="text-muted-foreground">Gerencie todos os atendimentos do sistema</p>
          </div>
          <Button onClick={() => navigate("/agendamento")} className="gap-2">
            <Plus className="w-4 h-4" />
            Novo Agendamento
          </Button>
        </div>

        {/* Filtros */}
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente, serviço ou profissional..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filtroStatus} onValueChange={setFiltroStatus}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="confirmado">Confirmado</SelectItem>
              <SelectItem value="concluido">Concluído</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Lista */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Agendamentos ({agendamentosFiltrados.length})</CardTitle>
            <CardDescription>Todos os atendimentos registrados no sistema</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : agendamentosFiltrados.length > 0 ? (
              <div className="space-y-2">
                {agendamentosFiltrados.map((ag) => {
                  const dataHora = new Date(ag.dataHora);
                  const isPast = dataHora < new Date();
                  return (
                    <div
                      key={ag.id}
                      className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${isPast && ag.status === "confirmado" ? "border-yellow-200 bg-yellow-50/50" : "border-border bg-background hover:bg-muted/50"}`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="font-semibold text-primary">
                            {dataHora.toLocaleDateString("pt-BR")} às {dataHora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          {getStatusBadge(ag.status)}
                          {isPast && ag.status === "confirmado" && (
                            <Badge variant="outline" className="text-yellow-700 border-yellow-400 text-xs">Pendente conclusão</Badge>
                          )}
                        </div>
                        <div className="mt-1 text-sm text-muted-foreground flex gap-3 flex-wrap">
                          <span className="font-medium text-foreground">{ag.clienteNome ?? "—"}</span>
                          <span>• {ag.servicoNome || "—"}</span>
                          <span>• {formatarDuracao(ag.duracao)}</span>
                          {ag.profissionalNome && <span>• {ag.profissionalNome}</span>}
                          {ag.valorTotal && (
                            <span className="text-primary font-medium">
                              • R$ {parseFloat(ag.valorTotal).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </span>
                          )}
                        </div>
                        {ag.notas && (
                          <p className="mt-1 text-xs text-muted-foreground italic">Obs: {ag.notas}</p>
                        )}
                      </div>
                      <div className="flex gap-1 ml-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setViewAgendamento(ag)}
                          title="Visualizar detalhes"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => abrirEdicao(ag.id, ag.status as StatusType)}
                          title="Alterar status"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm(`Remover este agendamento de "${ag.clienteNome}"?`)) {
                              deleteMutation.mutate(ag.id);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-muted-foreground">
                  {busca || filtroStatus !== "todos"
                    ? "Nenhum agendamento encontrado para os filtros selecionados."
                    : "Nenhum agendamento cadastrado ainda."}
                </p>
                {!busca && filtroStatus === "todos" && (
                  <Button variant="outline" className="mt-4 gap-2" onClick={() => navigate("/agendamento")}>
                    <Plus className="w-4 h-4" />
                    Criar primeiro agendamento
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal de visualização detalhada */}
        <Dialog open={!!viewAgendamento} onOpenChange={(open) => { if (!open) setViewAgendamento(null); }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary" />
                Detalhes do Agendamento
              </DialogTitle>
            </DialogHeader>

            {viewAgendamento && (() => {
              const ag = viewAgendamento;
              const dataHora = new Date(ag.dataHora);
              return (
                <div className="space-y-4 py-2">
                  {/* Status e data */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span className="font-semibold text-foreground text-base">
                        {dataHora.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
                      </span>
                    </div>
                    {getStatusBadge(ag.status)}
                  </div>
                  <p className="text-sm text-muted-foreground -mt-2 ml-6">
                    às {dataHora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} • duração total: {formatarDuracao(ag.duracao)}
                  </p>

                  <Separator />

                  {/* Cliente */}
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                      <User className="w-3 h-3" /> Cliente
                    </p>
                    <p className="font-medium text-foreground">{ag.clienteNome ?? "—"}</p>
                    {ag.clienteTelefone && (
                      <p className="text-sm text-muted-foreground">{ag.clienteTelefone}</p>
                    )}
                  </div>

                  <Separator />

                  {/* Profissional */}
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                      <Scissors className="w-3 h-3" /> Profissional
                    </p>
                    <p className="font-medium text-foreground">{ag.profissionalNome ?? "—"}</p>
                    {ag.profissionalEspecialidade && (
                      <p className="text-sm text-muted-foreground">{ag.profissionalEspecialidade}</p>
                    )}
                  </div>

                  <Separator />

                  {/* Procedimentos */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                      <Scissors className="w-3 h-3" /> Procedimentos
                    </p>
                    {ag.servicos && ag.servicos.length > 0 ? (
                      <div className="space-y-2">
                        {ag.servicos.map((s, idx) => (
                          <div key={idx} className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2">
                            <div>
                              <p className="text-sm font-medium text-foreground">{s.servicoNome ?? "—"}</p>
                              {s.servicoDuracao && (
                                <p className="text-xs text-muted-foreground">{formatarDuracao(s.servicoDuracao)}</p>
                              )}
                            </div>
                            {s.servicoValor && (
                              <span className="text-sm font-semibold text-primary">
                                R$ {parseFloat(s.servicoValor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                              </span>
                            )}
                          </div>
                        ))}
                        {/* Total */}
                        {ag.valorTotal && (
                          <div className="flex items-center justify-between px-3 py-2 rounded-md border border-primary/20 bg-primary/5">
                            <span className="text-sm font-semibold flex items-center gap-1">
                              <DollarSign className="w-4 h-4 text-primary" />
                              Total
                            </span>
                            <span className="text-base font-bold text-primary">
                              R$ {parseFloat(ag.valorTotal).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Nenhum procedimento registrado.</p>
                    )}
                  </div>

                  {/* Observações */}
                  {ag.notas && (
                    <>
                      <Separator />
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" /> Observações
                        </p>
                        <p className="text-sm text-foreground italic">{ag.notas}</p>
                      </div>
                    </>
                  )}
                </div>
              );
            })()}

            <DialogFooter>
              <Button variant="outline" onClick={() => setViewAgendamento(null)}>Fechar</Button>
              {viewAgendamento && (
                <Button onClick={() => {
                  const ag = viewAgendamento;
                  setViewAgendamento(null);
                  abrirEdicao(ag.id, ag.status as StatusType);
                }} className="gap-2">
                  <Edit className="w-4 h-4" />
                  Alterar Status
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de edição de status */}
        <Dialog open={editando !== null} onOpenChange={(open) => !open && setEditando(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Alterar Status do Agendamento</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <label className="text-sm font-medium">Novo Status</label>
              <Select value={novoStatus} onValueChange={(v) => setNovoStatus(v as StatusType)}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="confirmado">Confirmado</SelectItem>
                  <SelectItem value="concluido">Concluído</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditando(null)}>Cancelar</Button>
              <Button onClick={salvarStatus} disabled={updateMutation.isPending} className="gap-2">
                {updateMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
