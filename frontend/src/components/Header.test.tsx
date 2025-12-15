import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Header from './Header';

// Helper to render with router
const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('Header Component', () => {
  it('should render the TradeApp logo', () => {
    renderWithRouter(<Header />);
    expect(screen.getByText('TradeApp')).toBeInTheDocument();
  });

  it('should render Portfolio navigation link', () => {
    renderWithRouter(<Header />);
    const portfolioLink = screen.getByText('Portfolio');
    expect(portfolioLink).toBeInTheDocument();
    expect(portfolioLink.closest('a')).toHaveAttribute('href', '/');
  });

  it('should render History navigation link', () => {
    renderWithRouter(<Header />);
    const historyLink = screen.getByText('History');
    expect(historyLink).toBeInTheDocument();
    expect(historyLink.closest('a')).toHaveAttribute('href', '/history');
  });

  it('should render Profile navigation link', () => {
    renderWithRouter(<Header />);
    const profileLink = screen.getByText('Profile');
    expect(profileLink).toBeInTheDocument();
    expect(profileLink.closest('a')).toHaveAttribute('href', '/client');
  });

  it('should have proper styling classes', () => {
    renderWithRouter(<Header />);
    const header = screen.getByRole('banner');
    expect(header).toHaveClass('bg-white', 'shadow-sm');
  });

  it('should render all three navigation icons', () => {
    const { container } = renderWithRouter(<Header />);
    // Check that SVG icons are present (heroicons render as SVGs)
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThanOrEqual(3);
  });
});
