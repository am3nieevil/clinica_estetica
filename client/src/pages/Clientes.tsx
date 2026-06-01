import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Plus, Search, Trash2, Edit, Loader2, X, Check, MapPin, Eye } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import { CidadeSelect } from "@/components/CidadeSelect";

// ── Helpers de validação ──────────────────────────────────────────────────────
const TELEFONE_REGEX = /^\(?\d{2}\)?[\s-]?\d{4,5}[\s-]?\d{4}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validarTelefone(tel: string): string | null {
  const limpo = tel.replace(/\D/g, "");
  if (!limpo) return null; // vazio é ok (não obrigatório em edição)
  if (limpo.length < 10 || limpo.length > 11) return "Telefone deve ter 10 ou 11 dígitos (com DDD).";
  if (!TELEFONE_REGEX.test(tel.trim())) return "Formato inválido. Use (11) 99999-9999 ou 11999999999.";
  return null;
}

function validarEmail(email: string): string | null {
  if (!email.trim()) return null; // opcional
  if (!EMAIL_REGEX.test(email.trim())) return "E-mail inválido.";
  return null;
}

// Máscara de telefone: (11) 99999-9999
function mascaraTelefone(valor: string): string {
  const nums = valor.replace(/\D/g, "").slice(0, 11);
  if (nums.length <= 2) return nums.length ? `(${nums}` : "";
  if (nums.length <= 6) return `(${nums.slice(0, 2)}) ${nums.slice(2)}`;
  if (nums.length <= 10) return `(${nums.slice(0, 2)}) ${nums.slice(2, 6)}-${nums.slice(6)}`;
  return `(${nums.slice(0, 2)}) ${nums.slice(2, 7)}-${nums.slice(7)}`;
}

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface FormData {
  nome: string;
  telefone: string;
  email: string;
  rua: string;
  numero: string;
  bairro: string;
  cidade: string;
  uf: string;
}

const emptyForm: FormData = {
  nome: "", telefone: "", email: "",
  rua: "", numero: "", bairro: "", cidade: "", uf: "",
};

interface FormErrors {
  telefone?: string;
  email?: string;
}

