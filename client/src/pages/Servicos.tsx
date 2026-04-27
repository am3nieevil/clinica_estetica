import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Edit } from "lucide-react";
import Sidebar from "@/components/Sidebar";

interface Servico {
  id: string;
  nome: string;
  valor: number;
  duracao: number;
}

export default function Servicos() {
  const [servicos, setServicos] = useState<Servico[]>([
    { id: "1", nome: "Limpeza de Pele", valor: 150, duracao: 60 },
    { id: "2", nome: "Micropigmentação", valor: 500, duracao: 90 },
    { id: "3", nome: "Botox", valor: 400, duracao: 30 },
    { id: "4", nome: "Preenchimento Labial", valor: 350, duracao: 45 },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ nome: "", valor: "", duracao: "" });

  const handleAddServico = () => {
    if (formData.nome && formData.valor && formData.duracao) {
      setServicos([
        ...servicos,
        {
          id: Date.now().toString(),
          nome: formData.nome,
          valor: parseFloat(formData.valor),
          duracao: parseInt(formData.duracao),
        },
      ]);
      setFormData({ nome: "", valor: "", duracao: "" });
      setShowForm(false);
    }
  };

  const handleDelete = (id: string) => {
    setServicos(servicos.filter((s) => s.id !== id));
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-8 max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">Serviços</h1>
              <p className="text-muted-foreground">
                Gerencie seus procedimentos e preços
              </p>
            </div>
            <Button onClick={() => setShowForm(!showForm)} className="gap-2">
              <Plus className="w-4 h-4" />
              Novo Serviço
            </Button>
          </div>

          {/* Formulário de Novo Serviço */}
          {showForm && (
            <Card className="border-border bg-card mb-8">
              <CardHeader>
                <CardTitle>Adicionar Novo Serviço</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground">
                      Nome do Serviço *
                    </label>
                    <Input
                      placeholder="Ex: Limpeza de Pele"
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
                        Valor (R$) *
                      </label>
                      <Input
                        placeholder="150,00"
                        type="number"
                        step="0.01"
                        value={formData.valor}
                        onChange={(e) =>
                          setFormData({ ...formData, valor: e.target.value })
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground">
                        Duração (min) *
                      </label>
                      <Input
                        placeholder="60"
                        type="number"
                        value={formData.duracao}
                        onChange={(e) =>
                          setFormData({ ...formData, duracao: e.target.value })
                        }
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleAddServico}>Salvar Serviço</Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowForm(false);
                        setFormData({ nome: "", valor: "", duracao: "" });
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Lista de Serviços */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Lista de Serviços ({servicos.length})</CardTitle>
              <CardDescription>
                Seus procedimentos disponíveis para agendamento
              </CardDescription>
            </CardHeader>
            <CardContent>
              {servicos.length > 0 ? (
                <div className="space-y-2">
                  {servicos.map((servico) => (
                    <div
                      key={servico.id}
                      className="flex items-center justify-between p-4 bg-background rounded-lg border border-border hover:bg-muted transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{servico.nome}</p>
                        <div className="text-sm text-muted-foreground space-x-4">
                          <span>R$ {servico.valor.toFixed(2)}</span>
                          <span>•</span>
                          <span>{servico.duracao} minutos</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(servico.id)}
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
                    Nenhum serviço cadastrado
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
