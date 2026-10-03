import { useEffect, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router';
import type { Route } from './+types/home';
import type { GameView } from '../application/contracts/GameView';
import type { Color } from '../domain/game/valueObjects/Color';

const colors: Color[] = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
const colorLabels: Record<Color, string> = {
  red: 'Rouge',
  blue: 'Bleu',
  green: 'Vert',
  yellow: 'Jaune',
  purple: 'Violet',
  orange: 'Orange',
};

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Mastermind' },
    { name: 'description', content: 'Jouez une partie de Mastermind.' },
  ];
}

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const gameId = searchParams.get('game');
  const [game, setGame] = useState<GameView | null>(null);
  const [guess, setGuess] = useState<Color[]>(['red', 'blue', 'green', 'yellow']);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!gameId) {
      setGame(null);
      return;
    }

    let active = true;
    fetch(`/api/games/${encodeURIComponent(gameId)}`)
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error ?? 'Impossible de charger la partie.');
        return body as GameView;
      })
      .then((loadedGame) => {
        if (active) {
          setGame(loadedGame);
          setError('');
        }
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Erreur de chargement.');
      });

    return () => {
      active = false;
    };
  }, [gameId]);

  async function startGame() {
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/games', { method: 'POST' });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? 'Impossible de démarrer la partie.');
      setSearchParams({ game: body.gameId });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Erreur au démarrage.');
    } finally {
      setBusy(false);
    }
  }

  async function submitGuess(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!gameId || !game || game.status !== 'in_progress') return;

    setBusy(true);
    setError('');
    try {
      const response = await fetch(`/api/games/${encodeURIComponent(gameId)}/guesses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ colors: guess }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? 'Impossible de soumettre la proposition.');
      const refreshed = await fetch(`/api/games/${encodeURIComponent(gameId)}`);
      const updatedGame = await refreshed.json();
      if (!refreshed.ok) throw new Error(updatedGame.error ?? 'Impossible de charger la partie.');
      setGame(updatedGame as GameView);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Erreur lors de la proposition.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="game-shell">
      <header className="game-header">
        <div className="brand-mark" aria-hidden="true">
          M
        </div>
        <div>
          <p className="eyebrow">Jeu de déduction</p>
          <h1>Mastermind</h1>
        </div>
      </header>

      <section className="game-panel" aria-live="polite">
        {!gameId ? (
          <div className="welcome-panel">
            <p className="eyebrow">À vous de jouer</p>
            <h2>Décodez la combinaison secrète.</h2>
            <p>
              Choisissez quatre couleurs. Les pions noirs indiquent une bonne couleur bien placée;
              les blancs, une bonne couleur mal placée.
            </p>
            <button className="primary-button" onClick={startGame} disabled={busy}>
              {busy ? 'Démarrage…' : 'Nouvelle partie'}
            </button>
          </div>
        ) : !game ? (
          <p className="loading-state">Chargement de la partie…</p>
        ) : (
          <>
            <div className="game-topline">
              <div>
                <p className="eyebrow">Partie en cours</p>
                <h2>
                  {game.status === 'won'
                    ? 'Combinaison trouvée !'
                    : game.status === 'lost'
                      ? 'Fin de la partie'
                      : 'Trouvez le code'}
                </h2>
              </div>
              <span className="attempt-counter">
                {game.attemptsUsed} / {game.maxAttempts}
              </span>
            </div>

            {game.status === 'in_progress' && (
              <form className="guess-form" onSubmit={submitGuess}>
                {guess.map((color, index) => (
                  <label className="color-field" key={index}>
                    <span className="sr-only">Couleur {index + 1}</span>
                    <select
                      aria-label={`Couleur ${index + 1}`}
                      value={color}
                      onChange={(event) =>
                        setGuess((previous) =>
                          previous.map((item, itemIndex) =>
                            itemIndex === index ? (event.target.value as Color) : item
                          )
                        )
                      }
                    >
                      {colors.map((option) => (
                        <option key={option} value={option}>
                          {colorLabels[option]}
                        </option>
                      ))}
                    </select>
                    <span className={`color-dot color-${color}`} aria-hidden="true" />
                  </label>
                ))}
                <button className="primary-button submit-button" disabled={busy}>
                  {busy ? 'Vérification…' : 'Proposer'}
                </button>
              </form>
            )}

            {game.guesses.length > 0 ? (
              <ol className="guess-history" aria-label="Propositions précédentes">
                {game.guesses.map((playedGuess, index) => (
                  <li className="guess-row" key={`${game.id}-${index}`}>
                    <span className="guess-number">{index + 1}</span>
                    <span className="guess-colors">
                      {playedGuess.colors.map((color, colorIndex) => (
                        <span
                          key={colorIndex}
                          className={`color-dot color-${color}`}
                          aria-label={colorLabels[color]}
                        />
                      ))}
                    </span>
                    <span className="feedback-pegs" aria-label="Résultat">
                      {game.feedbacks[index]?.pegs.map((peg, pegIndex) => (
                        <span key={pegIndex} className={`feedback-dot feedback-${peg}`} />
                      ))}
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="empty-history">Vos propositions apparaîtront ici.</p>
            )}

            {game.status !== 'in_progress' && (
              <>
                {game.status === 'lost' && game.solution && (
                  <p className="solution-message">
                    Le code était :{' '}
                    {game.solution.colors.map((color) => colorLabels[color]).join(' · ')}
                  </p>
                )}
                <button className="secondary-button" onClick={startGame} disabled={busy}>
                  Rejouer
                </button>
              </>
            )}
          </>
        )}
        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}
      </section>
      <p className="game-footnote">Une combinaison de quatre couleurs, dix essais maximum.</p>
    </main>
  );
}
