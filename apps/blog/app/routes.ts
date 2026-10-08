import { index, route, type RouteConfig } from "@react-router/dev/routes";

export default [index("routes/home.tsx"), route("mapas", "routes/mapas.tsx")] satisfies RouteConfig;
