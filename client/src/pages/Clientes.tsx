import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search, Trash2, Edit, Loader2, X, Check } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

interface FormData {
  nome: string;
  telefone: string;
  email: string;
  cidade: string;
  endereco: string;
}

const emptyForm: FormData = { nome: "", telefone: "", email: "", cidade: "", endereco: "" };

export default function Clientes() {
  const [busca, setBusca] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyForm);

  const utils = trpc.useUtils();
  const { data: clientes = [], isLoading } = trpc.clientes.list.useQuery();

  const createMutation = trpc.clientes.create.useMutation({
    onSuccess: () => {
      utils.clientes.list.invalidate();
      setFormData(emptyForm);
      setShowForm(false);
      toast.success("Cliente cadastrado com sucesso!");
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.clientes.update.useMutation({
    onSuccess: () => {
      utils.clientes.list.invalidate();
      setEditId(null);
      setFormData(emptyForm);
      toast.success("Cliente atualizado com sucesso!");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.clientes.delete.useMutation({
    onSuccess: () => {
      utils.clientes.list.invalidate();
      toast.success("Cliente removido com sucesso!");
    },
    onError: (err) => toast.error(err.message),
  });

  const clientesFiltrados = clientes.filter((c) =>
    c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    c.telefone.includes(busca)
  );

  const handleSave = () => {
    if (!formData.nome.trim() || !formData.telefone.trim()) {
      toast.error("Nome e telefone são obrigatórios.");
      return;
    }
    if (editId !== null) {
      updateMutation.mutate({ id: editId, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (cliente: typeof clientes[0]) => {
    setEditId(cliente.id);
    setFormData({
      nome: cliente.nome,
      telefone: cliente.telefone,
      email: cliente.email ?? "",
      cidade: cliente.cidade ?? "",
      endereco: cliente.endereco ?? "",
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
        {/* Header */}
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1">Clientes</h1>
            <p className="text-muted-foreground">Gerencie os clientes cadastrados no sistema</p>
          </div>
          {!showForm && (
            <Button onClick={() => setShowForm(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Novo Cliente
            </Button>
          )}
        </div>

        {/* Formulário */}
        {showForm && (
          <Card className="mb-6 border-primary/30">
            <CardHeader>
              <CardTitle>{editId ? "Editar Cliente" : "Novo Cliente"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Nome *</label>
                  <Input
                    placeholder="Nome completo"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Telefone *</label>
                  <Input
                    placeholder="(11) 98765-4321"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">E-mail</label>
                  <Input
                    placeholder="email@exemplo.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Cidade</label>
                  <Input
                    placeholder="São Paulo"
                    value={formData.cidade}
                    onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium">Endereço</label>
                  <Input
                    placeholder="Rua, número, bairro"
                    value={formData.endereco}
                    onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {editId ? "Salvar Alterações" : "Cadastrar Cliente"}
                </Button>
                <Button variant="outline" onClick={handleCancel} className="gap-2">
                  <X className="w-4 h-4" />
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Busca */}
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou telefone..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Lista */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Clientes ({clientesFiltrados.length})</CardTitle>
            <CardDescription>Clientes ativos cadastrados no sistema</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : clientesFiltrados.length > 0 ? (
              <div className="space-y-2">
                {clientesFiltrados.map((cliente) => (
                  <div
                    key={cliente.id}
                    className="flex items-center justify-between p-4 bg-background rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{cliente.nome}</p>
                      <div className="text-sm text-muted-foreground flex gap-3 flex-wrap mt-0.5">
                        <span>{cliente.telefone}</span>
                        {cliente.email && <span>• {cliente.email}</span>}
                        {cliente.cidade && <span>• {cliente.cidade}</span>}
                      </div>
                    </div>
                    <div className="flex gap-1 ml-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(cliente)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm(`Remover o cliente "${cliente.nome}"?`)) {
                            deleteMutation.mutate(cliente.id);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-muted-foreground">
                  {busca ? "Nenhum cliente encontrado para esta busca." : "Nenhum cliente cadastrado ainda."}
                </p>
                {!busca && (
                  <Button variant="outline" className="mt-4 gap-2" onClick={() => setShowForm(true)}>
                    <Plus className="w-4 h-4" />
                    Cadastrar primeiro cliente
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
