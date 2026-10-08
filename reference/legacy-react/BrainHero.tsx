// Mapa interativo da home (HOME-BRAIN-001): cérebro 3D pontilhado (Three.js, só depois da hidratação) com os 4
// seletores do esboço RC-HOME-002 sobre a figura e a explicação da função em HTML, fora do canvas.
// Sem JS, sem WebGL ou com falha do asset: a imagem estática, os seletores e os links do mapa continuam.
import { useEffect, useRef, useState, type KeyboardEvent } from "react";

import { Ban, ClipboardList, Database, Lightbulb, Pause, Play, RefreshCcw, RotateCcw, RotateCw, Target, TriangleAlert, type LucideIcon } from "lucide-react";

import type { BrainController, BrainTopic } from "./types";

import { HOME_MAP, type HomeFunction } from "@/data/home";
import { track } from "@/lib/analytics/track";

const ASSET_ID = "HOME-BRAIN-001";
const ICONS: Record<string, LucideIcon> = {
	"COG-PLANEJAMENTO": ClipboardList,
	"COG-MEMORIA-TRABALHO": Database,
	"COG-CONTROLE-INIBITORIO": Ban,
	"COG-FLEXIBILIDADE": RefreshCcw,
};
const ARROWS: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };

type Status = "loading" | "ready" | "fallback";
export type BrainFunction = HomeFunction & { topic?: BrainTopic };

export function BrainHero({ topics }: { topics: BrainTopic[] }) {
	const functions: BrainFunction[] = HOME_MAP.functions.map((f) => ({ ...f, topic: topics.find((t) => t.id === f.id) }));
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const controller = useRef<BrainController | null>(null);
	const selectors = useRef<(HTMLButtonElement | null)[]>([]);
	const pausedRef = useRef(true);
	const [paused, setPaused] = useState(true);
	const [status, setStatus] = useState<Status>("loading");
	const [attempt, setAttempt] = useState(0);
	const [selectedId, setSelectedId] = useState(HOME_MAP.defaultId);

	const updatePaused = (value: boolean) => {
		pausedRef.current = value;
		setPaused(value);
		controller.current?.setPaused(value);
	};

	// Movimento reduzido: a cena começa (e fica) parada até um comando explícito.
	useEffect(() => {
		const media = window.matchMedia("(prefers-reduced-motion: reduce)");
		const apply = () => updatePaused(media.matches);
		apply();
		media.addEventListener("change", apply);
		return () => media.removeEventListener("change", apply);
	}, []);

	useEffect(() => {
		const abort = new AbortController();
		let instance: BrainController | null = null;
		const fail = () => {
			if (abort.signal.aborted) return;
			instance?.dispose();
			controller.current = null;
			setStatus("fallback");
		};
		setStatus("loading");
		import("./brain-renderer.client")
			.then(({ createBrainRenderer }) =>
				createBrainRenderer(canvasRef.current!, {
					signal: abort.signal,
					paused: pausedRef.current,
					onDrag: () => {
						pausedRef.current = true;
						setPaused(true);
					},
					onError: fail,
				}),
			)
			.then((created) => {
				if (abort.signal.aborted) return created.dispose();
				instance = created;
				controller.current = created;
				created.setPaused(pausedRef.current);
				setStatus("ready");
			})
			.catch(fail);
		return () => {
			abort.abort();
			instance?.dispose();
			if (controller.current === instance) controller.current = null;
		};
	}, [attempt]);

	const select = (id: string) => {
		setSelectedId(id);
		updatePaused(true);
		track({ stage: "TOOL", action: "select", capability_id: id, asset_id: ASSET_ID });
	};
	// Setas percorrem os seletores e selecionam (como no esboço); Tab sai do grupo.
	const onSelectorKey = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
		const delta = ARROWS[event.key];
		if (!delta) return;
		event.preventDefault();
		const next = (index + delta + functions.length) % functions.length;
		selectors.current[next]?.focus();
		select(functions[next].id);
	};
	const rotate = (direction: number) => {
		updatePaused(true);
		controller.current?.rotate(direction);
	};

	return (
		<section id="mapa" className="home-map" aria-labelledby="mapa-titulo" data-home-section="Mapa" data-brain-status={status}>
			<header className="home-map-intro">
				<p className="hy-eyebrow">{HOME_MAP.eyebrow}</p>
				<h2 id="mapa-titulo">{HOME_MAP.heading}</h2>
				<p>{HOME_MAP.lead}</p>
			</header>

			<div className="brain-stage">
				<div className="brain-viewport">
					<img
						className="brain-poster"
						src="/models/home-brain/brain-poster.webp"
						width={1200}
						height={900}
						alt="Cérebro pontilhado em laranja, visto de lado, com os dois hemisférios, o cerebelo e o tronco."
						aria-hidden={status === "ready" ? true : undefined}
						decoding="async"
					/>
					<canvas key={attempt} ref={canvasRef} className="brain-canvas" aria-hidden="true" />
				</div>
				<div className="brain-markers" role="group" aria-label="Funções executivas">
					{functions.map((f, i) => {
						const Icon = ICONS[f.id] ?? Target;
						return (
							<button
								key={f.id}
								ref={(el) => {
									selectors.current[i] = el;
								}}
								type="button"
								className="brain-marker"
								data-side={f.marker.side}
								data-function={f.id}
								style={{ "--mx": `${f.marker.x}%`, "--my": `${f.marker.y}%` } as React.CSSProperties}
								aria-pressed={selectedId === f.id}
								aria-controls="brain-detail"
								tabIndex={selectedId === f.id ? 0 : -1}
								onClick={() => select(f.id)}
								onKeyDown={(e) => onSelectorKey(e, i)}
							>
								<span className="brain-marker-dot" aria-hidden="true">
									<Icon size={24} strokeWidth={1.8} />
								</span>
								<span className="brain-marker-label">
									<b>{f.label}</b>
									<small>{f.summary}</small>
								</span>
							</button>
						);
					})}
				</div>
			</div>
			<p className="home-map-note">{HOME_MAP.note}</p>

			<div className="brain-controls" role="group" aria-label="Controles do cérebro 3D">
				<button type="button" disabled={status !== "ready"} onClick={() => updatePaused(!paused)} aria-pressed={!paused}>
					{paused ? <Play size={16} aria-hidden="true" /> : <Pause size={16} aria-hidden="true" />}
					{paused ? "Girar" : "Pausar"}
				</button>
				<button type="button" disabled={status !== "ready"} onClick={() => rotate(-1)} aria-label="Girar o cérebro para a esquerda">
					<RotateCcw size={18} aria-hidden="true" />
				</button>
				<button type="button" disabled={status !== "ready"} onClick={() => rotate(1)} aria-label="Girar o cérebro para a direita">
					<RotateCw size={18} aria-hidden="true" />
				</button>
				<button
					type="button"
					disabled={status !== "ready"}
					onClick={() => {
						updatePaused(true);
						controller.current?.reset();
					}}
				>
					Restaurar vista
				</button>
			</div>
			<p className="brain-instruction">Arraste para girar. Selecione uma função para ver os detalhes.</p>
			<p className="brain-load-status" role="status">
				{status === "loading" ? "Carregando o cérebro 3D…" : status === "fallback" ? "O 3D está indisponível. Os seletores e o mapa continuam funcionando." : ""}
			</p>
			{status === "fallback" && (
				<button type="button" className="brain-retry" onClick={() => setAttempt((a) => a + 1)}>
					Tentar carregar o 3D novamente
				</button>
			)}

			<div id="brain-detail" className="brain-detail" aria-live="polite">
				<span className="brain-corner" data-corner="tl" aria-hidden="true" />
				<span className="brain-corner" data-corner="tr" aria-hidden="true" />
				<span className="brain-corner" data-corner="bl" aria-hidden="true" />
				<span className="brain-corner" data-corner="br" aria-hidden="true" />
				{functions.map((f) => (
					<FunctionDetail key={f.id} fn={f} hidden={f.id !== selectedId} />
				))}
			</div>
			<noscript>
				<ul className="brain-nojs-links">
					{functions.map((f) => (
						<li key={f.id}>
							<a href={f.topic?.href ?? "/mapas/"}>{f.label} no mapa</a>
						</li>
					))}
				</ul>
			</noscript>
		</section>
	);
}

