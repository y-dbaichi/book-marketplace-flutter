# Frontend Testing Guide

## 🚀 Running Tests

### Run All Tests
```bash
cd frontend
npm test
```

### Run Tests in Watch Mode (auto-rerun on changes)
```bash
npm test
# Press 'w' to show watch menu
# Press 'a' to run all tests
# Press 'p' to filter by filename
# Press 'q' to quit
```

### Run Tests with UI (Visual Interface)
```bash
npm run test:ui
# Opens in browser at http://localhost:51204
```

### Run Tests with Coverage
```bash
npm run test:coverage
# Creates coverage report in coverage/
```

### Run Specific Test File
```bash
npm test Button.test.jsx
# or
npm test src/components/common/__tests__/Button.test.jsx
```

## 📋 What's Already Set Up

✅ Vitest test runner
✅ React Testing Library
✅ Jest DOM matchers
✅ Test utilities (renderWithProviders)
✅ Mock setup for localStorage and window.matchMedia

## ✍️ Writing Tests

### Test Structure

```jsx
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../../test/utils';
import YourComponent from '../YourComponent';

describe('YourComponent', () => {
  it('should render correctly', () => {
    renderWithProviders(<YourComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('should handle click events', () => {
    const handleClick = vi.fn();
    renderWithProviders(<YourComponent onClick={handleClick} />);

    fireEvent.click(screen.getByText('Click Me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Common Testing Patterns

#### 1. Testing Component Rendering
```jsx
it('renders component with props', () => {
  renderWithProviders(<Button variant="primary">Submit</Button>);

  const button = screen.getByText('Submit');
  expect(button).toBeInTheDocument();
  expect(button).toHaveClass('btn-primary');
});
```

#### 2. Testing User Interactions
```jsx
it('handles user input', async () => {
  const { user } = renderWithProviders(<Input />);

  const input = screen.getByRole('textbox');
  await user.type(input, 'Hello');

  expect(input).toHaveValue('Hello');
});
```

#### 3. Testing Forms
```jsx
it('submits form with valid data', async () => {
  const onSubmit = vi.fn();
  renderWithProviders(<LoginForm onSubmit={onSubmit} />);

  await user.type(screen.getByLabelText(/email/i), 'test@test.com');
  await user.type(screen.getByLabelText(/password/i), 'password123');

  fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

  expect(onSubmit).toHaveBeenCalledWith({
    email: 'test@test.com',
    password: 'password123'
  });
});
```

#### 4. Testing API Calls
```jsx
import { vi } from 'vitest';
import * as api from '../../services/api';

vi.mock('../../services/api');

it('fetches and displays books', async () => {
  const mockBooks = [
    { id: 1, title: 'Book 1', author: 'Author 1' },
    { id: 2, title: 'Book 2', author: 'Author 2' }
  ];

  api.bookService.getAll.mockResolvedValue({ data: { books: mockBooks } });

  renderWithProviders(<BookList />);

  await waitFor(() => {
    expect(screen.getByText('Book 1')).toBeInTheDocument();
    expect(screen.getByText('Book 2')).toBeInTheDocument();
  });
});
```

#### 5. Testing Context/Auth
```jsx
it('redirects when not authenticated', () => {
  const { history } = renderWithProviders(
    <ProtectedRoute />,
    { initialAuthState: { user: null } }
  );

  expect(history.location.pathname).toBe('/login');
});
```

## 🔍 Finding Elements

### By Text
```jsx
screen.getByText('Submit')
screen.getByText(/submit/i) // Case insensitive
```

### By Role
```jsx
screen.getByRole('button', { name: /submit/i })
screen.getByRole('textbox')
screen.getByRole('link')
```

### By Label
```jsx
screen.getByLabelText(/email/i)
```

### By Placeholder
```jsx
screen.getByPlaceholderText('Enter email')
```

### By Test ID
```jsx
// In component: <div data-testid="book-card">
screen.getByTestId('book-card')
```

## 🎯 What to Test

### ✅ DO Test
- Component renders correctly
- User interactions (clicks, typing, etc.)
- Form submissions and validation
- Conditional rendering
- Error states
- Loading states
- Props are used correctly
- Callbacks are called

### ❌ DON'T Test
- Implementation details
- Third-party library internals
- CSS styles (unless critical to functionality)
- Exact HTML structure

## 📁 Recommended Test Organization

```
src/
├── components/
│   ├── common/
│   │   ├── Button.jsx
│   │   └── __tests__/
│   │       └── Button.test.jsx
│   └── layout/
│       ├── Header.jsx
│       └── __tests__/
│           └── Header.test.jsx
├── pages/
│   ├── auth/
│   │   ├── LoginPage.jsx
│   │   └── __tests__/
│   │       └── LoginPage.test.jsx
└── test/
    ├── setup.js       # Test configuration
    └── utils.jsx      # Test utilities
```

## 🛠️ Test Utilities

### renderWithProviders
Wraps your component with necessary providers (Router, Auth, etc.)

```jsx
import { renderWithProviders } from '../../test/utils';

renderWithProviders(<YourComponent />, {
  initialAuthState: { user: mockUser, isAuthenticated: true },
  route: '/dashboard'
});
```

### Mock Data Helpers
Use the mock data from `test/utils.jsx`:

```jsx
import { mockBook, mockUser, mockOrder } from '../../test/utils';
```

## 🐛 Debugging Tests

### 1. See what's rendered
```jsx
import { screen } from '@testing-library/react';

renderWithProviders(<YourComponent />);
screen.debug(); // Prints the DOM
```

### 2. Query what's available
```jsx
screen.logTestingPlaygroundURL(); // Opens testing playground
```

### 3. Run single test
```bash
npm test -- -t "specific test name"
```

## 📊 Coverage Goals

Aim for:
- **Statements**: 80%+
- **Branches**: 70%+
- **Functions**: 80%+
- **Lines**: 80%+

View coverage:
```bash
npm run test:coverage
open coverage/index.html
```

## 🚨 Common Issues

### Issue: "Element not found"
**Solution**: Use `waitFor` for async operations
```jsx
import { waitFor } from '@testing-library/react';

await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument();
});
```

### Issue: "Not wrapped in act(...)"
**Solution**: Use `waitFor` or `user.click()` instead of `fireEvent`

### Issue: "Cannot find module"
**Solution**: Check import paths and ensure file exists

## 📚 Resources

- [Vitest Docs](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Playground](https://testing-playground.com/)
- [Common Mistakes](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## ✅ Example Test Checklist

For each component, test:
- [ ] Renders with default props
- [ ] Renders with all prop variations
- [ ] Handles user interactions
- [ ] Shows loading state
- [ ] Shows error state
- [ ] Calls callbacks correctly
- [ ] Handles edge cases (null, undefined, empty)
