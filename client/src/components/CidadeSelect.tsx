import { useState, useMemo, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search, X, MapPin, ChevronDown } from "lucide-react";

// Lista de cidades brasileiras por UF (principais cidades de cada estado)
const CIDADES_BR: { uf: string; estado: string; cidades: string[] }[] = [
  { uf: "AC", estado: "Acre", cidades: ["Rio Branco", "Cruzeiro do Sul", "Sena Madureira", "Tarauacá", "Feijó"] },
  { uf: "AL", estado: "Alagoas", cidades: ["Maceió", "Arapiraca", "Palmeira dos Índios", "Rio Largo", "Penedo", "União dos Palmares", "São Miguel dos Campos", "Delmiro Gouveia"] },
  { uf: "AM", estado: "Amazonas", cidades: ["Manaus", "Parintins", "Itacoatiara", "Manacapuru", "Coari", "Tefé", "Tabatinga", "Maués"] },
  { uf: "AP", estado: "Amapá", cidades: ["Macapá", "Santana", "Laranjal do Jari", "Oiapoque", "Mazagão"] },
  { uf: "BA", estado: "Bahia", cidades: ["Salvador", "Feira de Santana", "Vitória da Conquista", "Camaçari", "Juazeiro", "Itabuna", "Lauro de Freitas", "Ilhéus", "Jequié", "Teixeira de Freitas", "Barreiras", "Alagoinhas", "Porto Seguro", "Simões Filho", "Paulo Afonso", "Eunápolis", "Santo Antônio de Jesus", "Valença", "Senhor do Bonfim", "Jacobina"] },
  { uf: "CE", estado: "Ceará", cidades: ["Fortaleza", "Caucaia", "Juazeiro do Norte", "Maracanaú", "Sobral", "Crato", "Itapipoca", "Maranguape", "Iguatu", "Quixadá", "Pacatuba", "Canindé", "Aquiraz", "Crateús", "Russas"] },
  { uf: "DF", estado: "Distrito Federal", cidades: ["Brasília", "Ceilândia", "Taguatinga", "Samambaia", "Planaltina", "Gama", "Sobradinho", "Recanto das Emas", "Guará", "Santa Maria"] },
  { uf: "ES", estado: "Espírito Santo", cidades: ["Vitória", "Serra", "Vila Velha", "Cariacica", "Cachoeiro de Itapemirim", "Linhares", "São Mateus", "Colatina", "Guarapari", "Aracruz"] },
  { uf: "GO", estado: "Goiás", cidades: ["Goiânia", "Aparecida de Goiânia", "Anápolis", "Rio Verde", "Luziânia", "Águas Lindas de Goiás", "Valparaíso de Goiás", "Trindade", "Formosa", "Novo Gama", "Senador Canedo", "Catalão", "Jataí", "Planaltina", "Itumbiara"] },
  { uf: "MA", estado: "Maranhão", cidades: ["São Luís", "Imperatriz", "São José de Ribamar", "Timon", "Caxias", "Codó", "Paço do Lumiar", "Açailândia", "Bacabal", "Balsas"] },
  { uf: "MG", estado: "Minas Gerais", cidades: ["Belo Horizonte", "Uberlândia", "Contagem", "Juiz de Fora", "Betim", "Montes Claros", "Ribeirão das Neves", "Uberaba", "Governador Valadares", "Ipatinga", "Sete Lagoas", "Divinópolis", "Santa Luzia", "Ibirité", "Poços de Caldas", "Patos de Minas", "Pouso Alegre", "Teófilo Otoni", "Barbacena", "Sabará", "Varginha", "Conselheiro Lafaiete", "Lavras", "Itabira", "Coronel Fabriciano"] },
  { uf: "MS", estado: "Mato Grosso do Sul", cidades: ["Campo Grande", "Dourados", "Três Lagoas", "Corumbá", "Ponta Porã", "Naviraí", "Nova Andradina", "Aquidauana", "Paranaíba", "Sidrolândia"] },
  { uf: "MT", estado: "Mato Grosso", cidades: ["Cuiabá", "Várzea Grande", "Rondonópolis", "Sinop", "Tangará da Serra", "Cáceres", "Sorriso", "Lucas do Rio Verde", "Primavera do Leste", "Barra do Garças"] },
  { uf: "PA", estado: "Pará", cidades: ["Belém", "Ananindeua", "Santarém", "Marabá", "Parauapebas", "Castanhal", "Abaetetuba", "Cametá", "Bragança", "Altamira", "Itaituba", "Tucuruí"] },
  { uf: "PB", estado: "Paraíba", cidades: ["João Pessoa", "Campina Grande", "Santa Rita", "Patos", "Bayeux", "Sousa", "Cajazeiras", "Cabedelo", "Guarabira", "Sapé"] },
  { uf: "PE", estado: "Pernambuco", cidades: ["Recife", "Caruaru", "Olinda", "Petrolina", "Jaboatão dos Guararapes", "Paulista", "Cabo de Santo Agostinho", "Camaragibe", "Garanhuns", "Vitória de Santo Antão", "Igarassu", "São Lourenço da Mata", "Santa Cruz do Capibaribe", "Abreu e Lima", "Ipojuca"] },
  { uf: "PI", estado: "Piauí", cidades: ["Teresina", "Parnaíba", "Picos", "Piripiri", "Floriano", "Campo Maior", "Barras", "União", "Altos", "Oeiras"] },
  { uf: "PR", estado: "Paraná", cidades: ["Curitiba", "Londrina", "Maringá", "Ponta Grossa", "Cascavel", "São José dos Pinhais", "Foz do Iguaçu", "Colombo", "Guarapuava", "Paranaguá", "Araucária", "Toledo", "Apucarana", "Pinhais", "Campo Largo", "Almirante Tamandaré", "Umuarama", "Piraquara", "Cambé", "Fazenda Rio Grande"] },
  { uf: "RJ", estado: "Rio de Janeiro", cidades: ["Rio de Janeiro", "São Gonçalo", "Duque de Caxias", "Nova Iguaçu", "Niterói", "Belford Roxo", "São João de Meriti", "Campos dos Goytacazes", "Petrópolis", "Volta Redonda", "Magé", "Itaboraí", "Macaé", "Mesquita", "Nova Friburgo", "Barra Mansa", "Nilópolis", "Angra dos Reis", "Teresópolis", "Cabo Frio"] },
  { uf: "RN", estado: "Rio Grande do Norte", cidades: ["Natal", "Mossoró", "Parnamirim", "São Gonçalo do Amarante", "Ceará-Mirim", "Caicó", "Macaíba", "Açu", "Currais Novos", "Santa Cruz"] },
  { uf: "RO", estado: "Rondônia", cidades: ["Porto Velho", "Ji-Paraná", "Ariquemes", "Vilhena", "Cacoal", "Rolim de Moura", "Guajará-Mirim", "Jaru", "Ouro Preto do Oeste"] },
  { uf: "RR", estado: "Roraima", cidades: ["Boa Vista", "Caracaraí", "Rorainópolis", "Alto Alegre", "Mucajaí"] },
  { uf: "RS", estado: "Rio Grande do Sul", cidades: ["Porto Alegre", "Caxias do Sul", "Pelotas", "Canoas", "Santa Maria", "Gravataí", "Viamão", "Novo Hamburgo", "São Leopoldo", "Rio Grande", "Alvorada", "Passo Fundo", "Sapucaia do Sul", "Uruguaiana", "Santa Cruz do Sul", "Cachoeirinha", "Bagé", "Bento Gonçalves", "Erechim", "Guaíba"] },
  { uf: "SC", estado: "Santa Catarina", cidades: ["Florianópolis", "Joinville", "Blumenau", "São José", "Chapecó", "Itajaí", "Criciúma", "Jaraguá do Sul", "Palhoça", "Lages", "Balneário Camboriú", "Brusque", "Tubarão", "São Bento do Sul", "Caçador", "Concórdia", "Araranguá", "Navegantes", "Camboriú", "Rio do Sul"] },
  { uf: "SE", estado: "Sergipe", cidades: ["Aracaju", "Nossa Senhora do Socorro", "Lagarto", "Itabaiana", "São Cristóvão", "Estância", "Tobias Barreto", "Nossa Senhora das Dores", "Simão Dias"] },
  { uf: "SP", estado: "São Paulo", cidades: ["São Paulo", "Guarulhos", "Campinas", "São Bernardo do Campo", "Santo André", "São José dos Campos", "Ribeirão Preto", "Osasco", "Sorocaba", "Mauá", "São José do Rio Preto", "Mogi das Cruzes", "Santos", "Diadema", "Jundiaí", "Piracicaba", "Carapicuíba", "Bauru", "Itaquaquecetuba", "São Vicente", "Franca", "Guarujá", "Taubaté", "Praia Grande", "Limeira", "Suzano", "Taboão da Serra", "Sumaré", "Barueri", "Embu das Artes", "São Carlos", "Indaiatuba", "Cotia", "Americana", "Marília", "Joinville", "Araraquara", "Jacareí", "Hortolândia", "Presidente Prudente"] },
  { uf: "TO", estado: "Tocantins", cidades: ["Palmas", "Araguaína", "Gurupi", "Porto Nacional", "Paraíso do Tocantins", "Colinas do Tocantins", "Guaraí", "Tocantinópolis"] },
];

// Expande para lista plana de opções
const OPCOES = CIDADES_BR.flatMap(({ uf, estado, cidades }) =>
  cidades.map((cidade) => ({ uf, estado, cidade, label: `${uf} — ${cidade}` }))
);

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
    if (!q) return OPCOES.slice(0, 80); // Mostra as primeiras 80 por padrão
    return OPCOES.filter(
      (o) =>
        o.cidade.toLowerCase().includes(q) ||
        o.uf.toLowerCase().includes(q) ||
        o.estado.toLowerCase().includes(q)
    ).slice(0, 80);
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
                placeholder="Buscar cidade ou estado..."
                className="pl-8 h-8 text-sm"
              />
            </div>
          </div>

          {/* Lista de opções */}
          <div className="max-h-56 overflow-y-auto">
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
                {!busca && (
                  <div className="px-3 py-2 text-xs text-muted-foreground text-center border-t border-border">
                    Digite para buscar mais cidades
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
