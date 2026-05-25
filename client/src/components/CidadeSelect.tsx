import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Search, X, MapPin, ChevronDown, Loader2 } from "lucide-react";

// ── Tipos da API IBGE ─────────────────────────────────────────────────────────
interface UF {
  id: number;
  sigla: string;
  nome: string;
}

interface Municipio {
  id: number;
  nome: string;
}

// ── Cache em memória para evitar requisições repetidas ────────────────────────
const cacheUFs: UF[] = [];
const cacheCidades: Record<string, Municipio[]> = {};

async function fetchUFs(): Promise<UF[]> {
  if (cacheUFs.length > 0) return cacheUFs;
  const res = await fetch(
    "https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome"
  );
  const data: UF[] = await res.json();
  cacheUFs.push(...data);
  return data;
}

async function fetchCidades(ufSigla: string): Promise<Municipio[]> {
  if (cacheCidades[ufSigla]) return cacheCidades[ufSigla];
  const res = await fetch(
    `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${ufSigla}/municipios?orderBy=nome`
  );
  const data: Municipio[] = await res.json();
  cacheCidades[ufSigla] = data;
  return data;
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
  const [etapa, setEtapa] = useState<"uf" | "cidade">("uf");
  const [busca, setBusca] = useState("");
  const [ufSelecionada, setUfSelecionada] = useState<UF | null>(null);

  const [ufs, setUfs] = useState<UF[]>([]);
  const [cidades, setCidades] = useState<Municipio[]>([]);
  const [loadingUFs, setLoadingUFs] = useState(false);
  const [loadingCidades, setLoadingCidades] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fecha ao clicar fora
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setBusca("");
        setEtapa("uf");
        setUfSelecionada(null);
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

  // Carrega UFs ao abrir
  useEffect(() => {
    if (open && ufs.length === 0) {
      setLoadingUFs(true);
      fetchUFs()
        .then(setUfs)
        .finally(() => setLoadingUFs(false));
    }
  }, [open, ufs.length]);

  // Carrega cidades ao selecionar UF
  const handleSelecionarUF = useCallback(async (uf: UF) => {
    setUfSelecionada(uf);
    setEtapa("cidade");
    setBusca("");
    setLoadingCidades(true);
    try {
      const data = await fetchCidades(uf.sigla);
      setCidades(data);
    } finally {
      setLoadingCidades(false);
    }
  }, []);

  const handleSelecionarCidade = (cidade: Municipio) => {
    if (!ufSelecionada) return;
    onChange({ uf: ufSelecionada.sigla, cidade: cidade.nome });
    setOpen(false);
    setBusca("");
    setEtapa("uf");
    setUfSelecionada(null);
  };

  const handleVoltar = () => {
    setEtapa("uf");
    setBusca("");
    setUfSelecionada(null);
    setCidades([]);
  };

  const ufsFiltradas = ufs.filter(
    (u) =>
      u.sigla.toLowerCase().includes(busca.toLowerCase()) ||
      u.nome.toLowerCase().includes(busca.toLowerCase())
  );

  const cidadesFiltradas = cidades.filter((c) =>
    c.nome.toLowerCase().includes(busca.toLowerCase())
  );

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
            setEtapa("uf");
            setUfSelecionada(null);
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
          {/* Cabeçalho com breadcrumb */}
          <div className="px-3 pt-2 pb-1 border-b border-border">
            {etapa === "cidade" && ufSelecionada ? (
              <div className="flex items-center gap-2 mb-2">
                <button
                  type="button"
                  onClick={handleVoltar}
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  ← Estados
                </button>
                <span className="text-xs text-muted-foreground">/</span>
                <span className="text-xs font-semibold">{ufSelecionada.sigla} — {ufSelecionada.nome}</span>
              </div>
            ) : null}
            {/* Campo de busca */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                ref={inputRef}
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder={etapa === "uf" ? "Buscar estado..." : "Buscar cidade..."}
                className="pl-8 h-8 text-sm"
              />
            </div>
          </div>

          {/* Lista */}
          <div className="max-h-64 overflow-y-auto">
            {/* Etapa: seleção de UF */}
            {etapa === "uf" && (
              <>
                {loadingUFs ? (
                  <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" /> Carregando estados...
                  </div>
                ) : ufsFiltradas.length === 0 ? (
                  <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                    Nenhum estado encontrado.
                  </div>
                ) : (
                  ufsFiltradas.map((uf) => (
                    <button
                      key={uf.id}
                      type="button"
                      onClick={() => handleSelecionarUF(uf)}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-left transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                      <span className="text-xs font-mono font-bold text-muted-foreground w-6 flex-shrink-0">
                        {uf.sigla}
                      </span>
                      <span className="flex-1 truncate">{uf.nome}</span>
                      <span className="text-muted-foreground text-xs">→</span>
                    </button>
                  ))
                )}
              </>
            )}

            {/* Etapa: seleção de cidade */}
            {etapa === "cidade" && (
              <>
                {loadingCidades ? (
                  <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" /> Carregando cidades...
                  </div>
                ) : cidadesFiltradas.length === 0 ? (
                  <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                    Nenhuma cidade encontrada para "{busca}".
                  </div>
                ) : (
                  cidadesFiltradas.map((cidade) => {
                    const selecionado =
                      value?.uf === ufSelecionada?.sigla && value?.cidade === cidade.nome;
                    return (
                      <button
                        key={cidade.id}
                        type="button"
                        onClick={() => handleSelecionarCidade(cidade)}
                        className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-left transition-colors hover:bg-accent hover:text-accent-foreground
                          ${selecionado ? "bg-primary/10 text-primary font-medium" : ""}
                        `}
                      >
                        <span className="flex-1 truncate">{cidade.nome}</span>
                        {selecionado && (
                          <span className="w-4 h-4 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                            <span className="w-2 h-2 rounded-full bg-primary-foreground" />
                          </span>
                        )}
                      </button>
                    );
                  })
                )}
              </>
            )}
          </div>

          {/* Rodapé informativo */}
          {etapa === "cidade" && !loadingCidades && (
            <div className="px-3 py-1.5 text-xs text-muted-foreground text-center border-t border-border">
              {cidadesFiltradas.length} cidade{cidadesFiltradas.length !== 1 ? "s" : ""} • fonte: IBGE
            </div>
          )}
        </div>
      )}
    </div>
  );
}