export default function Clientes() {
  const [busca, setBusca] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [viewCliente, setViewCliente] = useState<typeof clientes[0] | null>(null);

  const utils = trpc.useUtils();
  const { data: clientes = [], isLoading } = trpc.clientes.list.useQuery();

  const createMutation = trpc.clientes.create.useMutation({
    onSuccess: () => {
      utils.clientes.list.invalidate();
      setFormData(emptyForm);
      setErrors({});
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
      setErrors({});
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
    c.telefone.includes(busca) ||
    (c.email ?? "").toLowerCase().includes(busca.toLowerCase())
  );

  const validarForm = (): boolean => {
    const novoErrors: FormErrors = {};
    const erroTel = validarTelefone(formData.telefone);
    if (erroTel) novoErrors.telefone = erroTel;
    const erroEmail = validarEmail(formData.email);
    if (erroEmail) novoErrors.email = erroEmail;
    setErrors(novoErrors);
    return Object.keys(novoErrors).length === 0;
  };

  const handleSave = () => {
    if (!formData.nome.trim()) {
      toast.error("Nome é obrigatório.");
      return;
    }
    if (!formData.telefone.trim()) {
      toast.error("Telefone é obrigatório.");
      return;
    }
    if (!validarForm()) return;

    const payload = {
      nome: formData.nome.trim(),
      telefone: formData.telefone.trim(),
      email: formData.email.trim() || undefined,
      rua: formData.rua.trim() || undefined,
      numero: formData.numero.trim() || undefined,
      bairro: formData.bairro.trim() || undefined,
      cidade: formData.cidade || undefined,
      uf: formData.uf || undefined,
    };

    if (editId !== null) {
      updateMutation.mutate({ id: editId, ...payload });
    } else {
      createMutation.mutate(payload as Parameters<typeof createMutation.mutate>[0]);
    }
  };

  const handleEdit = (cliente: typeof clientes[0]) => {
    setEditId(cliente.id);
    setFormData({
      nome: cliente.nome,
      telefone: cliente.telefone,
      email: cliente.email ?? "",
      rua: (cliente as any).rua ?? "",
      numero: (cliente as any).numero ?? "",
      bairro: (cliente as any).bairro ?? "",
      cidade: cliente.cidade ?? "",
      uf: (cliente as any).uf ?? "",
    });
    setErrors({});
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditId(null);
    setFormData(emptyForm);
    setErrors({});
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const cidadeValue =
    formData.uf && formData.cidade
      ? { uf: formData.uf, cidade: formData.cidade }
      : null;

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
              {/* Nome e Telefone */}
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
                    placeholder="(11) 99999-9999"
                    value={formData.telefone}
                    onChange={(e) => {
                      const masked = mascaraTelefone(e.target.value);
                      setFormData({ ...formData, telefone: masked });
                      setErrors((prev) => ({ ...prev, telefone: undefined }));
                    }}
                    onBlur={() => {
                      const err = validarTelefone(formData.telefone);
                      setErrors((prev) => ({ ...prev, telefone: err ?? undefined }));
                    }}
                    className={`mt-1 ${errors.telefone ? "border-destructive focus-visible:ring-destructive" : ""}`}
                    maxLength={15}
                  />
                  {errors.telefone && (
                    <p className="text-xs text-destructive mt-1">{errors.telefone}</p>
                  )}
                </div>
              </div>

              {/* E-mail e Cidade */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">E-mail</label>
                  <Input
                    placeholder="email@exemplo.com"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      setErrors((prev) => ({ ...prev, email: undefined }));
                    }}
                    onBlur={() => {
                      const err = validarEmail(formData.email);
                      setErrors((prev) => ({ ...prev, email: err ?? undefined }));
                    }}
                    className={`mt-1 ${errors.email ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  />
                  {errors.email && (
                    <p className="text-xs text-destructive mt-1">{errors.email}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> Cidade
                  </label>
                  <div className="mt-1">
                    <CidadeSelect
                      value={cidadeValue}
                      onChange={(val) =>
                        setFormData({
                          ...formData,
                          cidade: val?.cidade ?? "",
                          uf: val?.uf ?? "",
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Endereço: Rua, Número, Bairro */}
              <div>
                <label className="text-sm font-medium text-muted-foreground uppercase tracking-wide text-xs mb-2 block">
                  Endereço
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium">Rua / Avenida</label>
                    <Input
                      placeholder="Rua das Flores"
                      value={formData.rua}
                      onChange={(e) => setFormData({ ...formData, rua: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Número</label>
                    <Input
                      placeholder="123"
                      value={formData.numero}
                      onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="text-sm font-medium">Bairro</label>
                    <Input
                      placeholder="Centro"
                      value={formData.bairro}
                      onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                      className="mt-1"
                    />
                  </div>
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
            placeholder="Buscar por nome, telefone ou e-mail..."
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
                {clientesFiltrados.map((cliente) => {
                  const c = cliente as typeof cliente & { rua?: string; numero?: string; bairro?: string; uf?: string };
                  const enderecoPartes = [c.rua, c.numero, c.bairro].filter(Boolean).join(", ");
                  const localidade = [c.uf, c.cidade].filter(Boolean).join(" — ");
                  return (
                    <div
                      key={c.id}
                      className="flex items-center justify-between p-4 bg-background rounded-lg border border-border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{c.nome}</p>
                        <div className="text-sm text-muted-foreground flex gap-3 flex-wrap mt-0.5">
                          <span>{c.telefone}</span>
                          {c.email && <span>• {c.email}</span>}
                          {localidade && <span>• {localidade}</span>}
                          {enderecoPartes && <span>• {enderecoPartes}</span>}
                        </div>
                      </div>
                      <div className="flex gap-1 ml-2">
                        <Button variant="ghost" size="sm" onClick={() => setViewCliente(c)} title="Visualizar">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(c)} title="Editar">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm(`Remover o cliente "${c.nome}"?`)) {
                              deleteMutation.mutate(c.id);
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

      {/* Modal de Visualização */}
      <Dialog open={!!viewCliente} onOpenChange={(open) => { if (!open) setViewCliente(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Detalhes do Cliente
            </DialogTitle>
          </DialogHeader>
          {viewCliente && (() => {
            const c = viewCliente as typeof viewCliente & { rua?: string; numero?: string; bairro?: string; uf?: string; dataNascimento?: string };
            const enderecoPartes = [c.rua, c.numero].filter(Boolean).join(", ");
            const localidade = [c.uf, c.cidade].filter(Boolean).join(" — ");
            return (
              <div className="space-y-4 mt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Nome</p>
                    <p className="font-medium text-foreground">{c.nome}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Telefone</p>
                    <p className="text-foreground">{c.telefone || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">E-mail</p>
                    <p className="text-foreground">{c.email || "—"}</p>
                  </div>
                  {c.dataNascimento && (
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Data de Nascimento</p>
                      <p className="text-foreground">{new Date(c.dataNascimento).toLocaleDateString("pt-BR")}</p>
                    </div>
                  )}
                  {(c.rua || c.bairro) && (
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Endereço</p>
                      <p className="text-foreground">{[enderecoPartes, c.bairro].filter(Boolean).join(" — ")}</p>
                    </div>
                  )}
                  {localidade && (
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Cidade / UF</p>
                      <p className="text-foreground">{localidade}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Cadastrado em</p>
                    <p className="text-foreground">{new Date(c.createdAt).toLocaleDateString("pt-BR")}</p>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t">
                  <Button variant="outline" onClick={() => setViewCliente(null)}>Fechar</Button>
                  <Button onClick={() => { setViewCliente(null); handleEdit(viewCliente); }} className="gap-2">
                    <Edit className="w-4 h-4" /> Editar
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
