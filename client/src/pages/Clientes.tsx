import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search, Trash2, Edit } from "lucide-react";
import Sidebar from "@/components/Sidebar";

interface Cliente {
  id: string;
  nome: string;
  telefone: string;
  email: string;
}

export default function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([
    {
      id: "1",
      nome: "Maria Silva",
      telefone: "(11) 98765-4321",
      email: "maria@email.com",
    },
    {
      id: "2",
      nome: "João Santos",
      telefone: "(11) 99876-5432",
      email: "joao@email.com",
    },
    {
      id: "3",
      nome: "Ana Costa",
      telefone: "(11) 97654-3210",
      email: "ana@email.com",
    },
  ]);

  const [busca, setBusca] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ nome: "", telefone: "", email: "" });

  const clientesFiltrados = clientes.filter((c) =>
    c.nome.toLowerCase().includes(busca.toLowerCase())
  );

  const handleAddCliente = () => {
    if (formData.nome && formData.telefone) {
      setClientes([
        ...clientes,
        {
          id: Date.now().toString(),
          ...formData,
        },
      ]);
      setFormData({ nome: "", telefone: "", email: "" });
      setShowForm(false);
    }
  };

  const handleDelete = (id: string) => {
    setClientes(clientes.filter((c) => c.id !== id));
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-8 max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">Clientes</h1>
              <p className="text-muted-foreground">Gerencie seus clientes e suas informações</p>
            </div>
            <Button onClick={() => setShowForm(!showForm)} className="gap-2">
              <Plus className="w-4 h-4" />
              Novo Cliente
            </Button>
          </div>

          {/* Formulário de Novo Cliente */}
          {showForm && (
            <Card className="border-border bg-card mb-8">
              <CardHeader>
                <CardTitle>Adicionar Novo Cliente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground">Nome *</label>
                    <Input
                      placeholder="Nome completo"
                      value={formData.nome}
                      onChange={(e) =>
                        setFormData({ ...formData, nome: e.target.value })
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
                          setFormData({ ...formData, telefone: e.target.value })
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground">E-mail</label>
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
                  <div className="flex gap-2">
                    <Button onClick={handleAddCliente}>Salvar Cliente</Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowForm(false);
                        setFormData({ nome: "", telefone: "", email: "" });
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
              placeholder="Buscar cliente por nome..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Lista de Clientes */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>
                Lista de Clientes ({clientesFiltrados.length})
              </CardTitle>
              <CardDescription>
                Clique para editar ou remover um cliente
              </CardDescription>
            </CardHeader>
            <CardContent>
              {clientesFiltrados.length > 0 ? (
                <div className="space-y-2">
                  {clientesFiltrados.map((cliente) => (
                    <div
                      key={cliente.id}
                      className="flex items-center justify-between p-4 bg-background rounded-lg border border-border hover:bg-muted transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{cliente.nome}</p>
                        <div className="text-sm text-muted-foreground space-x-3">
                          <span>{cliente.telefone}</span>
                          {cliente.email && <span>•</span>}
                          {cliente.email && <span>{cliente.email}</span>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(cliente.id)}
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
                    {busca ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}
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
