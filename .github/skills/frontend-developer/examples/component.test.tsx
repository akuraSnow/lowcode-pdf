import { render, screen } from '@testing-library/react';
import React from 'react';
import MyComponent from '../../src/components/MyComponent';

test('renders main button', () => {
  render(<MyComponent />);
  expect(screen.getByRole('button')).toBeInTheDocument();
});
