import { useEffect, useState } from 'react';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Spinner from 'react-bootstrap/Spinner';
import Table from 'react-bootstrap/Table';
import type { LeaderboardEntry } from '../application/contracts/LeaderboardEntry';

export function Leaderboard({ refreshKey }: { refreshKey: string }) {
  const [open, setOpen] = useState(false);
  const [revision, setRevision] = useState(0);
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    setError('');
    fetch('/api/leaderboard')
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error ?? 'Classement indisponible.');
        return body.entries as LeaderboardEntry[];
      })
      .then((ranking) => {
        if (active) setEntries(ranking);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Classement indisponible.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [open, revision, refreshKey]);

  return (
    <Card as="section" className="mt-4 shadow-sm" aria-labelledby="leaderboard-title">
      <Card.Body>
        <h2 id="leaderboard-title">Classement</h2>
        <p className="text-body-secondary">
          Joueurs inscrits : victoires décroissantes, puis moyenne des essais sur les victoires
          croissante. Égalités départagées par identifiant stable. Les victoires des invités ne
          comptent pas.
        </p>
        <Button
          variant="outline-primary"
          onClick={() => {
            if (open) setRevision((value) => value + 1);
            else setOpen(true);
          }}
          disabled={loading}
          aria-controls="leaderboard-results"
          aria-expanded={open}
        >
          {open ? 'Actualiser le classement' : 'Afficher le classement'}
        </Button>
        <div id="leaderboard-results" aria-live="polite" className="mt-3">
          {loading ? (
            <div role="status">
              <Spinner animation="border" size="sm" aria-hidden="true" /> Chargement du classement…
            </div>
          ) : error ? (
            <Alert variant="danger">{error}</Alert>
          ) : (
            entries &&
            (entries.length === 0 ? (
              <p>Aucune victoire enregistrée pour le moment.</p>
            ) : (
              <Table responsive striped aria-label="Classement des joueurs inscrits">
                <thead>
                  <tr>
                    <th scope="col">Rang</th>
                    <th scope="col">Joueur</th>
                    <th scope="col">Victoires</th>
                    <th scope="col">Essais moyens</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr key={entry.rank}>
                      <td>{entry.rank}</td>
                      <th scope="row">{entry.displayName}</th>
                      <td>{entry.wins}</td>
                      <td>
                        {entry.averageGuesses.toLocaleString('fr-FR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            ))
          )}
        </div>
      </Card.Body>
    </Card>
  );
}
