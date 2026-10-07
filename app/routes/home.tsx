import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router';
import Alert from 'react-bootstrap/Alert';
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import Spinner from 'react-bootstrap/Spinner';
import Stack from 'react-bootstrap/Stack';
import type { Route } from './+types/home';
import type { GameView } from '../application/contracts/GameView';
import type { Color } from '../domain/game/valueObjects/Color';
import { Leaderboard } from '../components/Leaderboard';

const colors: Color[] = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
const colorLabels: Record<Color, string> = {
  red: 'Rouge',
  blue: 'Bleu',
  green: 'Vert',
  yellow: 'Jaune',
  purple: 'Violet',
  orange: 'Orange',
};

interface PlayerIdentity {
  id: string;
  email: string | null;
}

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
  const [player, setPlayer] = useState<PlayerIdentity | null>(null);
  const [email, setEmail] = useState('');
  const [authLoading, setAuthLoading] = useState(true);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState('');
  const emailInputRef = useRef<HTMLInputElement>(null);

  const focusEmail = useCallback(() => {
    const input = emailInputRef.current;
    if (!input || document.visibilityState === 'hidden') return;

    const activeElement = document.activeElement;
    // Preserve typing, selection, and deliberate keyboard navigation elsewhere.
    if (
      activeElement === input ||
      activeElement?.closest(
        'input, textarea, select, button, a[href], [contenteditable]:not([contenteditable="false"]), [tabindex]:not([tabindex="-1"])'
      )
    )
      return;

    input.focus({ preventScroll: true });
  }, []);

  const attachEmailInput = useCallback(
    (input: HTMLInputElement | null) => {
      emailInputRef.current = input;
      // The field mounts only after session resolution or logout. Do not wait for
      // an animation frame, which browsers may suspend while the tab is inactive.
      if (input) focusEmail();
    },
    [focusEmail]
  );

  useEffect(() => {
    if (authLoading || player) return;

    const onWindowFocus = (event: FocusEvent) => {
      // Document/element focus events are not browser-window activation.
      if (event.target === event.currentTarget) focusEmail();
    };
    window.addEventListener('focus', onWindowFocus);
    window.addEventListener('pageshow', focusEmail);
    document.addEventListener('visibilitychange', focusEmail);
    return () => {
      window.removeEventListener('focus', onWindowFocus);
      window.removeEventListener('pageshow', focusEmail);
      document.removeEventListener('visibilitychange', focusEmail);
    };
  }, [authLoading, player, focusEmail]);

  useEffect(() => {
    let active = true;
    fetch('/api/session')
      .then(async (response) => {
        if (response.status === 401) return null;
        const body = await response.json();
        if (!response.ok) throw new Error(body.error ?? 'Impossible de vérifier la session.');
        return body.player as PlayerIdentity;
      })
      .then((identity) => {
        if (active) setPlayer(identity);
      })
      .catch((cause: unknown) => {
        if (active) setAuthError(cause instanceof Error ? cause.message : 'Erreur de session.');
      })
      .finally(() => {
        if (active) setAuthLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!gameId || !player) {
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
  }, [gameId, player]);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthBusy(true);
    setAuthError('');
    try {
      const response = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? 'Impossible de se connecter.');
      setPlayer(body.player as PlayerIdentity);
      setEmail('');
    } catch (cause) {
      setAuthError(cause instanceof Error ? cause.message : 'Erreur de connexion.');
    } finally {
      setAuthBusy(false);
    }
  }

  async function signOut() {
    setAuthBusy(true);
    setAuthError('');
    try {
      const response = await fetch('/api/session', { method: 'DELETE' });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? 'Impossible de se déconnecter.');
      }
      setPlayer(null);
      setGame(null);
      setError('');
      setSearchParams({});
    } catch (cause) {
      setAuthError(cause instanceof Error ? cause.message : 'Erreur de déconnexion.');
    } finally {
      setAuthBusy(false);
    }
  }

  async function playAsGuest() {
    setAuthBusy(true);
    setAuthError('');
    try {
      const response = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guest: true }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? 'Impossible de jouer en invité.');
      setPlayer(body.player as PlayerIdentity);
      await startGame();
    } catch (cause) {
      setAuthError(cause instanceof Error ? cause.message : 'Erreur de connexion.');
    } finally {
      setAuthBusy(false);
    }
  }

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
    <Container as="main" className="game-shell">
      <Stack as="header" direction="horizontal" gap={3} className="game-header flex-wrap mb-4">
        <div className="brand-mark" aria-hidden="true">
          M
        </div>
        <div>
          <p className="eyebrow">Jeu de déduction</p>
          <h1>Mastermind</h1>
        </div>
        {player && (
          <Stack gap={1} className="account-control align-items-end ms-auto">
            <span>{player.email ?? 'Invité'}</span>
            <Button
              variant="link"
              size="sm"
              className="p-0"
              onClick={signOut}
              type="button"
              disabled={authBusy || busy}
            >
              Déconnexion
            </Button>
          </Stack>
        )}
      </Stack>

      <Card as="section" className="game-panel shadow-sm" aria-live="polite">
        <Card.Body className="p-3 p-sm-4">
          {authLoading ? (
            <Stack direction="horizontal" gap={2} role="status" className="loading-state">
              <Spinner animation="border" size="sm" aria-hidden="true" />
              <span>Vérification de la session…</span>
            </Stack>
          ) : !player ? (
            <div className="welcome-panel">
              <p className="eyebrow">Avec ou sans compte</p>
              <h2>Entrez dans la partie.</h2>
              <p className="text-body-secondary my-3">
                Jouez sans e-mail, ou connectez-vous pour participer au classement.
              </p>
              <Button
                variant="outline-primary"
                className="mb-3"
                onClick={playAsGuest}
                disabled={authBusy}
              >
                Jouer sans e-mail
              </Button>
              <Form className="login-form" onSubmit={signIn}>
                <Form.Group controlId="login-email" className="mb-3">
                  <Form.Label>Adresse e-mail</Form.Label>
                  <Form.Control
                    name="email"
                    type="email"
                    ref={attachEmailInput}
                    autoComplete="email"
                    required
                    maxLength={254}
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </Form.Group>
                <Button variant="primary" type="submit" disabled={authBusy}>
                  {authBusy ? 'Connexion…' : 'Continuer avec cet e-mail'}
                </Button>
              </Form>
              <p className="text-body-secondary small mt-3 mb-0">
                Cette version ne vérifie pas que vous contrôlez cette adresse e-mail.
              </p>
              {authError && (
                <Alert variant="danger" className="mt-3">
                  {authError}
                </Alert>
              )}
            </div>
          ) : !gameId ? (
            <div className="welcome-panel">
              <p className="eyebrow">À vous de jouer</p>
              <h2>Décodez la combinaison secrète.</h2>
              <p className="text-body-secondary my-3">
                Choisissez quatre couleurs. Les pions noirs indiquent une bonne couleur bien placée;
                les blancs, une bonne couleur mal placée.
              </p>
              <Button variant="primary" onClick={startGame} disabled={busy}>
                {busy ? 'Démarrage…' : 'Nouvelle partie'}
              </Button>
            </div>
          ) : !game ? (
            <Stack direction="horizontal" gap={2} role="status" className="loading-state">
              <Spinner animation="border" size="sm" aria-hidden="true" />
              <span>Chargement de la partie…</span>
            </Stack>
          ) : (
            <>
              <Stack
                direction="horizontal"
                gap={3}
                className="game-topline justify-content-between flex-wrap"
              >
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
                <Badge bg="secondary" pill className="text-nowrap">
                  {game.attemptsUsed} / {game.maxAttempts}
                </Badge>
              </Stack>

              {game.status === 'in_progress' && (
                <Form
                  className="d-flex align-items-center gap-2 flex-wrap my-4"
                  onSubmit={submitGuess}
                >
                  {guess.map((color, index) => (
                    <Form.Group
                      className="color-field"
                      controlId={`guess-color-${index}`}
                      key={index}
                    >
                      <Form.Label className="visually-hidden">Couleur {index + 1}</Form.Label>
                      <InputGroup>
                        <InputGroup.Text>
                          <span className={`color-dot color-${color}`} aria-hidden="true" />
                        </InputGroup.Text>
                        <Form.Select
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
                        </Form.Select>
                      </InputGroup>
                    </Form.Group>
                  ))}
                  <Button variant="primary" type="submit" className="submit-button" disabled={busy}>
                    {busy ? 'Vérification…' : 'Proposer'}
                  </Button>
                </Form>
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
                  <Button
                    variant="outline-primary"
                    className="mt-4"
                    onClick={startGame}
                    disabled={busy}
                  >
                    Rejouer
                  </Button>
                </>
              )}
            </>
          )}
          {error && player && (
            <Alert variant="danger" className="mt-3">
              {error}
            </Alert>
          )}
          {authError && player && (
            <Alert variant="danger" className="mt-3">
              {authError}
            </Alert>
          )}
        </Card.Body>
      </Card>
      {player?.email === null && (
        <p className="text-body-secondary small mt-3">
          Mode invité : vos victoires ne comptent pas au classement. Votre accès dépend de ce
          navigateur et expire après 30 jours. Déconnexion ou suppression du cookie : accès perdu.
          Déconnectez-vous pour utiliser un e-mail; les parties invitées ne seront pas transférées.
        </p>
      )}
      <Leaderboard refreshKey={game?.status === 'won' ? game.id : ''} />
      <p className="game-footnote">Une combinaison de quatre couleurs, dix essais maximum.</p>
    </Container>
  );
}
