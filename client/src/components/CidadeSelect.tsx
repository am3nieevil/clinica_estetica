import { useState, useMemo, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search, X, MapPin, ChevronDown } from "lucide-react";
import { OPCOES_CIDADES } from "@/lib/cidades_br";

type CidadeSelectProps = {
  value?: { uf: string; cidade: string } | null;
  onChange: (value: { uf: string; cidade: string } | null) => void;
  placeholder?: string;
  disabled?: boolean;
};

export function CidadeSelect({
  value,
  onChange,
  placeholder = "Selecione a cidade...",
  disabled = false,
}: CidadeSelectProps) {
  const [open, setOpen] = useState(false);
  const [busca, setBusca] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fecha ao clicar fora
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setBusca("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Foca no input ao abrir
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const opcoesFiltradas = useMemo(() => {
    const q = busca.toLowerCase().trim();
    if (!q) {
      // Sem busca: mostra as 100 primeiras (ordenadas por UF)
      return OPCOES_CIDADES.slice(0, 100);
    }
    return OPCOES_CIDADES.filter(
      (o) =>
        o.cidade.toLowerCase().includes(q) ||
        o.uf.toLowerCase() === q
    ).slice(0, 150);
  }, [busca]);

  const labelSelecionado = value ? `${value.uf} — ${value.cidade}` : null;

  return (
    <div ref={containerRef} className="relative">
      {/* Botão de seleção */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            setOpen((prev) => !prev);
            setBusca("");
          }
        }}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-sm border rounded-md bg-background transition-colors text-left
          ${disabled ? "opacity-50 cursor-not-allowed" : "hover:border-primary/50 cursor-pointer"}
          ${open ? "border-primary ring-1 ring-primary" : "border-input"}
        `}
      >
        <span className={`flex items-center gap-2 flex-1 min-w-0 ${!labelSelecionado ? "text-muted-foreground" : ""}`}>
          <MapPin className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
          <span className="truncate">{labelSelecionado ?? placeholder}</span>
        </span>
        <div className="flex items-center gap-1 flex-shrink-0">
          {value && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.stopPropagation();
                  onChange(null);
                }
              }}
              className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-popover border border-border rounded-md shadow-lg overflow-hidden">
          {/* Campo de busca */}
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                ref={inputRef}
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Digite o nome da cidade ou UF (ex: SP)..."
                className="pl-8 h-8 text-sm"
              />
            </div>
          </div>

          {/* Lista de opções */}
          <div className="max-h-64 overflow-y-auto">
            {opcoesFiltradas.length === 0 ? (
              <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                Nenhuma cidade encontrada para "{busca}".
              </div>
            ) : (
              <>
                {opcoesFiltradas.map((opcao) => {
                  const selecionado = value?.uf === opcao.uf && value?.cidade === opcao.cidade;
                  return (
                    <button
                      key={`${opcao.uf}-${opcao.cidade}`}
                      type="button"
                      onClick={() => {
                        onChange({ uf: opcao.uf, cidade: opcao.cidade });
                        setOpen(false);
                        setBusca("");
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-left transition-colors hover:bg-accent hover:text-accent-foreground
                        ${selecionado ? "bg-primary/10 text-primary font-medium" : ""}
                      `}
                    >
                      <span className="text-xs font-mono font-semibold text-muted-foreground w-6 flex-shrink-0">
                        {opcao.uf}
                      </span>
                      <span className="flex-1 truncate">{opcao.cidade}</span>
                      {selecionado && (
                        <span className="w-4 h-4 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                          <span className="w-2 h-2 rounded-full bg-primary-foreground" />
                        </span>
                      )}
                    </button>
                  );
                })}
                <div className="px-3 py-2 text-xs text-muted-foreground text-center border-t border-border">
                  {busca
                    ? `${opcoesFiltradas.length} resultado${opcoesFiltradas.length !== 1 ? "s" : ""} — refine a busca para ver mais`
                    : "5.570 municípios disponíveis — digite para buscar"}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
