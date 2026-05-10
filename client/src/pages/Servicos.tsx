import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search, Trash2, Edit, Loader2, X, Check, Clock } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

interface FormData {
  nome: string;
  descricao: string;
  valor: string;
  duracao: string;
}

const emptyForm: FormData = { nome: "", descricao: "", valor: "", duracao: "" };

export default function Servicos() {
  const [busca, setBusca] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyForm);

  const utils = trpc.useUtils();
  const { data: servicos = [], isLoading } = trpc.servicos.list.useQuery();

  const createMutation = trpc.servicos.create.useMutation({
    onSuccess: () => {
      utils.servicos.list.invalidate();
      setFormData(emptyForm);
      setShowForm(false);
      toast.success("Serviço cadastrado com sucesso!");
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.servicos.update.useMutation({
    onSuccess: () => {
      utils.servicos.list.invalidate();
      setEditId(null);
      setFormData(emptyForm);
      setShowForm(false);
      toast.success("Serviço atualizado com sucesso!");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.servicos.delete.useMutation({
    onSuccess: () => {
      utils.servicos.list.invalidate();
      toast.success("Serviço removido com sucesso!");
    },
    onError: (err) => toast.error(err.message),
  });

  const servicosFiltrados = servicos.filter((s) =>
    s.nome.toLowerCase().includes(busca.toLowerCase())
  );

  const handleSave = () => {
    if (!formData.nome.trim() || !formData.valor.trim() || !formData.duracao.trim()) {
      toast.error("Nome, valor e duração são obrigatórios.");
      return;
    }
    const valorNum = parseFloat(formData.valor);
    if (isNaN(valorNum) || valorNum <= 0) {
      toast.error("Valor deve ser um número positivo.");
      return;
    }
    const duracaoNum = parseInt(formData.duracao);
    if (isNaN(duracaoNum) || duracaoNum < 5) {
      toast.error("Duração mínima é de 5 minutos.");
      return;
    }
    const payload = { nome: formData.nome, descricao: formData.descricao, valor: formData.valor, duracao: duracaoNum };
    if (editId !== null) {
      updateMutation.mutate({ id: editId, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleEdit = (serv: typeof servicos[0]) => {
    setEditId(serv.id);
    setFormData({ nome: serv.nome, descricao: serv.descricao ?? "", valor: serv.valor, duracao: serv.duracao.toString() });
    setShowForm(true);
  };

  const handleCancel = () => { setShowForm(false); setEditId(null); setFormData(emptyForm); };
  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1">Serviços</h1>
            <p className="text-muted-foreground">Gerencie o catálogo de serviços oferecidos</p>
          </div>
          {!showForm && (
            <Button onClick={() => setShowForm(true)} className="gap-2">
              <Plus className="w-4 h-4" /> Novo Serviço
            </Button>
          )}
        </div>

        {showForm && (
          <Card className="mb-6 border-primary/30">
            <CardHeader>
              <CardTitle>{editId ? "Editar Serviço" : "Novo Serviço"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-sm font-medium">Nome do Serviço *</label>
                  <Input placeholder="Ex: Limpeza de Pele, Botox, Micropigmentação" value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium">Valor (R$) *</label>
                  <Input placeholder="150.00" value={formData.valor} type="number" min="0" step="0.01"
                    onChange={(e) => setFormData({ ...formData, valor: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium">Duração (minutos) *</label>
                  <Input placeholder="60" value={formData.duracao} type="number" min="5"
                    onChange={(e) => setFormData({ ...formData, duracao: e.target.value })} className="mt-1" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium">Descrição</label>
                  <Input placeholder="Descrição opcional do serviço" value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })} className="mt-1" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {editId ? "Salvar Alterações" : "Cadastrar Serviço"}
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
          <Input placeholder="Buscar serviço por nome..." value={busca}
            onChange={(e) => setBusca(e.target.value)} className="pl-10" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Catálogo de Serviços ({servicosFiltrados.length})</CardTitle>
            <CardDescription>Serviços disponíveis para agendamento</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : servicosFiltrados.length > 0 ? (
              <div className="space-y-2">
                {servicosFiltrados.map((serv) => (
                  <div key={serv.id}
                    className="flex items-center justify-between p-4 bg-background rounded-lg border border-border hover:bg-muted/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground">{serv.nome}</p>
                      <div className="text-sm text-muted-foreground flex gap-3 flex-wrap mt-0.5">
                        <span className="font-semibold text-primary">
                          R$ {parseFloat(serv.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {serv.duracao} min
                        </span>
                        {serv.descricao && <span>• {serv.descricao}</span>}
                      </div>
                    </div>
                    <div className="flex gap-1 ml-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(serv)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm"
                        onClick={() => { if (confirm(`Remover o serviço "${serv.nome}"?`)) deleteMutation.mutate(serv.id); }}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-muted-foreground">
                  {busca ? "Nenhum serviço encontrado." : "Nenhum serviço cadastrado ainda."}
                </p>
                {!busca && (
                  <Button variant="outline" className="mt-4 gap-2" onClick={() => setShowForm(true)}>
                    <Plus className="w-4 h-4" /> Cadastrar primeiro serviço
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
