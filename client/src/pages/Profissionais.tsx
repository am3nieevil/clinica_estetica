import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Trash2, Edit, Loader2, X, Check } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

interface FormData {
  nome: string;
  especialidade: string;
  telefone: string;
  email: string;
  cidade: string;
}

const emptyForm: FormData = { nome: "", especialidade: "", telefone: "", email: "", cidade: "" };

export default function Profissionais() {
  const [busca, setBusca] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyForm);

  const utils = trpc.useUtils();
  const { data: profissionais = [], isLoading } = trpc.profissionais.list.useQuery();

  const createMutation = trpc.profissionais.create.useMutation({
    onSuccess: () => {
      utils.profissionais.list.invalidate();
      setFormData(emptyForm);
      setShowForm(false);
      toast.success("Profissional cadastrado com sucesso!");
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.profissionais.update.useMutation({
    onSuccess: () => {
      utils.profissionais.list.invalidate();
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
    });
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditId(null);
    setFormData(emptyForm);
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1">Profissionais</h1>
            <p className="text-muted-foreground">Gerencie os profissionais cadastrados no sistema</p>
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
            </CardHeader>
            <CardContent className="space-y-4">
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
              <div className="flex gap-2">
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
                  <div key={prof.id}
                    className="flex items-center justify-between p-4 bg-background rounded-lg border border-border hover:bg-muted/50 transition-colors">
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
                    </div>
                    <div className="flex gap-1 ml-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(prof)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm"
                        onClick={() => { if (confirm(`Remover "${prof.nome}"?`)) deleteMutation.mutate(prof.id); }}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
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
