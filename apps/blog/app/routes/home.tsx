import { BrainNetworkMap } from "../features/brain/BrainNetworkMap";
import type { Route } from "./+types/home";

export function meta(_: Route.MetaArgs) {
  return [{ title: "Entenda sua execução — Risco Cognitivo" }];
}

export default function Home() {
  return <BrainNetworkMap heading="Entenda sua execução" />;
}
