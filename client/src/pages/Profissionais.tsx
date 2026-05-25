import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Trash2, Edit, Loader2, X, Check, Scissors, MapPin } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import { CidadeSelect } from "@/components/CidadeSelect";

// ── Helpers de validação ──────────────────────────────────────────────────────
const TELEFONE_REGEX = /^\(?\d{2}\)?[\s-]?\d{4,5}[\s-]?\d{4}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validarTelefone(tel: string): string | null {
  const limpo = tel.replace(/\D/g, "");
  if (!limpo) return "Telefone é obrigatório.";
  if (limpo.length < 10 || limpo.length > 11) return "Telefone deve ter 10 ou 11 dígitos (com DDD).";
  if (!TELEFONE_REGEX.test(tel.trim())) return "Formato inválido. Use (11) 99999-9999.";
  return null;
}

function validarEmail(email: string): string | null {
  if (!email.trim()) return null;
  if (!EMAIL_REGEX.test(email.trim())) return "E-mail inválido.";
  return null;
}

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
  especialidade: string;
  telefone: string;
  email: string;
  rua: string;
  numero: string;
  bairro: string;
  cidade: string;
  uf: string;
  servicoIds: number[];
}

const emptyForm: FormData = {
  nome: "", especialidade: "", telefone: "", email: "",
  rua: "", numero: "", bairro: "", cidade: "", uf: "",
  servicoIds: [],
};

interface FormErrors {
  telefone?: string;
  email?: string;
}

type ProfItem = {
  id: number; nome: string; especialidade: string; telefone: string;
  email: string | null; rua: string | null; numero: string | null;
  bairro: string | null; cidade: string | null; uf: string | null;
  ativo: boolean; createdAt: Date; updatedAt: Date;
};

export default function Profissionais() {
  const [busca, setBusca] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});

  const utils = trpc.useUtils();
  const { data: profissionais = [], isLoading } = trpc.profissionais.list.useQuery();
  const { data: todosServicos = [], isLoading: loadingServicos } = trpc.servicos.list.useQuery();

  const { data: servicosAssociados = [] } = trpc.profissionalServicos.getByProfissional.useQuery(
    editId ?? 0,
    { enabled: editId !== null && editId > 0 }
  );

  const createMutation = trpc.profissionais.create.useMutation({
    onSuccess: () => {
      utils.profissionais.list.invalidate();
      utils.profissionalServicos.getByProfissional.invalidate();
      setFormData(emptyForm);
      setErrors({});
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
      setErrors({});
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

  const profissionaisFiltrados = (profissionais as ProfItem[]).filter((p) =>
    p.nome.toLowerCase().includes(busca.toLowerCase()) ||
    p.especialidade.toLowerCase().includes(busca.toLowerCase())
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
    if (!formData.nome.trim() || !formData.especialidade.trim()) {
      toast.error("Nome e especialidade são obrigatórios.");
      return;
    }
    if (!validarForm()) return;

    const servicoIdsFinais =
      editId !== null && formData.servicoIds.length === 0 && servicosAssociados.length > 0
        ? servicosAssociados.map((a) => a.servicoId)
        : formData.servicoIds;

    const payload = {
      nome: formData.nome.trim(),
      especialidade: formData.especialidade.trim(),
      telefone: formData.telefone.trim(),
      email: formData.email.trim() || undefined,
      rua: formData.rua.trim() || undefined,
      numero: formData.numero.trim() || undefined,
      bairro: formData.bairro.trim() || undefined,
      cidade: formData.cidade || undefined,
      uf: formData.uf || undefined,
      servicoIds: servicoIdsFinais,
    };

    if (editId !== null) {
      updateMutation.mutate({ id: editId, ...payload });
    } else {
      createMutation.mutate(payload as Parameters<typeof createMutation.mutate>[0]);
    }
  };

  const handleEditWithServicos = (prof: ProfItem) => {
    setEditId(prof.id);
    setFormData({
      nome: prof.nome,
      especialidade: prof.especialidade,
      telefone: prof.telefone,
      email: prof.email ?? "",
      rua: prof.rua ?? "",
      numero: prof.numero ?? "",
      bairro: prof.bairro ?? "",
      cidade: prof.cidade ?? "",
      uf: prof.uf ?? "",
      servicoIds: [],
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

  const toggleServico = (servicoId: number) => {
    const base =
      editId !== null && formData.servicoIds.length === 0 && servicosAssociados.length > 0
        ? servicosAssociados.map((a) => a.servicoId)
        : formData.servicoIds;
    setFormData((prev) => ({
      ...prev,
      servicoIds: base.includes(servicoId)
        ? base.filter((id) => id !== servicoId)
        : [...base, servicoId],
    }));
  };

  const servicoIdsForm =
    editId !== null && formData.servicoIds.length === 0 && servicosAssociados.length > 0
      ? servicosAssociados.map((a) => a.servicoId)
      : formData.servicoIds;

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const cidadeValue =
    formData.uf && formData.cidade ? { uf: formData.uf, cidade: formData.cidade } : null;

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
              {/* Nome e Especialidade */}
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
                  <label className="text-sm font-medium">Especialidade *</label>
                  <Input
                    placeholder="Ex: Esteticista, Micropigmentadora"
                    value={formData.especialidade}
                    onChange={(e) => setFormData({ ...formData, especialidade: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Telefone e E-mail */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>

              {/* Cidade */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          onClick={() => toggleServico(s.id)}
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
          <Input
            placeholder="Buscar por nome ou especialidade..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-10"
          />
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

// ── Sub-componente que busca os serviços do profissional individualmente ──────
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
  const localidade = [prof.uf, prof.cidade].filter(Boolean).join(" — ");

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
            {localidade && <span>• <MapPin className="w-3 h-3 inline" /> {localidade}</span>}
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
