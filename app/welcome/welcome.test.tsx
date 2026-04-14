import React from 'react';
import { render, screen } from '@testing-library/react';
import { Welcome } from './welcome';

describe('Welcome', () => {
  it("renders the next steps text", () => {
    render(<Welcome />);
    expect(screen.getByText(/what's next\?/i)).toBeInTheDocument();
  });
});
