import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Link2, UserCog, Scissors, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

export default function ProfissionalServicos() {
  const [selectedProfissionalId, setSelectedProfissionalId] = useState<number | null>(null);

  const utils = trpc.useUtils();

  const { data: profissionais = [], isLoading: loadingProf } = trpc.profissionais.list.useQuery();
  const { data: servicos = [], isLoading: loadingServ } = trpc.servicos.list.useQuery();
  const { data: servicosAssociados = [], isLoading: loadingAssoc } =
    trpc.profissionalServicos.getByProfissional.useQuery(selectedProfissionalId!, {
      enabled: selectedProfissionalId !== null,
    });

  const associarMutation = trpc.profissionalServicos.associar.useMutation({
    onSuccess: () => {
      utils.profissionalServicos.getByProfissional.invalidate(selectedProfissionalId!);
      toast.success("Serviço associado com sucesso!");
    },
    onError: (err) => toast.error(err.message),
  });

  const removerMutation = trpc.profissionalServicos.remover.useMutation({
    onSuccess: () => {
      utils.profissionalServicos.getByProfissional.invalidate(selectedProfissionalId!);
      toast.success("Associação removida com sucesso!");
    },
    onError: (err) => toast.error(err.message),
  });

  const isLoading = loadingProf || loadingServ;

  const profissionalSelecionado = profissionais.find((p) => p.id === selectedProfissionalId);
  const idsAssociados = new Set(servicosAssociados.map((s: { id: number }) => s.id));

  const handleToggle = (servicoId: number, isAssociado: boolean) => {
    if (!selectedProfissionalId) return;
    if (isAssociado) {
      removerMutation.mutate({ profissionalId: selectedProfissionalId, servicoId });
    } else {
      associarMutation.mutate({ profissionalId: selectedProfissionalId, servicoId });
    }
  };

  const isMutating = associarMutation.isPending || removerMutation.isPending;

  return (
    <DashboardLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Link2 className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Associações</h1>
            <p className="text-sm text-muted-foreground">
              Defina quais serviços cada profissional pode realizar
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Coluna: Lista de Profissionais */}
            <div>
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <UserCog className="w-4 h-4 text-primary" />
                    <CardTitle className="text-base">Profissionais</CardTitle>
                  </div>
                  <CardDescription>
                    {profissionais.length} profissional(is) cadastrado(s)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {profissionais.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <AlertCircle className="w-8 h-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Nenhum profissional cadastrado ainda.
                      </p>
                    </div>
                  ) : (
                    profissionais.map((prof) => (
                      <button
                        key={prof.id}
                        onClick={() => setSelectedProfissionalId(prof.id)}
                        className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                          selectedProfissionalId === prof.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/40 hover:bg-muted/50"
                        }`}
                      >
                        <p className="font-medium text-foreground text-sm">{prof.nome}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{prof.especialidade}</p>
                        <p className="text-xs text-muted-foreground">{prof.cidade}</p>
                        <Badge
                          variant={prof.ativo ? "default" : "secondary"}
                          className="mt-1 text-xs"
                        >
                          {prof.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </button>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Coluna: Serviços para associar */}
            <div className="lg:col-span-2">
              {selectedProfissionalId === null ? (
                <Card className="h-full">
                  <CardContent className="flex flex-col items-center justify-center h-64 text-center">
                    <Link2 className="w-10 h-10 text-muted-foreground mb-3" />
                    <p className="text-muted-foreground font-medium">
                      Selecione um profissional
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Clique em um profissional à esquerda para gerenciar os serviços associados.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Scissors className="w-4 h-4 text-primary" />
                      <CardTitle className="text-base">
                        Serviços de {profissionalSelecionado?.nome}
                      </CardTitle>
                    </div>
                    <CardDescription>
                      {loadingAssoc
                        ? "Carregando..."
                        : `${idsAssociados.size} de ${servicos.length} serviço(s) associado(s)`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {servicos.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <AlertCircle className="w-8 h-8 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Nenhum serviço cadastrado ainda. Cadastre serviços primeiro.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {servicos.map((servico) => {
                          const isAssociado = idsAssociados.has(servico.id);
                          return (
                            <div
                              key={servico.id}
                              onClick={() => !isMutating && handleToggle(servico.id, isAssociado)}
                              className={`flex items-center gap-3 p-4 rounded-lg border transition-all cursor-pointer ${
                                isAssociado
                                  ? "border-primary/40 bg-primary/5"
                                  : "border-border hover:border-primary/30 hover:bg-muted/40"
                              } ${isMutating ? "opacity-60 cursor-not-allowed" : ""}`}
                            >
                              <Checkbox
                                checked={isAssociado}
                                onCheckedChange={() =>
                                  !isMutating && handleToggle(servico.id, isAssociado)
                                }
                                disabled={isMutating || loadingAssoc}
                                className="pointer-events-none"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-foreground text-sm truncate">
                                  {servico.nome}
                                </p>
                                {servico.descricao && (
                                  <p className="text-xs text-muted-foreground truncate">
                                    {servico.descricao}
                                  </p>
                                )}
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="outline" className="text-xs">
                                    R$ {parseFloat(servico.valor).toFixed(2)}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {servico.duracao} min
                                  </Badge>
                                </div>
                              </div>
                              {isAssociado && (
                                <Badge className="text-xs shrink-0">Associado</Badge>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Resumo Geral */}
        {!isLoading && profissionais.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Resumo Geral</CardTitle>
              <CardDescription>Visão consolidada de todos os profissionais</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-border">
                {profissionais.map((prof) => (
                  <div
                    key={prof.id}
                    className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-primary">
                          {prof.nome.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-sm text-foreground">{prof.nome}</p>
                        <p className="text-xs text-muted-foreground">{prof.especialidade}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedProfissionalId(prof.id)}
                      className="text-xs text-primary hover:underline"
                    >
                      Gerenciar →
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
