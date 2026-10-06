import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router';
import Home from './home';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('email sign-in focus', () => {
  it('focuses immediately when an asynchronous session check mounts the email field', async () => {
    let finishSession!: (_response: Response) => void;
    vi.stubGlobal(
      'fetch',
      vi.fn(
        () =>
          new Promise<Response>((resolve) => {
            finishSession = resolve;
          })
      )
    );
    // Initial focus must not depend on a frame being scheduled in an inactive tab.
    const frame = vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(1);
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    expect(screen.getByText('Vérification de la session…')).toBeInTheDocument();
    expect(screen.queryByLabelText('Adresse e-mail')).not.toBeInTheDocument();
    await act(async () => finishSession(new Response(null, { status: 401 })));

    expect(screen.getByLabelText('Adresse e-mail')).toHaveFocus();
    expect(frame).not.toHaveBeenCalled();
  });

  it('focuses the newly mounted email field after asynchronous logout', async () => {
    const user = userEvent.setup();
    let finishLogout!: (_response: Response) => void;
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({ player: { id: 'player-1', email: 'player@example.com' } })
      )
      .mockImplementationOnce(
        () =>
          new Promise<Response>((resolve) => {
            finishLogout = resolve;
          })
      );
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(1);
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    await user.click(await screen.findByRole('button', { name: 'Déconnexion' }));
    expect(screen.queryByLabelText('Adresse e-mail')).not.toBeInTheDocument();
    await act(async () => finishLogout(new Response(null, { status: 204 })));

    expect(fetchMock).toHaveBeenLastCalledWith('/api/session', { method: 'DELETE' });
    expect(screen.getByLabelText('Adresse e-mail')).toHaveFocus();
  });

  it('focuses the Bootstrap email field after checking the session and on window activation', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 401 })));
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    const email = await screen.findByLabelText('Adresse e-mail');
    await waitFor(() => expect(email).toHaveFocus());
    expect(email).toHaveClass('form-control');

    const visibility = vi.spyOn(document, 'visibilityState', 'get');
    visibility.mockReturnValue('hidden');
    email.blur();
    expect(email).not.toHaveFocus();
    visibility.mockReturnValue('visible');
    window.dispatchEvent(new Event('focus'));
    expect(email).toHaveFocus();

    const button = screen.getByRole('button', { name: 'Continuer avec cet e-mail' });
    button.focus();
    window.dispatchEvent(new Event('focus'));
    expect(button).toHaveFocus();
  });

  it('restores focus on document visibility and page restoration, but not while hidden', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 401 })));
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );
    const email = await screen.findByLabelText('Adresse e-mail');
    await waitFor(() => expect(email).toHaveFocus());
    const visibility = vi.spyOn(document, 'visibilityState', 'get');

    visibility.mockReturnValue('hidden');
    expect(document.visibilityState).toBe('hidden');
    // jsdom emits window focus when blur returns focus to the document.
    // Mark the document hidden first to model switching away from the tab.
    email.blur();
    expect(email).not.toHaveFocus();
    fireEvent(document, new Event('visibilitychange'));
    fireEvent(window, new Event('focus'));
    expect(email).not.toHaveFocus();

    visibility.mockReturnValue('visible');
    fireEvent(document, new Event('visibilitychange'));
    expect(email).toHaveFocus();
    visibility.mockReturnValue('hidden');
    email.blur();
    expect(email).not.toHaveFocus();
    visibility.mockReturnValue('visible');
    fireEvent(window, new Event('pageshow'));
    expect(email).toHaveFocus();
  });

  it('preserves another active input on session completion and browser activation', async () => {
    let finishSession!: (_response: Response) => void;
    vi.stubGlobal(
      'fetch',
      vi.fn(
        () =>
          new Promise<Response>((resolve) => {
            finishSession = resolve;
          })
      )
    );
    render(
      <MemoryRouter>
        <input aria-label="Other input" />
        <Home />
      </MemoryRouter>
    );
    const otherInput = screen.getByLabelText('Other input');
    otherInput.focus();
    await act(async () => finishSession(new Response(null, { status: 401 })));

    expect(otherInput).toHaveFocus();
    fireEvent(window, new Event('focus'));
    fireEvent(document, new Event('visibilitychange'));
    fireEvent(window, new Event('pageshow'));
    expect(otherInput).toHaveFocus();
  });

  it('does not refocus or move the selection while typing or rerendering', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 401 })));
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );
    const email = await screen.findByLabelText('Adresse e-mail');
    await waitFor(() => expect(email).toHaveFocus());
    const focus = vi.spyOn(email, 'focus');

    await user.type(email, 'player@example.com');
    fireEvent(window, new Event('focus'));
    fireEvent(document, new Event('visibilitychange'));
    fireEvent(window, new Event('pageshow'));
    expect(email).toHaveValue('player@example.com');
    expect(focus).not.toHaveBeenCalled();
  });

  it('removes browser activation listeners when the home UI unmounts', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 401 })));
    const { unmount } = render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );
    const email = await screen.findByLabelText('Adresse e-mail');
    await waitFor(() => expect(email).toHaveFocus());
    const focus = vi.spyOn(email, 'focus');
    unmount();

    fireEvent(window, new Event('focus'));
    fireEvent(document, new Event('visibilitychange'));
    fireEvent(window, new Event('pageshow'));
    expect(focus).not.toHaveBeenCalled();
  });
});

