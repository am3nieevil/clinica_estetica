import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronRight } from "lucide-react";
import Sidebar from "@/components/Sidebar";

interface Profissional {
  id: string;
  nome: string;
  especialidade: string;
  cidade: string;
}

interface Servico {
  id: string;
  nome: string;
  duracao: number;
  valor: number;
}

interface ProfissionalServico {
  profissionalId: string;
  servicoId: string;
}

export default function ProfissionalServicos() {
  const profissionais: Profissional[] = [
    { id: "1", nome: "Ana Silva", especialidade: "Micropigmentação", cidade: "São Paulo" },
    { id: "2", nome: "Carla Santos", especialidade: "Botox e Preenchimento", cidade: "São Paulo" },
    { id: "3", nome: "Marina Costa", especialidade: "Limpeza de Pele", cidade: "Guarulhos" },
  ];

  const servicos: Servico[] = [
    { id: "1", nome: "Limpeza de Pele", duracao: 60, valor: 150 },
    { id: "2", nome: "Micropigmentação", duracao: 90, valor: 500 },
    { id: "3", nome: "Botox", duracao: 30, valor: 400 },
    { id: "4", nome: "Preenchimento", duracao: 45, valor: 350 },
    { id: "5", nome: "Peeling Químico", duracao: 60, valor: 200 },
  ];

  const [associacoes, setAssociacoes] = useState<ProfissionalServico[]>([
    { profissionalId: "1", servicoId: "2" },
    { profissionalId: "2", servicoId: "3" },
    { profissionalId: "2", servicoId: "4" },
    { profissionalId: "3", servicoId: "1" },
    { profissionalId: "3", servicoId: "5" },
  ]);

  const [selectedProfissional, setSelectedProfissional] = useState<string | null>(null);

  const toggleAssociacao = (profissionalId: string, servicoId: string) => {
    const existe = associacoes.some(
      (a) => a.profissionalId === profissionalId && a.servicoId === servicoId
    );

    if (existe) {
      setAssociacoes(
        associacoes.filter(
          (a) => !(a.profissionalId === profissionalId && a.servicoId === servicoId)
        )
      );
    } else {
      setAssociacoes([...associacoes, { profissionalId, servicoId }]);
    }
  };

  const profissionalSelecionado = profissionais.find((p) => p.id === selectedProfissional);
  const servicosDoProfissional = associacoes
    .filter((a) => a.profissionalId === selectedProfissional)
    .map((a) => a.servicoId);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-8 max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Associar Profissionais aos Serviços
            </h1>
            <p className="text-muted-foreground">
              Defina quais serviços cada profissional pode realizar
            </p>
          </div>

          <div className="grid grid-cols-3 gap-8">
            {/* Lista de Profissionais */}
            <div>
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle>Profissionais</CardTitle>
                  <CardDescription>
                    Selecione um profissional
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {profissionais.map((prof) => (
                      <button
                        key={prof.id}
                        onClick={() => setSelectedProfissional(prof.id)}
                        className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
                          selectedProfissional === prof.id
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <p className="font-medium text-foreground">{prof.nome}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {prof.especialidade}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {prof.cidade}
                        </p>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Seleção de Serviços */}
            {selectedProfissional ? (
              <div className="col-span-2">
                <Card className="border-border bg-card">
                  <CardHeader>
                    <CardTitle>Serviços de {profissionalSelecionado?.nome}</CardTitle>
                    <CardDescription>
                      Marque os serviços que este profissional pode realizar
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {servicos.map((servico) => {
                        const isAssociado = servicosDoProfissional.includes(servico.id);
                        return (
                          <div
                            key={servico.id}
                            className="flex items-center gap-3 p-4 bg-background rounded-lg border border-border hover:border-primary/50 transition-colors"
                          >
                            <Checkbox
                              checked={isAssociado}
                              onCheckedChange={() =>
                                toggleAssociacao(selectedProfissional, servico.id)
                              }
                              className="w-5 h-5"
                            />
                            <div className="flex-1">
                              <p className="font-medium text-foreground">
                                {servico.nome}
                              </p>
                              <div className="text-sm text-muted-foreground space-x-3">
                                <span>R$ {servico.valor.toFixed(2)}</span>
                                <span>•</span>
                                <span>{servico.duracao} min</span>
                              </div>
                            </div>
                            {isAssociado && (
                              <div className="w-2 h-2 rounded-full bg-primary" />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-6 p-4 bg-muted rounded-lg">
                      <p className="text-sm font-medium text-foreground mb-2">
                        Resumo
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {servicosDoProfissional.length} serviço(s) associado(s)
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="col-span-2">
                <Card className="border-border bg-card">
                  <CardContent className="flex items-center justify-center h-64">
                    <p className="text-muted-foreground text-center">
                      Selecione um profissional para visualizar e gerenciar seus serviços
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Resumo Geral */}
          <Card className="border-border bg-card mt-8">
            <CardHeader>
              <CardTitle>Resumo de Associações</CardTitle>
              <CardDescription>
                Visão geral de todos os profissionais e seus serviços
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {profissionais.map((prof) => {
                  const servicosDeste = associacoes
                    .filter((a) => a.profissionalId === prof.id)
                    .map((a) => servicos.find((s) => s.id === a.servicoId)?.nome)
                    .filter(Boolean);

                  return (
                    <div
                      key={prof.id}
                      className="flex items-center justify-between p-4 bg-background rounded-lg border border-border"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{prof.nome}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {servicosDeste.length > 0
                            ? servicosDeste.join(", ")
                            : "Nenhum serviço associado"}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
