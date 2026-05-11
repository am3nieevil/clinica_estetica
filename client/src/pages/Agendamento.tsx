import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Calendar, Clock, CheckCircle, Loader2, AlertCircle, Search, X } from "lucide-react";
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
    servicoId: 0,
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
  const { data: servicos = [], isLoading: loadingServicos } = trpc.servicos.list.useQuery();

  const createMutation = trpc.agendamentos.create.useMutation({
    onSuccess: () => {
      setAgendamentoConfirmado(true);
      setTimeout(() => navigate("/"), 3000);
    },
    onError: (err) => toast.error(err.message),
  });

  const clienteSelecionado = clientes.find((c) => c.id === formData.clienteId);
  const profissionalSelecionado = profissionais.find((p) => p.id === formData.profissionalId);
  const servicoSelecionado = servicos.find((s) => s.id === formData.servicoId);

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
    if (!q) return servicos;
    return servicos.filter(
      (s) =>
        s.nome.toLowerCase().includes(q) ||
        (s.descricao ?? "").toLowerCase().includes(q)
    );
  }, [servicos, buscaServico]);

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

  const handleConfirmar = () => {
    if (!formData.data || !formData.hora) {
      toast.error("Selecione data e horário.");
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
      servicoId: formData.servicoId,
      dataHora,
      duracao: servicoSelecionado?.duracao ?? 60,
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
                <p className="text-sm"><span className="font-medium">Serviço:</span> {servicoSelecionado?.nome}</p>
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
                          onClick={() => setFormData({ ...formData, profissionalId: p.id })}
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

        {/* Step 3: Serviço */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Selecione o Serviço</CardTitle>
              <CardDescription>Busque pelo nome ou descrição do procedimento</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingServicos ? (
                <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin" /></div>
              ) : servicos.length === 0 ? (
                <div className="text-center py-6">
                  <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">Nenhum serviço cadastrado.</p>
                  <Button variant="link" onClick={() => navigate("/servicos")}>Cadastrar serviço</Button>
                </div>
              ) : (
                <>
                  <CampoBusca
                    value={buscaServico}
                    onChange={setBuscaServico}
                    placeholder="Buscar por nome ou descrição..."
                  />
                  <div className="space-y-2 mb-6 max-h-72 overflow-y-auto pr-1">
                    {servicosFiltrados.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground text-sm">
                        Nenhum serviço encontrado para "{buscaServico}".
                      </div>
                    ) : (
                      servicosFiltrados.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => setFormData({ ...formData, servicoId: s.id })}
                          className={`w-full p-4 text-left rounded-lg border-2 transition-colors ${
                            formData.servicoId === s.id
                              ? "border-primary bg-primary/10"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <p className="font-medium">{s.nome}</p>
                          {s.descricao && (
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">{s.descricao}</p>
                          )}
                          <div className="text-sm text-muted-foreground flex gap-3 mt-1">
                            <span>R$ {parseFloat(s.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                            <span>• {s.duracao} min</span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </>
              )}
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1">Voltar</Button>
                <Button onClick={() => setStep(4)} disabled={!formData.servicoId} className="flex-1">Próximo</Button>
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
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <p className="text-sm font-semibold text-foreground mb-3">Resumo do Agendamento</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Cliente:</span>
                    <p className="font-medium">{clienteSelecionado?.nome}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Profissional:</span>
                    <p className="font-medium">{profissionalSelecionado?.nome}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Serviço:</span>
                    <p className="font-medium">{servicoSelecionado?.nome}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Valor:</span>
                    <p className="font-medium text-primary">
                      R$ {servicoSelecionado ? parseFloat(servicoSelecionado.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 }) : "-"}
                    </p>
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
