import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ErrorBoundary from '../../../components/Common/ErrorBoundary';

// Mock component that throws an error
const BuggyComponent = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>Working component</div>;
};

// Mock logger to prevent console noise during tests
jest.mock('../../../utils/logger', () => ({
  error: jest.fn()
}));

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // Clear console to keep test output clean
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('renders error page when child throws', () => {
    render(
      <BrowserRouter>
        <ErrorBoundary>
          <BuggyComponent shouldThrow={true} />
        </ErrorBoundary>
      </BrowserRouter>
    );

    expect(screen.getByText('Server Error')).toBeInTheDocument();
    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
  });

  it('renders custom fallback when provided', () => {
    const customFallback = (error, retry) => (
      <div>
        <h1>Custom Error UI</h1>
        <button onClick={retry}>Custom Retry</button>
      </div>
    );

    render(
      <ErrorBoundary fallback={customFallback}>
        <BuggyComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom Error UI')).toBeInTheDocument();
    expect(screen.getByText('Custom Retry')).toBeInTheDocument();
  });

  it('resets error state when retry is clicked', () => {
    const TestComponent = () => {
      const [shouldThrow, setShouldThrow] = React.useState(true);

      // Reset the error state after initial render
      React.useEffect(() => {
        setShouldThrow(false);
      }, []);

      return <BuggyComponent shouldThrow={shouldThrow} />;
    };

    render(
      <BrowserRouter>
        <ErrorBoundary>
          <TestComponent />
        </ErrorBoundary>
      </BrowserRouter>
    );

    // Initially shows error
    expect(screen.getByText('Server Error')).toBeInTheDocument();

    // Click retry
    fireEvent.click(screen.getByText('Try Again'));

    // Should now show working component
    expect(screen.getByText('Working component')).toBeInTheDocument();
  });
});
