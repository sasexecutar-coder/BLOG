import { BrainNetworkMap } from "../features/brain/BrainNetworkMap";
import type { Route } from "./+types/mapas";

export function meta(_: Route.MetaArgs) {
  return [{ title: "Mapa da Execução — Risco Cognitivo" }];
}

export default function Mapas() {
  return <BrainNetworkMap heading="Mapa da Execução" />;
}
