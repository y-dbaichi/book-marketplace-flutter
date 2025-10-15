import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';

/**
 * Custom render function that includes common providers
 */
export function renderWithProviders(ui, options = {}) {
  const {
    initialAuthState = { user: null, loading: false },
    ...renderOptions
  } = options;

  function Wrapper({ children }) {
    return (
      <BrowserRouter>
        <AuthProvider initialState={initialAuthState}>
          {children}
        </AuthProvider>
      </BrowserRouter>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

/**
 * Mock user objects for testing
 */
export const mockBuyer = {
  _id: '123',
  email: 'buyer@test.com',
  userType: 'buyer',
  profile: {
    firstName: 'Test',
    lastName: 'Buyer'
  }
};

export const mockSeller = {
  _id: '456',
  email: 'seller@test.com',
  userType: 'seller',
  profile: {
    firstName: 'Test',
    lastName: 'Seller'
  }
};

/**
 * Mock book object
 */
export const mockBook = {
  _id: '789',
  title: 'Test Book',
  author: 'Test Author',
  quality: 'good',
  quantity: 5,
  price: 100,
  description: 'Test description',
  category: 'Fiction',
  status: 'available',
  seller: mockSeller,
  condition: {
    hasWriting: false,
    hasHighlighting: false,
    hasDamage: false
  }
};

/**
 * Mock order object
 */
export const mockOrder = {
  _id: '999',
  book: mockBook,
  buyer: mockBuyer,
  seller: mockSeller,
  quantity: 2,
  totalPrice: 200,
  status: 'pending',
  buyerLocation: {
    type: 'Point',
    coordinates: [-7.5898, 33.5731],
    name: 'Test Location'
  }
};

// Re-export everything from React Testing Library
export * from '@testing-library/react';
