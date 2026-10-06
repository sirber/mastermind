import Card from 'react-bootstrap/Card';
import Container from 'react-bootstrap/Container';
import ListGroup from 'react-bootstrap/ListGroup';

export function Welcome() {
  return (
    <Container as="main" className="game-shell">
      <Card className="shadow-sm">
        <Card.Body className="p-3 p-sm-4">
          <Card.Title as="h1" id="resources-title" className="h2">
            Ressources du projet
          </Card.Title>
          <Card.Text className="text-body-secondary">
            Découvrez les outils utilisés pour construire Mastermind.
          </Card.Text>
          <ListGroup as="nav" aria-labelledby="resources-title">
            {resources.map(({ href, text }) => (
              <ListGroup.Item
                action
                href={href}
                key={href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {text}
              </ListGroup.Item>
            ))}
          </ListGroup>
        </Card.Body>
      </Card>
    </Container>
  );
}

const resources = [
  {
    href: 'https://reactrouter.com/docs',
    text: 'Documentation React Router',
  },
  {
    href: 'https://react-bootstrap.github.io/',
    text: 'Documentation React Bootstrap',
  },
  {
    href: 'https://rmx.as/discord',
    text: 'Communauté React Router sur Discord',
  },
];
