// HOME-BRAIN-001 — as 4 funções e os textos aprovados (docs/prompts/claude-design/nocturne/rodada-2-marcadores-callouts.md).
// As direções das âncoras (azimute em torno do eixo y, elevação) são **conceituais**: distribuem os 4 marcadores
// em volta do cérebro para que ao menos 2 fiquem visíveis em qualquer ângulo de giro. Elas NÃO afirmam que uma função
// "mora" naquela região — as funções executivas são redes distribuídas.

export type BrainFunctionId = "planejamento" | "controle-inibitorio" | "memoria-de-trabalho" | "flexibilidade";

export type BrainFunction = {
  id: BrainFunctionId;
  label: string;
  /** Texto exato aprovado. Não alterar. */
  text: string;
  /** Eixos de cena: x = anterior, y = superior, z = direita. Azimute em graus no plano xz (0° = anterior). */
  azimuthDeg: number;
  elevation: number;
  /** Ícone: nome do glifo em `BrainIcons`. */
  icon: "calendar" | "prohibit" | "squares" | "refresh";
};

export const BRAIN_FUNCTIONS: BrainFunction[] = [
  { id: "planejamento", label: "Planejamento", text: "Define metas, organiza passos e prioriza ações.", azimuthDeg: 20, elevation: 0.35, icon: "calendar" },
  { id: "controle-inibitorio", label: "Controle inibitório", text: "Ajuda a focar e evitar distrações.", azimuthDeg: 110, elevation: 0.1, icon: "prohibit" },
  { id: "memoria-de-trabalho", label: "Memória de trabalho", text: "Mantém e manipula informações no curto prazo.", azimuthDeg: 200, elevation: 0.3, icon: "squares" },
  { id: "flexibilidade", label: "Flexibilidade", text: "Permite adaptar estratégias e lidar com mudanças.", azimuthDeg: 290, elevation: 0.1, icon: "refresh" },
];

export const CONCEPTUAL_NOTICE = "Marcadores indicam acessos conceituais a redes distribuídas, não regiões clínicas exatas.";

export function anchorDirection(f: BrainFunction): [number, number, number] {
  const a = (f.azimuthDeg * Math.PI) / 180;
  return [Math.cos(a), f.elevation, Math.sin(a)];
}
