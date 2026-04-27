import { useLocation } from "wouter";
import { Calendar, Users, Scissors, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Sidebar() {
  const [location, navigate] = useLocation();

  const navItems = [
    { href: "/", label: "Agenda", icon: Calendar },
    { href: "/clientes", label: "Clientes", icon: Users },
    { href: "/servicos", label: "Serviços", icon: Scissors },
  ];

  return (
    <div className="w-64 bg-card border-r border-border flex flex-col">
      {/* Logo/Header */}
      <div className="p-6 border-b border-border">
        <h2 className="text-2xl font-bold text-primary">Estética Pro</h2>
        <p className="text-xs text-muted-foreground mt-1">Sistema de Agendamento</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          return (
            <button
              key={item.href}
              onClick={() => navigate(item.href)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left",
                isActive
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-foreground hover:bg-muted"
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Action Button */}
      <div className="p-4 border-t border-border">
        <Button
          onClick={() => navigate("/agendamento")}
          className="w-full gap-2"
        >
          <Plus className="w-4 h-4" />
          Novo Agendamento
        </Button>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border text-xs text-muted-foreground">
        <p>Profissional: Ana Silva</p>
        <p className="mt-1">Sair</p>
      </div>
    </div>
  );
}
