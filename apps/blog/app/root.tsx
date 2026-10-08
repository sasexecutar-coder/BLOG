import { isRouteErrorResponse, Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import type { Route } from "./+types/root";
import "../design-system/nocturne/styles.css";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <Meta />
        <Links />
      </head>
      <body style={{ margin: 0, background: "var(--color-bg)", color: "var(--color-text)", fontFamily: "var(--font-body)" }}>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Algo deu errado";
  let details = "Ocorreu um erro inesperado.";
  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "Página não encontrada" : "Erro";
    details = error.status === 404 ? "O endereço pedido não existe." : error.statusText || details;
  }
  return (
    <main style={{ padding: "var(--space-8)" }}>
      <h1>{message}</h1>
      <p>{details}</p>
    </main>
  );
}
