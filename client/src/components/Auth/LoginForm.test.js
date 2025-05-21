// File: client/src/components/Auth/LoginForm.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext'; // Import AuthProvider
import LoginForm from './LoginForm';

// Mock the useAuth hook
const mockLogin = jest.fn();
const mockNavigate = jest.fn();

// Mock react-router-dom's useNavigate
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'), // use actual for all non-hook parts
  useNavigate: () => mockNavigate,
}));

// Mock the context directly or provide a mock implementation
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
    // Add other context values if needed by the component
    loading: false,
    isAuthenticated: false,
    user: null,
  }),
   // Export the actual provider to wrap the component
  AuthProvider: ({ children }) => <>{children}</>,
}));


// Helper function to render with necessary providers
const renderLoginForm = () => {
  render(
    <BrowserRouter>
      {/* <AuthProvider> No need to wrap again if useAuth is fully mocked */}
         <LoginForm />
      {/* </AuthProvider> */}
    </BrowserRouter>
  );
};

describe('<LoginForm />', () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockLogin.mockClear();
    mockNavigate.mockClear();
     // localStorageMock.clear(); // Clear mock local storage if used
  });

  it('renders the login form correctly', () => {
    renderLoginForm();
    expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByText(/don't have an account\?/i)).toBeInTheDocument();
  });

  it('shows validation errors for empty fields on submit', async () => {
    renderLoginForm();
    const loginButton = screen.getByRole('button', { name: /login/i });

    fireEvent.click(loginButton);

    // Use findByText as error messages appear asynchronously after validation
    expect(await screen.findByText('Email is required.')).toBeInTheDocument();
    expect(await screen.findByText('Password is required.')).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled(); // Login function should not be called
  });

 it('shows validation error for invalid email format', async () => {
    renderLoginForm();
    const emailInput = screen.getByLabelText(/email/i);
    const loginButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.click(loginButton);

    expect(await screen.findByText('Please enter a valid email address.')).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('shows validation error for short password', async () => {
    renderLoginForm();
    const passwordInput = screen.getByLabelText(/password/i);
     const loginButton = screen.getByRole('button', { name: /login/i });


    fireEvent.change(passwordInput, { target: { value: 'short' } });
     fireEvent.click(loginButton);


    expect(await screen.findByText('Password must be at least 8 characters long.')).toBeInTheDocument();
     expect(mockLogin).not.toHaveBeenCalled();

  });


  it('calls login function with credentials on valid submit', async () => {
    // Mock successful login
    mockLogin.mockResolvedValueOnce({ success: true });
    renderLoginForm();

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const loginButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(loginButton);

    // Wait for the login function to be called
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledTimes(1);
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

     // Wait for navigation to happen after successful login
    await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/'); // Check if redirected to home
    });


  });

 it('displays server error message on failed login', async () => {
    // Mock failed login
    const errorMessage = 'Invalid credentials provided.';
    mockLogin.mockResolvedValueOnce({ success: false, message: errorMessage });
    renderLoginForm();


    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const loginButton = screen.getByRole('button', { name: /login/i });


    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(loginButton);


    // Wait for the error message to appear
    expect(await screen.findByText(errorMessage)).toBeInTheDocument();
     expect(mockNavigate).not.toHaveBeenCalled(); // Should not navigate on failure

  });


});