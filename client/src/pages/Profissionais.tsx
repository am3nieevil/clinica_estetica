import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search, Trash2, Edit, User } from "lucide-react";
import Sidebar from "@/components/Sidebar";

interface Profissional {
  id: string;
  nome: string;
  especialidade: string;
  telefone: string;
  email: string;
  status: "ativo" | "inativo";
}

export default function Profissionais() {
  const [profissionais, setProfissionais] = useState<Profissional[]>([
    {
      id: "1",
      nome: "Ana Silva",
      especialidade: "Micropigmentação",
      telefone: "(11) 98765-4321",
      email: "ana@estetica.com",
      status: "ativo",
    },
    {
      id: "2",
      nome: "Carla Santos",
      especialidade: "Botox e Preenchimento",
      telefone: "(11) 99876-5432",
      email: "carla@estetica.com",
      status: "ativo",
    },
    {
      id: "3",
      nome: "Marina Costa",
      especialidade: "Limpeza de Pele",
      telefone: "(11) 97654-3210",
      email: "marina@estetica.com",
      status: "inativo",
    },
  ]);

  const [busca, setBusca] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    nome: string;
    especialidade: string;
    telefone: string;
    email: string;
    status: "ativo" | "inativo";
  }>({
    nome: "",
    especialidade: "",
    telefone: "",
    email: "",
    status: "ativo",
  });

  const profissionaisFiltrados = profissionais.filter((p) =>
    p.nome.toLowerCase().includes(busca.toLowerCase()) ||
    p.especialidade.toLowerCase().includes(busca.toLowerCase())
  );

  const handleAddProfissional = () => {
    if (formData.nome && formData.especialidade && formData.telefone) {
      if (editingId) {
        setProfissionais(
          profissionais.map((p) =>
            p.id === editingId ? { ...p, ...formData } : p
          )
        );
        setEditingId(null);
      } else {
        setProfissionais([
          ...profissionais,
          {
            id: Date.now().toString(),
            ...formData,
          },
        ]);
      }
      setFormData({
        nome: "",
        especialidade: "",
        telefone: "",
        email: "",
        status: "ativo",
      });
      setShowForm(false);
    }
  };

  const handleEdit = (profissional: Profissional) => {
    setFormData({
      nome: profissional.nome,
      especialidade: profissional.especialidade,
      telefone: profissional.telefone,
      email: profissional.email,
      status: profissional.status,
    });
    setEditingId(profissional.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    setProfissionais(profissionais.filter((p) => p.id !== id));
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-8 max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">
                Profissionais
              </h1>
              <p className="text-muted-foreground">
                Gerencie os profissionais da sua equipe
              </p>
            </div>
            <Button
              onClick={() => {
                setEditingId(null);
                setFormData({
                  nome: "",
                  especialidade: "",
                  telefone: "",
                  email: "",
                  status: "ativo",
                });
                setShowForm(!showForm);
              }}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Novo Profissional
            </Button>
          </div>

          {/* Formulário de Novo Profissional */}
          {showForm && (
            <Card className="border-border bg-card mb-8">
              <CardHeader>
                <CardTitle>
                  {editingId ? "Editar Profissional" : "Adicionar Novo Profissional"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground">
                      Nome *
                    </label>
                    <Input
                      placeholder="Nome completo"
                      value={formData.nome}
                      onChange={(e) =>
                        setFormData({ ...formData, nome: e.target.value })
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">
                      Especialidade *
                    </label>
                    <Input
                      placeholder="Ex: Micropigmentação, Botox, Limpeza de Pele"
                      value={formData.especialidade}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          especialidade: e.target.value,
                        })
                      }
                      className="mt-1"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground">
                        Telefone *
                      </label>
                      <Input
                        placeholder="(11) 98765-4321"
                        value={formData.telefone}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            telefone: e.target.value,
                          })
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground">
                        E-mail
                      </label>
                      <Input
                        placeholder="email@example.com"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          status: (e.target.value as "ativo" | "inativo"),
                        })
                      }
                      className="w-full mt-1 px-3 py-2 border border-border rounded-md bg-background text-foreground"
                    >
                      <option value="ativo">Ativo</option>
                      <option value="inativo">Inativo</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleAddProfissional}>
                      {editingId ? "Atualizar" : "Salvar"} Profissional
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowForm(false);
                        setEditingId(null);
                        setFormData({
                          nome: "",
                          especialidade: "",
                          telefone: "",
                          email: "",
                          status: "ativo" as const,
                        });
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Busca */}
          <div className="mb-6 relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Buscar profissional por nome ou especialidade..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Lista de Profissionais */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>
                Lista de Profissionais ({profissionaisFiltrados.length})
              </CardTitle>
              <CardDescription>
                Clique para editar ou remover um profissional
              </CardDescription>
            </CardHeader>
            <CardContent>
              {profissionaisFiltrados.length > 0 ? (
                <div className="space-y-2">
                  {profissionaisFiltrados.map((profissional) => (
                    <div
                      key={profissional.id}
                      className="flex items-center justify-between p-4 bg-background rounded-lg border border-border hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-foreground">
                            {profissional.nome}
                          </p>
                          <div className="text-sm text-muted-foreground space-x-3">
                            <span>{profissional.especialidade}</span>
                            <span>•</span>
                            <span>{profissional.telefone}</span>
                          </div>
                          {profissional.email && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {profissional.email}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            profissional.status === "ativo"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {profissional.status === "ativo"
                            ? "Ativo"
                            : "Inativo"}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(profissional)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(profissional.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    {busca
                      ? "Nenhum profissional encontrado"
                      : "Nenhum profissional cadastrado"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
