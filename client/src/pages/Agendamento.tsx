import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, CheckCircle, Loader2, AlertCircle, Search, X, Check, Scissors } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

export default function Agendamento() {
  const [, navigate] = useLocation();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    clienteId: 0,
    profissionalId: 0,
    servicoIds: [] as number[],
    data: "",
    hora: "",
    notas: "",
  });
  const [agendamentoConfirmado, setAgendamentoConfirmado] = useState(false);

  // Estados de busca independentes por step
  const [buscaCliente, setBuscaCliente] = useState("");
  const [buscaProfissional, setBuscaProfissional] = useState("");
  const [buscaServico, setBuscaServico] = useState("");

  const { data: clientes = [], isLoading: loadingClientes } = trpc.clientes.list.useQuery();
  const { data: profissionais = [], isLoading: loadingProf } = trpc.profissionais.list.useQuery();
  const { data: todosServicos = [], isLoading: loadingServicos } = trpc.servicos.list.useQuery();

  // Busca os IDs dos serviços associados ao profissional selecionado
  const { data: associacoesProfissional = [], isLoading: loadingAssociacoes } = trpc.profissionalServicos.getByProfissional.useQuery(
    formData.profissionalId,
    { enabled: formData.profissionalId > 0 }
  );
  const servicosAssociadosIds = new Set(associacoesProfissional.map((a) => a.servicoId));
  // Filtra apenas serviços associados ao profissional selecionado
  const servicosDoProf = formData.profissionalId > 0
    ? todosServicos.filter((s) => servicosAssociadosIds.has(s.id))
    : todosServicos;

  const createMutation = trpc.agendamentos.create.useMutation({
    onSuccess: () => {
      setAgendamentoConfirmado(true);
      setTimeout(() => navigate("/"), 3000);
    },
    onError: (err) => toast.error(err.message),
  });

  const clienteSelecionado = clientes.find((c) => c.id === formData.clienteId);
  const profissionalSelecionado = profissionais.find((p) => p.id === formData.profissionalId);
  const servicosSelecionados = todosServicos.filter((s) => formData.servicoIds.includes(s.id));

  // Totais calculados
  const duracaoTotal = servicosSelecionados.reduce((sum, s) => sum + s.duracao, 0);
  const valorTotal = servicosSelecionados.reduce((sum, s) => sum + parseFloat(s.valor), 0);

  const formatarDuracao = (minutos: number) => {
    if (minutos < 60) return `${minutos} min`;
    const h = Math.floor(minutos / 60);
    const m = minutos % 60;
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
  };

  // Filtros com busca
  const clientesFiltrados = useMemo(() => {
    const q = buscaCliente.toLowerCase().trim();
    if (!q) return clientes;
    return clientes.filter(
      (c) =>
        c.nome.toLowerCase().includes(q) ||
        (c.telefone ?? "").toLowerCase().includes(q) ||
        (c.email ?? "").toLowerCase().includes(q)
    );
  }, [clientes, buscaCliente]);

  const profissionaisFiltrados = useMemo(() => {
    const q = buscaProfissional.toLowerCase().trim();
    if (!q) return profissionais.filter((p) => p.ativo);
    return profissionais
      .filter((p) => p.ativo)
      .filter(
        (p) =>
          p.nome.toLowerCase().includes(q) ||
          (p.especialidade ?? "").toLowerCase().includes(q) ||
          (p.cidade ?? "").toLowerCase().includes(q)
      );
  }, [profissionais, buscaProfissional]);

  const servicosFiltrados = useMemo(() => {
    const q = buscaServico.toLowerCase().trim();
    if (!q) return servicosDoProf;
    return servicosDoProf.filter(
      (s) =>
        s.nome.toLowerCase().includes(q) ||
        (s.descricao ?? "").toLowerCase().includes(q)
    );
  }, [servicosDoProf, buscaServico]);

  // Validação de data mínima: hoje
  const hoje = new Date().toISOString().split("T")[0];

  const getMinTime = () => {
    if (formData.data === hoje) {
      const agora = new Date();
      agora.setMinutes(agora.getMinutes() + 30);
      return `${String(agora.getHours()).padStart(2, "0")}:${String(agora.getMinutes()).padStart(2, "0")}`;
    }
    return "07:00";
  };

  const toggleServico = (servicoId: number) => {
    setFormData((prev) => ({
      ...prev,
      servicoIds: prev.servicoIds.includes(servicoId)
        ? prev.servicoIds.filter((id) => id !== servicoId)
        : [...prev.servicoIds, servicoId],
    }));
  };

  const handleConfirmar = () => {
    if (!formData.data || !formData.hora) {
      toast.error("Selecione data e horário.");
      return;
    }
    if (formData.servicoIds.length === 0) {
      toast.error("Selecione ao menos um serviço.");
      return;
    }
    const dataHora = new Date(`${formData.data}T${formData.hora}:00`);
    if (dataHora <= new Date()) {
      toast.error("Não é possível agendar em data e horário passados.");
      return;
    }
    createMutation.mutate({
      clienteId: formData.clienteId,
      profissionalId: formData.profissionalId,
      servicoIds: formData.servicoIds,
      dataHora,
      notas: formData.notas || undefined,
    });
  };

  // Componente de campo de busca reutilizável
  const CampoBusca = ({
    value,
    onChange,
    placeholder,
  }: {
    value: string;
    onChange: (v: string) => void;
    placeholder: string;
  }) => (
    <div className="relative mb-4">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-9 pr-9"
        autoFocus
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );

  if (agendamentoConfirmado) {
    return (
      <DashboardLayout>
        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="w-full max-w-md">
            <CardContent className="pt-8 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-foreground mb-2">Agendamento Confirmado!</h2>
              <p className="text-muted-foreground mb-6">Redirecionando para a agenda...</p>
              <div className="bg-muted p-4 rounded-lg text-left space-y-2">
                <p className="text-sm"><span className="font-medium">Cliente:</span> {clienteSelecionado?.nome}</p>
                <p className="text-sm"><span className="font-medium">Profissional:</span> {profissionalSelecionado?.nome}</p>
                <p className="text-sm"><span className="font-medium">Serviços:</span> {servicosSelecionados.map((s) => s.nome).join(", ")}</p>
                <p className="text-sm"><span className="font-medium">Duração total:</span> {formatarDuracao(duracaoTotal)}</p>
                <p className="text-sm"><span className="font-medium">Valor total:</span> R$ {valorTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                <p className="text-sm"><span className="font-medium">Data/Hora:</span> {new Date(`${formData.data}T${formData.hora}`).toLocaleString("pt-BR")}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-1">Novo Agendamento</h1>
          <p className="text-muted-foreground">Passo {step} de 4</p>
        </div>

        {/* Barra de progresso */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-2 flex-1 rounded-full transition-colors ${s <= step ? "bg-primary" : "bg-muted"}`}
            />
          ))}
        </div>

        {/* Step 1: Cliente */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Selecione o Cliente</CardTitle>
              <CardDescription>Busque pelo nome, telefone ou e-mail</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingClientes ? (
                <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin" /></div>
              ) : clientes.length === 0 ? (
                <div className="text-center py-6">
                  <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">Nenhum cliente cadastrado.</p>
                  <Button variant="link" onClick={() => navigate("/clientes")}>Cadastrar cliente</Button>
                </div>
              ) : (
                <>
                  <CampoBusca
                    value={buscaCliente}
                    onChange={setBuscaCliente}
                    placeholder="Buscar por nome, telefone ou e-mail..."
                  />
                  <div className="space-y-2 mb-6 max-h-72 overflow-y-auto pr-1">
                    {clientesFiltrados.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground text-sm">
                        Nenhum cliente encontrado para "{buscaCliente}".
                      </div>
                    ) : (
                      clientesFiltrados.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => setFormData({ ...formData, clienteId: c.id })}
                          className={`w-full p-4 text-left rounded-lg border-2 transition-colors ${
                            formData.clienteId === c.id
                              ? "border-primary bg-primary/10"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <p className="font-medium">{c.nome}</p>
                          <p className="text-sm text-muted-foreground">
                            {c.telefone}{c.email ? ` • ${c.email}` : ""}
                          </p>
                        </button>
                      ))
                    )}
                  </div>
                </>
              )}
              <Button onClick={() => setStep(2)} disabled={!formData.clienteId} className="w-full">
                Próximo
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Profissional */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Selecione o Profissional</CardTitle>
              <CardDescription>Busque pelo nome, especialidade ou cidade</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingProf ? (
                <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin" /></div>
              ) : profissionais.filter((p) => p.ativo).length === 0 ? (
                <div className="text-center py-6">
                  <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">Nenhum profissional ativo cadastrado.</p>
                  <Button variant="link" onClick={() => navigate("/profissionais")}>Cadastrar profissional</Button>
                </div>
              ) : (
                <>
                  <CampoBusca
                    value={buscaProfissional}
                    onChange={setBuscaProfissional}
                    placeholder="Buscar por nome, especialidade ou cidade..."
                  />
                  <div className="space-y-2 mb-6 max-h-72 overflow-y-auto pr-1">
                    {profissionaisFiltrados.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground text-sm">
                        Nenhum profissional encontrado para "{buscaProfissional}".
                      </div>
                    ) : (
                      profissionaisFiltrados.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => setFormData({ ...formData, profissionalId: p.id, servicoIds: [] })}
                          className={`w-full p-4 text-left rounded-lg border-2 transition-colors ${
                            formData.profissionalId === p.id
                              ? "border-primary bg-primary/10"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <p className="font-medium">{p.nome}</p>
                          <p className="text-sm text-muted-foreground">
                            {p.especialidade}{p.cidade ? ` • ${p.cidade}` : ""}
                          </p>
                        </button>
                      ))
                    )}
                  </div>
                </>
              )}
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Voltar</Button>
                <Button onClick={() => setStep(3)} disabled={!formData.profissionalId} className="flex-1">Próximo</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Serviços (seleção múltipla) */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scissors className="w-5 h-5" />
                Selecione os Serviços
              </CardTitle>
              <CardDescription>
                Serviços disponíveis para {profissionalSelecionado?.nome ?? "o profissional selecionado"} — selecione um ou mais
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingServicos || loadingAssociacoes ? (
                <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin" /></div>
              ) : servicosDoProf.length === 0 ? (
                <div className="text-center py-6">
                  <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground font-medium">Nenhum serviço associado a este profissional.</p>
                  <p className="text-sm text-muted-foreground mt-1">Edite o profissional para adicionar serviços.</p>
                  <Button variant="link" onClick={() => navigate("/profissionais")}>Ir para Profissionais</Button>
                </div>
              ) : (
                <>
                  <CampoBusca
                    value={buscaServico}
                    onChange={setBuscaServico}
                    placeholder="Buscar por nome ou descrição..."
                  />
                  <div className="space-y-2 mb-4 max-h-72 overflow-y-auto pr-1">
                    {servicosFiltrados.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground text-sm">
                        Nenhum serviço encontrado para "{buscaServico}".
                      </div>
                    ) : (
                      servicosFiltrados.map((s) => {
                        const selecionado = formData.servicoIds.includes(s.id);
                        return (
                          <button
                            key={s.id}
                            onClick={() => toggleServico(s.id)}
                            className={`w-full p-4 text-left rounded-lg border-2 transition-colors flex items-center gap-3 ${
                              selecionado
                                ? "border-primary bg-primary/10"
                                : "border-border hover:border-primary/50"
                            }`}
                          >
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                              selecionado ? "border-primary bg-primary" : "border-muted-foreground"
                            }`}>
                              {selecionado && <Check className="w-3 h-3 text-primary-foreground" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium">{s.nome}</p>
                              {s.descricao && (
                                <p className="text-xs text-muted-foreground mt-0.5 truncate">{s.descricao}</p>
                              )}
                              <div className="text-sm text-muted-foreground flex gap-3 mt-1">
                                <span>R$ {parseFloat(s.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                                <span>• {formatarDuracao(s.duracao)}</span>
                              </div>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>

                  {/* Totais em tempo real */}
                  {formData.servicoIds.length > 0 && (
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-4">
                      <p className="text-sm font-semibold text-foreground mb-2">
                        {formData.servicoIds.length} serviço{formData.servicoIds.length !== 1 ? "s" : ""} selecionado{formData.servicoIds.length !== 1 ? "s" : ""}
                      </p>
                      <div className="flex gap-6 text-sm">
                        <div>
                          <span className="text-muted-foreground">Duração total:</span>
                          <span className="font-medium ml-1">{formatarDuracao(duracaoTotal)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Valor total:</span>
                          <span className="font-medium text-primary ml-1">
                            R$ {valorTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1">Voltar</Button>
                <Button onClick={() => setStep(4)} disabled={formData.servicoIds.length === 0} className="flex-1">
                  Próximo
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Data, Hora e Confirmação */}
        {step === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>Data, Hora e Confirmação</CardTitle>
              <CardDescription>Escolha quando deseja agendar e confirme os dados</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Data *
                  </label>
                  <Input
                    type="date"
                    min={hoje}
                    value={formData.data}
                    onChange={(e) => setFormData({ ...formData, data: e.target.value, hora: "" })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Hora *
                  </label>
                  <Input
                    type="time"
                    min={getMinTime()}
                    value={formData.hora}
                    onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
                    className="mt-1"
                    disabled={!formData.data}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Observações (opcional)</label>
                <Input
                  placeholder="Alguma observação sobre o atendimento..."
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  className="mt-1"
                />
              </div>

              {/* Resumo */}
              <div className="bg-muted p-4 rounded-lg space-y-3">
                <p className="text-sm font-semibold text-foreground">Resumo do Agendamento</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Cliente:</span>
                    <p className="font-medium">{clienteSelecionado?.nome}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Profissional:</span>
                    <p className="font-medium">{profissionalSelecionado?.nome}</p>
                  </div>
                  {formData.data && formData.hora && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Data/Hora:</span>
                      <p className="font-medium">
                        {new Date(`${formData.data}T${formData.hora}`).toLocaleString("pt-BR", {
                          dateStyle: "full",
                          timeStyle: "short",
                        })}
                      </p>
                    </div>
                  )}
                </div>

                {/* Serviços selecionados */}
                <div>
                  <span className="text-sm text-muted-foreground">Serviços:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {servicosSelecionados.map((s) => (
                      <Badge key={s.id} variant="secondary" className="text-xs">
                        <Scissors className="w-3 h-3 mr-1" />
                        {s.nome}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Totais */}
                <div className="border-t border-border pt-3 flex gap-6 text-sm">
                  <div>
                    <span className="text-muted-foreground">Duração total:</span>
                    <p className="font-medium">{formatarDuracao(duracaoTotal)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Valor total:</span>
                    <p className="font-semibold text-primary text-base">
                      R$ {valorTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(3)} className="flex-1">Voltar</Button>
                <Button
                  onClick={handleConfirmar}
                  disabled={!formData.data || !formData.hora || createMutation.isPending}
                  className="flex-1 gap-2"
                >
                  {createMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  Confirmar Agendamento
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
