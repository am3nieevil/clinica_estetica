import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Trash2, Edit, Loader2, X, Check, Scissors } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

interface FormData {
  nome: string;
  especialidade: string;
  telefone: string;
  email: string;
  cidade: string;
  servicoIds: number[];
}

const emptyForm: FormData = { nome: "", especialidade: "", telefone: "", email: "", cidade: "", servicoIds: [] };

export default function Profissionais() {
  const [busca, setBusca] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyForm);

  const utils = trpc.useUtils();
  const { data: profissionais = [], isLoading } = trpc.profissionais.list.useQuery();
  const { data: todosServicos = [], isLoading: loadingServicos } = trpc.servicos.list.useQuery();

  // Busca os serviços associados ao profissional sendo editado
  const { data: servicosAssociados = [] } = trpc.profissionalServicos.getByProfissional.useQuery(
    editId ?? 0,
    { enabled: editId !== null && editId > 0 }
  );

  const createMutation = trpc.profissionais.create.useMutation({
    onSuccess: () => {
      utils.profissionais.list.invalidate();
      utils.profissionalServicos.getByProfissional.invalidate();
      setFormData(emptyForm);
      setShowForm(false);
      toast.success("Profissional cadastrado com sucesso!");
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.profissionais.update.useMutation({
    onSuccess: () => {
      utils.profissionais.list.invalidate();
      utils.profissionalServicos.getByProfissional.invalidate();
      setEditId(null);
      setFormData(emptyForm);
      setShowForm(false);
      toast.success("Profissional atualizado com sucesso!");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.profissionais.delete.useMutation({
    onSuccess: () => {
      utils.profissionais.list.invalidate();
      toast.success("Profissional removido com sucesso!");
    },
    onError: (err) => toast.error(err.message),
  });

  const profissionaisFiltrados = profissionais.filter((p) =>
    p.nome.toLowerCase().includes(busca.toLowerCase()) ||
    p.especialidade.toLowerCase().includes(busca.toLowerCase())
  );

  const handleSave = () => {
    if (!formData.nome.trim() || !formData.especialidade.trim() || !formData.telefone.trim() || !formData.cidade.trim()) {
      toast.error("Nome, especialidade, telefone e cidade são obrigatórios.");
      return;
    }
    if (editId !== null) {
      updateMutation.mutate({ id: editId, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (prof: typeof profissionais[0]) => {
    setEditId(prof.id);
    setFormData({
      nome: prof.nome,
      especialidade: prof.especialidade,
      telefone: prof.telefone,
      email: prof.email ?? "",
      cidade: prof.cidade,
      // Os serviços serão carregados via query e sincronizados via useEffect
      servicoIds: servicosAssociados.map((a) => a.servicoId),
    });
    setShowForm(true);
  };

  // Sincroniza os serviços associados quando carregados do banco
  const handleEditWithServicos = (prof: typeof profissionais[0]) => {
    setEditId(prof.id);
    setFormData({
      nome: prof.nome,
      especialidade: prof.especialidade,
      telefone: prof.telefone,
      email: prof.email ?? "",
      cidade: prof.cidade,
      servicoIds: [],
    });
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditId(null);
    setFormData(emptyForm);
  };

  const toggleServico = (servicoId: number) => {
    setFormData((prev) => ({
      ...prev,
      servicoIds: prev.servicoIds.includes(servicoId)
        ? prev.servicoIds.filter((id) => id !== servicoId)
        : [...prev.servicoIds, servicoId],
    }));
  };

  // Quando os serviços associados chegam do banco, sincroniza com o formulário
  const servicoIdsForm = editId !== null && formData.servicoIds.length === 0 && servicosAssociados.length > 0
    ? servicosAssociados.map((a) => a.servicoId)
    : formData.servicoIds;

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1">Profissionais</h1>
            <p className="text-muted-foreground">Gerencie os profissionais e os serviços que cada um realiza</p>
          </div>
          {!showForm && (
            <Button onClick={() => setShowForm(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Novo Profissional
            </Button>
          )}
        </div>

        {showForm && (
          <Card className="mb-6 border-primary/30">
            <CardHeader>
              <CardTitle>{editId ? "Editar Profissional" : "Novo Profissional"}</CardTitle>
              <CardDescription>
                Preencha os dados e selecione os serviços que este profissional pode realizar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Dados pessoais */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Nome *</label>
                  <Input placeholder="Nome completo" value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium">Especialidade *</label>
                  <Input placeholder="Ex: Esteticista, Micropigmentadora" value={formData.especialidade}
                    onChange={(e) => setFormData({ ...formData, especialidade: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium">Telefone *</label>
                  <Input placeholder="(11) 98765-4321" value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium">E-mail</label>
                  <Input placeholder="email@exemplo.com" value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium">Cidade *</label>
                  <Input placeholder="São Paulo" value={formData.cidade}
                    onChange={(e) => setFormData({ ...formData, cidade: e.target.value })} className="mt-1" />
                </div>
              </div>

              {/* Serviços que o profissional realiza */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Scissors className="w-4 h-4 text-primary" />
                  <label className="text-sm font-medium">Serviços que este profissional realiza</label>
                  {servicoIdsForm.length > 0 && (
                    <Badge variant="secondary" className="ml-auto">
                      {servicoIdsForm.length} selecionado{servicoIdsForm.length !== 1 ? "s" : ""}
                    </Badge>
                  )}
                </div>
                {loadingServicos ? (
                  <div className="flex items-center gap-2 text-muted-foreground text-sm py-3">
                    <Loader2 className="w-4 h-4 animate-spin" /> Carregando serviços...
                  </div>
                ) : todosServicos.length === 0 ? (
                  <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-4 text-center">
                    Nenhum serviço cadastrado. Cadastre serviços primeiro para associá-los ao profissional.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {todosServicos.map((s) => {
                      const selecionado = servicoIdsForm.includes(s.id);
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => {
                            // Se estiver em modo edição e ainda não sincronizou, sincroniza primeiro
                            if (editId !== null && formData.servicoIds.length === 0 && servicosAssociados.length > 0) {
                              const ids = servicosAssociados.map((a) => a.servicoId);
                              const novoIds = ids.includes(s.id) ? ids.filter((id) => id !== s.id) : [...ids, s.id];
                              setFormData((prev) => ({ ...prev, servicoIds: novoIds }));
                            } else {
                              toggleServico(s.id);
                            }
                          }}
                          className={`flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-colors ${
                            selecionado
                              ? "border-primary bg-primary/10 text-foreground"
                              : "border-border hover:border-primary/40 text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                            selecionado ? "border-primary bg-primary" : "border-muted-foreground"
                          }`}>
                            {selecionado && <Check className="w-3 h-3 text-primary-foreground" />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{s.nome}</p>
                            <p className="text-xs text-muted-foreground">
                              R$ {parseFloat(s.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} • {s.duracao} min
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {editId ? "Salvar Alterações" : "Cadastrar Profissional"}
                </Button>
                <Button variant="outline" onClick={handleCancel} className="gap-2">
                  <X className="w-4 h-4" /> Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mb-4 relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome ou especialidade..." value={busca}
            onChange={(e) => setBusca(e.target.value)} className="pl-10" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Profissionais ({profissionaisFiltrados.length})</CardTitle>
            <CardDescription>Profissionais cadastrados no sistema</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : profissionaisFiltrados.length > 0 ? (
              <div className="space-y-2">
                {profissionaisFiltrados.map((prof) => (
                  <ProfissionalItem
                    key={prof.id}
                    prof={prof}
                    onEdit={handleEditWithServicos}
                    onDelete={(id) => { if (confirm(`Remover "${prof.nome}"?`)) deleteMutation.mutate(id); }}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-muted-foreground">
                  {busca ? "Nenhum profissional encontrado." : "Nenhum profissional cadastrado ainda."}
                </p>
                {!busca && (
                  <Button variant="outline" className="mt-4 gap-2" onClick={() => setShowForm(true)}>
                    <Plus className="w-4 h-4" /> Cadastrar primeiro profissional
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

// Sub-componente que busca os serviços do profissional individualmente
type ProfItem = { id: number; nome: string; especialidade: string; telefone: string; email: string | null; cidade: string; ativo: boolean; createdAt: Date; updatedAt: Date };

function ProfissionalItem({
  prof,
  onEdit,
  onDelete,
}: {
  prof: ProfItem;
  onEdit: (prof: ProfItem) => void;
  onDelete: (id: number) => void;
}) {
  const { data: associacoes = [] } = trpc.profissionalServicos.getByProfissional.useQuery(prof.id);
  const { data: todosServicos = [] } = trpc.servicos.list.useQuery();

  const servicosDoProf = todosServicos.filter((s) => associacoes.some((a) => a.servicoId === s.id));

  return (
    <div className="p-4 bg-background rounded-lg border border-border hover:bg-muted/50 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-foreground">{prof.nome}</p>
            <Badge variant={prof.ativo ? "default" : "secondary"}>
              {prof.ativo ? "Ativo" : "Inativo"}
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground flex gap-3 flex-wrap mt-0.5">
            <span>{prof.especialidade}</span>
            <span>• {prof.telefone}</span>
            {prof.cidade && <span>• {prof.cidade}</span>}
          </div>
          {servicosDoProf.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {servicosDoProf.map((s) => (
                <Badge key={s.id} variant="outline" className="text-xs">
                  <Scissors className="w-3 h-3 mr-1" />
                  {s.nome}
                </Badge>
              ))}
            </div>
          )}
          {servicosDoProf.length === 0 && (
            <p className="text-xs text-muted-foreground mt-1 italic">Nenhum serviço associado</p>
          )}
        </div>
        <div className="flex gap-1 ml-2 flex-shrink-0">
          <Button variant="ghost" size="sm" onClick={() => onEdit(prof)}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(prof.id)}>
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      </div>
    </div>
  );
}
