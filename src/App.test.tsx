import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders chatbot app', () => {
  render(<App />);
  const buttonElement = screen.getByText(/Start Recording/i);
  expect(buttonElement).toBeInTheDocument();
});
