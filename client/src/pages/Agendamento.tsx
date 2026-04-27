import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Calendar, Clock, CheckCircle } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { useLocation } from "wouter";

interface Cliente {
  id: string;
  nome: string;
}

interface Servico {
  id: string;
  nome: string;
  duracao: number;
  valor: number;
}

export default function Agendamento() {
  const [, navigate] = useLocation();
  
  const clientes: Cliente[] = [
    { id: "1", nome: "Maria Silva" },
    { id: "2", nome: "João Santos" },
    { id: "3", nome: "Ana Costa" },
  ];

  const servicos: Servico[] = [
    { id: "1", nome: "Limpeza de Pele", duracao: 60, valor: 150 },
    { id: "2", nome: "Micropigmentação", duracao: 90, valor: 500 },
    { id: "3", nome: "Botox", duracao: 30, valor: 400 },
  ];

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    cliente: "",
    servico: "",
    data: "",
    hora: "",
  });
  const [agendamentoConfirmado, setAgendamentoConfirmado] = useState(false);

  const clienteSelecionado = clientes.find((c) => c.id === formData.cliente);
  const servicoSelecionado = servicos.find((s) => s.id === formData.servico);

  const handleConfirmar = () => {
    if (formData.cliente && formData.servico && formData.data && formData.hora) {
      setAgendamentoConfirmado(true);
      setTimeout(() => {
        navigate("/");
      }, 2000);
    }
  };

  if (agendamentoConfirmado) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <Card className="border-border bg-card w-96">
            <CardContent className="pt-8 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Agendamento Confirmado!
              </h2>
              <p className="text-muted-foreground mb-6">
                Seu agendamento foi registrado com sucesso.
              </p>
              <div className="bg-muted p-4 rounded-lg mb-6 text-left">
                <p className="text-sm font-medium text-foreground mb-2">
                  {clienteSelecionado?.nome}
                </p>
                <p className="text-sm text-muted-foreground mb-2">
                  {servicoSelecionado?.nome}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formData.data} às {formData.hora}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-8 max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Novo Agendamento
            </h1>
            <p className="text-muted-foreground">
              Passo {step} de 4
            </p>
          </div>

          {/* Progress Bar */}
          <div className="flex gap-2 mb-8">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-2 flex-1 rounded-full transition-colors ${
                  s <= step ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>

          {/* Step 1: Selecionar Cliente */}
          {step === 1 && (
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Selecione o Cliente</CardTitle>
                <CardDescription>
                  Escolha o cliente para este agendamento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-6">
                  {clientes.map((cliente) => (
                    <button
                      key={cliente.id}
                      onClick={() =>
                        setFormData({ ...formData, cliente: cliente.id })
                      }
                      className={`w-full p-4 text-left rounded-lg border-2 transition-colors ${
                        formData.cliente === cliente.id
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <p className="font-medium text-foreground">
                        {cliente.nome}
                      </p>
                    </button>
                  ))}
                </div>
                <Button
                  onClick={() => setStep(2)}
                  disabled={!formData.cliente}
                  className="w-full"
                >
                  Próximo
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Selecionar Serviço */}
          {step === 2 && (
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Selecione o Serviço</CardTitle>
                <CardDescription>
                  Escolha o procedimento desejado
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-6">
                  {servicos.map((servico) => (
                    <button
                      key={servico.id}
                      onClick={() =>
                        setFormData({ ...formData, servico: servico.id })
                      }
                      className={`w-full p-4 text-left rounded-lg border-2 transition-colors ${
                        formData.servico === servico.id
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <p className="font-medium text-foreground">
                        {servico.nome}
                      </p>
                      <div className="text-sm text-muted-foreground mt-1 space-x-3">
                        <span>R$ {servico.valor.toFixed(2)}</span>
                        <span>•</span>
                        <span>{servico.duracao} min</span>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="flex-1"
                  >
                    Voltar
                  </Button>
                  <Button
                    onClick={() => setStep(3)}
                    disabled={!formData.servico}
                    className="flex-1"
                  >
                    Próximo
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Data e Hora */}
          {step === 3 && (
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Selecione Data e Hora</CardTitle>
                <CardDescription>
                  Escolha quando deseja agendar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Data *
                    </label>
                    <Input
                      type="date"
                      value={formData.data}
                      onChange={(e) =>
                        setFormData({ ...formData, data: e.target.value })
                      }
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Hora *
                    </label>
                    <Input
                      type="time"
                      value={formData.hora}
                      onChange={(e) =>
                        setFormData({ ...formData, hora: e.target.value })
                      }
                      className="mt-2"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setStep(2)}
                    className="flex-1"
                  >
                    Voltar
                  </Button>
                  <Button
                    onClick={() => setStep(4)}
                    disabled={!formData.data || !formData.hora}
                    className="flex-1"
                  >
                    Próximo
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Confirmação */}
          {step === 4 && (
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Confirme os Dados</CardTitle>
                <CardDescription>
                  Verifique as informações antes de confirmar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mb-6 bg-muted p-4 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Cliente</p>
                    <p className="font-medium text-foreground">
                      {clienteSelecionado?.nome}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Serviço</p>
                    <p className="font-medium text-foreground">
                      {servicoSelecionado?.nome}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Data e Hora</p>
                    <p className="font-medium text-foreground">
                      {formData.data} às {formData.hora}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Valor</p>
                    <p className="font-medium text-foreground">
                      R$ {servicoSelecionado?.valor.toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setStep(3)}
                    className="flex-1"
                  >
                    Voltar
                  </Button>
                  <Button onClick={handleConfirmar} className="flex-1">
                    Confirmar Agendamento
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
