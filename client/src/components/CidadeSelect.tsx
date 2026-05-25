import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Search, X, MapPin, ChevronDown, Loader2 } from "lucide-react";

// ── Tipos da API IBGE ─────────────────────────────────────────────────────────
interface MunicipioIBGE {
  id: number;
  nome: string;
  microrregiao?: {
    mesorregiao?: {
      UF?: {
        sigla: string;
      };
    };
  };
  "regiao-imediata"?: {
    "regiao-intermediaria"?: {
      UF?: {
        sigla: string;
      };
    };
  };
}

interface OpcaoCidade {
  id: number;
  uf: string;
  cidade: string;
  label: string;
}

// ── Cache global ──────────────────────────────────────────────────────────────
let todosOsMunicipios: OpcaoCidade[] = [];
let carregando = false;
let carregado = false;
const listeners: Array<() => void> = [];

function getUF(m: MunicipioIBGE): string {
  return (
    m.microrregiao?.mesorregiao?.UF?.sigla ??
    m["regiao-imediata"]?.["regiao-intermediaria"]?.UF?.sigla ??
    "??"
  );
}

async function carregarTodosMunicipios(): Promise<void> {
  if (carregado || carregando) return;
  carregando = true;
  try {
    const res = await fetch(
      "https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome"
    );
    const data: MunicipioIBGE[] = await res.json();
    todosOsMunicipios = data.map((m) => {
      const uf = getUF(m);
      return { id: m.id, uf, cidade: m.nome, label: `${uf} — ${m.nome}` };
    });
    carregado = true;
    listeners.forEach((fn) => fn());
    listeners.length = 0;
  } finally {
    carregando = false;
  }
}

function useMunicipios() {
  const [pronto, setPronto] = useState(carregado);

  useEffect(() => {
    if (carregado) {
      setPronto(true);
      return;
    }
    const fn = () => setPronto(true);
    listeners.push(fn);
    carregarTodosMunicipios();
    return () => {
      const idx = listeners.indexOf(fn);
      if (idx !== -1) listeners.splice(idx, 1);
    };
  }, []);

  return { municipios: todosOsMunicipios, pronto };
}

// ── Props ─────────────────────────────────────────────────────────────────────
type CidadeSelectProps = {
  value?: { uf: string; cidade: string } | null;
  onChange: (value: { uf: string; cidade: string } | null) => void;
  placeholder?: string;
  disabled?: boolean;
};

// ── Componente ────────────────────────────────────────────────────────────────
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
  const { municipios, pronto } = useMunicipios();

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

  // Inicia o carregamento assim que o componente montar (prefetch)
  useEffect(() => {
    carregarTodosMunicipios();
  }, []);

  const opcoesFiltradas = useCallback((): OpcaoCidade[] => {
    const q = busca.trim().toLowerCase();
    if (!q) return municipios.slice(0, 80);
    return municipios
      .filter(
        (o) =>
          o.cidade.toLowerCase().includes(q) ||
          o.uf.toLowerCase() === q
      )
      .slice(0, 120);
  }, [busca, municipios])();

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
                placeholder="Digite o nome da cidade ou a sigla do estado..."
                className="pl-8 h-8 text-sm"
              />
            </div>
          </div>

          {/* Lista */}
          <div className="max-h-64 overflow-y-auto">
            {!pronto ? (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" /> Carregando municípios...
              </div>
            ) : opcoesFiltradas.length === 0 ? (
              <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                Nenhuma cidade encontrada para "{busca}".
              </div>
            ) : (
              opcoesFiltradas.map((opcao) => {
                const selecionado =
                  value?.uf === opcao.uf && value?.cidade === opcao.cidade;
                return (
                  <button
                    key={opcao.id}
                    type="button"
                    onClick={() => {
                      onChange({ uf: opcao.uf, cidade: opcao.cidade });
                      setOpen(false);
                      setBusca("");
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors hover:bg-accent hover:text-accent-foreground
                      ${selecionado ? "bg-primary/10 text-primary font-medium" : ""}
                    `}
                  >
                    <span className="text-xs font-mono font-semibold text-muted-foreground w-7 flex-shrink-0">
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
              })
            )}
          </div>

          {/* Rodapé */}
          {pronto && (
            <div className="px-3 py-1.5 text-xs text-muted-foreground text-center border-t border-border">
              {busca.trim()
                ? `${opcoesFiltradas.length} resultado${opcoesFiltradas.length !== 1 ? "s" : ""} — refine para ver mais`
                : `${municipios.length.toLocaleString("pt-BR")} municípios disponíveis • fonte: IBGE`}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
