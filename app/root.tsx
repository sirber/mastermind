import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from 'react-router';

import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Container from 'react-bootstrap/Container';
import type { Route } from './+types/root';
import 'bootstrap/dist/css/bootstrap.min.css';
import './app.css';

export const links: Route.LinksFunction = () => [
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap',
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
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
  let message = 'Une erreur est survenue';
  let details = 'Une erreur inattendue est survenue.';
  let stack: string | undefined;
  const notFound = isRouteErrorResponse(error) && error.status === 404;

  if (isRouteErrorResponse(error)) {
    message = notFound ? '404 — Page introuvable' : message;
    details = notFound ? 'La page demandée est introuvable.' : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <Container as="main" className="game-shell">
      <Card className="shadow-sm">
        <Card.Body className="p-3 p-sm-4">
          <Card.Title as="h1" className="h2 mb-3">
            {message}
          </Card.Title>
          <Alert variant={notFound ? 'warning' : 'danger'}>{details}</Alert>
          {stack && (
            <pre className="bg-body-tertiary rounded p-3 overflow-x-auto">
              <code>{stack}</code>
            </pre>
          )}
          <Button href="/" role="link" variant="primary">
            Retour à l’accueil
          </Button>
        </Card.Body>
      </Card>
    </Container>
  );
}
