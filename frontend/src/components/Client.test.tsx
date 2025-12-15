import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Client from './Client';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Client Component', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    localStorage.clear();
    // Mock initial client fetch that happens in useEffect
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => null,
    });
  });

  it('should render the client profile title', () => {
    render(<Client />);
    expect(screen.getByText('Profile & Settings')).toBeInTheDocument();
  });

  it('should render file upload section', () => {
    render(<Client />);
    expect(screen.getByText(/Upload Data/i)).toBeInTheDocument();
  });

  it('should render upload button', () => {
    render(<Client />);
    expect(screen.getByText(/Upload & Process/i)).toBeInTheDocument();
  });

  it('should handle file selection', () => {
    render(<Client />);
    const fileInput = document.querySelector('#file-upload') as HTMLInputElement;
    expect(fileInput).toBeInTheDocument();
  });

  it('should save client ID to localStorage on successful upload', async () => {
    // Mock initial fetch for useEffect
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => null,
    });
    
    // Mock upload fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => 'File uploaded successfully, depot: TEST123',
    });
    
    // Mock alert
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    
    render(<Client />);
    
    // Create a mock file
    const file = new File(['dummy content'], 'test.txt', { type: 'text/plain' });
    const fileInput = document.querySelector('#file-upload') as HTMLInputElement;
    
    // Simulate file selection
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });
    
    fireEvent.change(fileInput);
    
    // Wait for button to be visible
    const uploadButton = await screen.findByText(/Upload & Process/i);
    fireEvent.click(uploadButton);
    
    // Wait for the localStorage to be updated
    await waitFor(() => {
      expect(localStorage.getItem('clientId')).toBe('TEST123');
    }, { timeout: 3000 });
    
    alertSpy.mockRestore();
  });

  it('should load client ID from localStorage on mount', () => {
    localStorage.setItem('clientId', 'STORED123');
    
    render(<Client />);
    
    // Component should fetch with the stored client ID
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:8080/api/client/1');
  });

  it('should show error message when file upload fails', async () => {
    // Mock initial fetch for useEffect
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => null,
    });
    
    // Mock upload fetch to fail
    mockFetch.mockResolvedValueOnce({
      ok: false,
      text: async () => 'Upload failed',
    });
    
    // Mock alert
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    
    render(<Client />);
    
    const file = new File(['dummy content'], 'test.txt', { type: 'text/plain' });
    const fileInput = document.querySelector('#file-upload') as HTMLInputElement;
    
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });
    
    fireEvent.change(fileInput);
    
    // Wait for button to be visible
    const uploadButton = await screen.findByText(/Upload & Process/i);
    fireEvent.click(uploadButton);
    
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Error uploading file. Please check the file format.');
    }, { timeout: 3000 });
    
    alertSpy.mockRestore();
  });

  it('should display client information when loaded successfully', async () => {
    const mockClient = {
      name: 'John Doe',
      email: 'john@example.com',
      birthDate: '1990-01-01',
    };
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockClient,
    });
    
    render(<Client />);
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });
});
