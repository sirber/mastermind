import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Leaderboard } from './Leaderboard';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('Leaderboard', () => {
  it('loads an accessible Bootstrap table on demand, without exposing emails', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({
        entries: [{ rank: 1, displayName: 'Joueur abc', wins: 3, averageGuesses: 2.5 }],
      })
    );
    vi.stubGlobal('fetch', fetchMock);
    render(<Leaderboard refreshKey="" />);
    expect(fetchMock).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Afficher le classement' }));
    expect(
      await screen.findByRole('table', { name: 'Classement des joueurs inscrits' })
    ).toHaveClass('table');
    expect(screen.getByText('Joueur abc')).toBeInTheDocument();
    expect(screen.getByText('2,50')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith('/api/leaderboard');
  });

  it('shows the empty state and explains that guest wins do not count', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ entries: [] })));
    render(<Leaderboard refreshKey="" />);
    await userEvent.click(screen.getByRole('button', { name: 'Afficher le classement' }));
    expect(
      await screen.findByText('Aucune victoire enregistrée pour le moment.')
    ).toBeInTheDocument();
    expect(screen.getByText(/Les victoires des invités ne comptent pas/)).toBeInTheDocument();
  });

  it('handles loading and errors and permits retrying', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error('Hors ligne'))
      .mockResolvedValueOnce(Response.json({ entries: [] }));
    vi.stubGlobal('fetch', fetchMock);
    render(<Leaderboard refreshKey="" />);
    await userEvent.click(screen.getByRole('button', { name: 'Afficher le classement' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Hors ligne');
    await userEvent.click(screen.getByRole('button', { name: 'Actualiser le classement' }));
    expect(
      await screen.findByText('Aucune victoire enregistrée pour le moment.')
    ).toBeInTheDocument();
  });

  it('announces loading and refreshes an open leaderboard when a game is won', async () => {
    let resolve!: (_response: Response) => void;
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise<Response>((finish) => {
            resolve = finish;
          })
      )
      .mockResolvedValueOnce(
        Response.json({
          entries: [{ rank: 1, displayName: 'Joueur abc', wins: 1, averageGuesses: 1 }],
        })
      );
    vi.stubGlobal('fetch', fetchMock);
    const { rerender } = render(<Leaderboard refreshKey="" />);
    await userEvent.click(screen.getByRole('button', { name: 'Afficher le classement' }));
    expect(screen.getByRole('status')).toHaveTextContent('Chargement du classement…');
    expect(screen.getByRole('status').querySelector('.spinner-border')).toBeInTheDocument();
    await act(async () => resolve(Response.json({ entries: [] })));
    expect(screen.getByText('Aucune victoire enregistrée pour le moment.')).toBeInTheDocument();
    rerender(<Leaderboard refreshKey="won-game" />);
    expect(await screen.findByText('Joueur abc')).toBeInTheDocument();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  });
});
