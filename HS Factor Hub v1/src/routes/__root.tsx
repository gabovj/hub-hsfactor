import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error("ROOT ERROR:", error);
  const router = useRouter();

  return (
    <div style={{ padding: '2rem', background: '#080C10', minHeight: '100vh', color: '#E2ECF4' }}>
      <h1 style={{ color: '#E24B4A' }}>Error en la aplicación</h1>
      <pre style={{ marginTop: '1rem', fontSize: '12px', color: '#fca5a5', whiteSpace: 'pre-wrap' }}>
        {error.message}
        {'\n'}
        {error.stack}
      </pre>
      <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
        <button
          onClick={() => { router.invalidate(); reset(); }}
          style={{ padding: '8px 16px', background: '#FE5915', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
        >
          Intentar de nuevo
        </button>
        <a href="/crm" style={{ padding: '8px 16px', border: '1px solid rgba(255,255,255,0.2)', color: '#E2ECF4', borderRadius: '6px', textDecoration: 'none' }}>
          Volver al CRM
        </a>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "HS Factor Hub" },
      { name: "description", content: "Plataforma interna de HS Factor — gestión del proceso comercial" },
      { name: "author", content: "Lovable" },
      { property: "og:title", content: "HS Factor Hub" },
      { property: "og:description", content: "Plataforma interna de HS Factor — gestión del proceso comercial" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@Lovable" },
      { name: "twitter:title", content: "HS Factor Hub" },
      { name: "twitter:description", content: "Plataforma interna de HS Factor — gestión del proceso comercial" },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/SByH53xh4oS5YcenyuUQWn1M2bu2/social-images/social-1779747343678-ChatGPT_Image_May_25,_2026,_05_15_34_PM.webp" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/SByH53xh4oS5YcenyuUQWn1M2bu2/social-images/social-1779747343678-ChatGPT_Image_May_25,_2026,_05_15_34_PM.webp" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  );
}
