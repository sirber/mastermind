import { cleanup, render, screen } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Route } from './+types/root';
import { ErrorBoundary, Layout } from './root';

vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>();
  return {
    ...actual,
    Links: () => null,
    Meta: () => null,
    Scripts: () => null,
    ScrollRestoration: () => null,
  };
});

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

function renderError(error: unknown) {
  return render(<ErrorBoundary {...({ error } as Route.ErrorBoundaryProps)} />);
}

describe('Bootstrap app shell', () => {
  it('preserves the French document and viewport around its children', () => {
    const markup = renderToStaticMarkup(
      <Layout>
        <p>Contenu</p>
      </Layout>
    );
    expect(markup).toContain('<html lang="fr">');
    expect(markup).toContain('name="viewport" content="width=device-width, initial-scale=1"');
    expect(markup).toContain('<p>Contenu</p>');
  });

  it('renders a French Bootstrap not-found page with a home link', () => {
    renderError({ status: 404, statusText: 'Not Found', internal: true, data: null });
    expect(screen.getByRole('main')).toHaveClass('container');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Page introuvable');
    expect(screen.getByRole('alert')).toHaveClass('alert', 'alert-warning');
    expect(screen.getByRole('alert')).toHaveTextContent('La page demandée est introuvable.');
    expect(screen.getByRole('link', { name: 'Retour à l’accueil' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link')).toHaveClass('btn', 'btn-primary');
  });

  it('renders unexpected errors in French with Bootstrap styling', () => {
    renderError(null);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Une erreur est survenue');
    expect(screen.getByRole('alert')).toHaveClass('alert-danger');
    expect(screen.getByRole('alert')).toHaveTextContent('Une erreur inattendue est survenue.');
  });

  it('preserves route error details and development diagnostics', () => {
    const { unmount } = renderError({
      status: 503,
      statusText: 'Service indisponible',
      internal: true,
      data: null,
    });
    expect(screen.getByRole('alert')).toHaveTextContent('Service indisponible');
    unmount();
    const error = new Error('Diagnostic de développement');
    renderError(error);
    expect(screen.getByRole('alert')).toHaveTextContent(error.message);
    expect(screen.getByText(/Diagnostic de développement/, { selector: 'code' }).textContent).toBe(
      error.stack
    );
  });

  it('does not expose exception details or stack traces in production', () => {
    vi.stubEnv('DEV', false);
    renderError(new Error('Détail interne privé'));
    expect(screen.getByRole('alert')).toHaveTextContent('Une erreur inattendue est survenue.');
    expect(screen.queryByText(/Détail interne privé/)).not.toBeInTheDocument();
  });
});
