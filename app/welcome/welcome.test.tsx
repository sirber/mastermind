import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Welcome } from './welcome';

afterEach(cleanup);

describe('Welcome', () => {
  it('renders French project resources in a Bootstrap card and navigation', () => {
    render(<Welcome />);
    expect(screen.getByRole('main')).toHaveClass('container');
    expect(screen.getByRole('heading', { name: 'Ressources du projet' })).toHaveClass('card-title');
    expect(screen.getByRole('navigation', { name: 'Ressources du projet' })).toHaveClass(
      'list-group'
    );
    const links = screen.getAllByRole('link');
    expect(links.map((link) => link.textContent)).toEqual([
      'Documentation React Router',
      'Documentation React Bootstrap',
      'Communauté React Router sur Discord',
    ]);
    for (const link of links) {
      expect(link).toHaveClass('list-group-item', 'list-group-item-action');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    }
    expect(links[0]).toHaveAttribute('href', 'https://reactrouter.com/docs');
    expect(links[1]).toHaveAttribute('href', 'https://react-bootstrap.github.io/');
    expect(links[2]).toHaveAttribute('href', 'https://rmx.as/discord');
  });
});