describe('Bootstrap home UI', () => {
  it('announces session loading with a Bootstrap spinner', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise<Response>(() => {}))
    );
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('Vérification de la session…');
    expect(status.querySelector('.spinner-border')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByRole('banner')).toHaveClass('hstack');
  });

  it('announces game loading with a Bootstrap spinner', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(
          Response.json({ player: { id: 'player-1', email: 'player@example.com' } })
        )
        .mockImplementationOnce(() => new Promise<Response>(() => {}))
    );
    render(
      <MemoryRouter initialEntries={['/?game=game-1']}>
        <Home />
      </MemoryRouter>
    );
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('Chargement de la partie…')
    );
    expect(screen.getByRole('status').querySelector('.spinner-border')).toBeInTheDocument();
  });

  it('keeps labeled Bootstrap color controls and Mastermind history when submitting a guess', async () => {
    const user = userEvent.setup();
    const game = {
      id: 'game-1',
      maxAttempts: 10,
      attemptsUsed: 1,
      status: 'in_progress',
      guesses: [{ colors: ['red', 'blue', 'green', 'yellow'] }],
      feedbacks: [{ pegs: ['black', 'white'] }],
      createdAt: '2026-10-05T00:00:00.000Z',
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({ player: { id: 'player-1', email: 'player@example.com' } })
      )
      .mockResolvedValueOnce(Response.json(game))
      .mockResolvedValueOnce(Response.json({}))
      .mockResolvedValueOnce(Response.json(game));
    vi.stubGlobal('fetch', fetchMock);
    render(
      <MemoryRouter initialEntries={['/?game=game-1']}>
        <Home />
      </MemoryRouter>
    );

    const select = await screen.findByRole('combobox', { name: 'Couleur 1' });
    expect(screen.getAllByRole('combobox')).toHaveLength(4);
    expect(select).toHaveClass('form-select');
    expect(select.closest('.input-group')).toBeInTheDocument();
    expect(screen.getByText('1 / 10')).toHaveClass('badge', 'bg-secondary');
    const history = screen.getByRole('list', { name: 'Propositions précédentes' });
    expect(history.querySelectorAll('.color-dot')).toHaveLength(4);
    expect(history.querySelectorAll('.feedback-dot')).toHaveLength(2);

    await user.selectOptions(select, 'purple');
    expect(select.closest('.input-group')?.querySelector('.color-purple')).toBeInTheDocument();
    const submit = screen.getByRole('button', { name: 'Proposer' });
    expect(submit).toHaveClass('btn', 'btn-primary');
    await user.click(submit);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(4));
    expect(fetchMock).toHaveBeenNthCalledWith(3, '/api/games/game-1/guesses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ colors: ['purple', 'blue', 'green', 'yellow'] }),
    });
  });

  it('shows session failures as Bootstrap alerts and still focuses the email field', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(Response.json({ error: 'Session indisponible' }, { status: 500 }))
    );
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    expect(await screen.findByRole('alert')).toHaveClass('alert', 'alert-danger');
    expect(screen.getByRole('alert')).toHaveTextContent('Session indisponible');
    expect(screen.getByLabelText('Adresse e-mail')).toHaveFocus();
  });
});
