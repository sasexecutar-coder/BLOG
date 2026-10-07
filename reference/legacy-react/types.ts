// Contratos serializáveis da experiência 3D da home (HOME-BRAIN-001).

/** Projeção de um nó COGNITIVE_CAPACITY do grafo para a home: rótulo, link do mapa, relações e fontes. */
export type BrainTopic = {
	id: string;
	label: string;
	href: string;
	relations: { id: string; sentence: string; inferred: boolean }[];
	sources: { id: string; label: string }[];
};

/** O que a interface pede à cena; a cena é dona de frames, listeners e recursos da GPU. */
export type BrainController = {
	setPaused: (paused: boolean) => void;
	rotate: (direction: number) => void;
	reset: () => void;
	dispose: () => void;
};