function FunctionDetail({ fn, hidden }: { fn: BrainFunction; hidden: boolean }) {
	const rows: [LucideIcon, string, string][] = [
		[Target, "Demanda", fn.demand],
		[TriangleAlert, "Dificuldade possível", fn.difficulty],
		[Lightbulb, "Estratégia de apoio", fn.strategy],
	];
	const relations = fn.topic?.relations.slice(0, 3) ?? [];
	return (
		<article className="brain-detail-body" data-detail={fn.id} hidden={hidden}>
			<h3>
				Função selecionada: <strong>{fn.label}</strong>
			</h3>
			<dl>
				{rows.map(([Icon, term, text]) => (
					<div key={term}>
						<dt>
							<Icon size={26} strokeWidth={1.8} aria-hidden="true" />
							{term}:
						</dt>
						<dd>{text}</dd>
					</div>
				))}
			</dl>
			{relations.length > 0 && (
				<div className="brain-relations">
					<p>Relações registradas no mapa:</p>
					<ul>
						{relations.map((r) => (
							<li key={r.id}>{r.sentence}</li>
						))}
					</ul>
				</div>
			)}
			<a
				href={fn.topic?.href ?? "/mapas/"}
				className="brain-detail-link"
				onClick={() => track({ stage: "TOOL", action: "cta", capability_id: fn.id, asset_id: ASSET_ID })}
			>
				Explorar {fn.label.toLocaleLowerCase("pt-BR")} no mapa <span aria-hidden="true">›</span>
			</a>
		</article>
	);
}
