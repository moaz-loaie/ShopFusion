// File: client/cypress/e2e/basic_flow.cy.js
describe('Basic ShopFusion User Flow', () => {
  const userEmail = `test-${Date.now()}@example.com`; // Unique email for registration
  const userPassword = 'password123';

  beforeEach(() => {
    // Optional: Clear local storage or cookies before each test
    cy.clearLocalStorage();
    cy.clearCookies();
    // Visit the home page
    cy.visit('/');
  });

  it('should display the home page correctly', () => {
    cy.contains('h1', /find clothes/i); // Example: Check for heading text
    cy.get('nav').should('be.visible'); // Check for navbar
    cy.get('[data-testid="product-list"]').should('exist'); // Assuming ProductList has data-testid
  });

  it('should allow a user to register', () => {
    cy.contains('a', /register/i).click(); // Find register link/button
    cy.url().should('include', '/register');

    cy.get('input[name="full_name"]').type('E2E Test User');
    cy.get('input[name="email"]').type(userEmail);
    cy.get('input[name="password"]').type(userPassword);
    cy.get('input[name="confirmPassword"]').type(userPassword); // Assuming confirm password field exists
    cy.get('button[type="submit"]').click();

    // Wait for navigation or check for success indicator/redirect
    cy.url().should('not.include', '/register'); // Should redirect on success
    cy.get('nav').contains(/account|logout/i); // Check if logged in state is reflected
  });

  it('should allow a registered user to login', () => {
     // --- Requires backend API mocking or a seeded user ---
     // Option 1: Mock API login response (using cy.intercept)
     cy.intercept('POST', '/api/v1/auth/login', {
         statusCode: 200,
         body: {
             status: 'success',
             token: 'fake-jwt-token',
             data: { user: { id: 1, email: 'seeded@test.com', full_name: 'Seeded User', role: 'customer' } }
         }
     }).as('loginRequest');

     cy.visit('/login');
     cy.get('input[type="email"]').type('seeded@test.com');
     cy.get('input[type="password"]').type('password123');
     cy.get('button[type="submit"]').click();

     cy.wait('@loginRequest'); // Wait for the intercepted request
     cy.url().should('not.include', '/login');
     cy.get('nav').contains(/account|logout/i);

      // Option 2: Use user registered in previous test (less isolated)
     // cy.visit('/login');
     // cy.get('input[type="email"]').type(userEmail); // Use email from previous test
     // cy.get('input[type="password"]').type(userPassword);
     // cy.get('button[type="submit"]').click();
     // cy.url().should('not.include', '/login');
     // cy.get('nav').contains(/account|logout/i);
  });

   it('should allow adding an item to the cart (requires login and API mocking/seeding)', () => {
       // 1. Log in first (programmatically or via UI)
       // cy.login(userEmail, userPassword); // Example custom command

       // 2. Mock relevant API calls (get products, add to cart, get cart)
        cy.intercept('GET', '/api/v1/products*').as('getProducts'); // Mock or use real data
        cy.intercept('POST', '/api/v1/cart/items').as('addToCart');
        cy.intercept('GET', '/api/v1/cart').as('getCart');


       // 3. Navigate to product page or list
       cy.visit('/products');
       cy.wait('@getProducts');


       // 4. Find a product and click "Add to Cart"
       // cy.get('[data-testid="product-card"]').first().find('button', /add to cart/i).click(); // Example selector


       // 5. Verify API call was made and cart updates
       // cy.wait('@addToCart').its('response.statusCode').should('eq', 200);
       // cy.get('[data-testid="cart-icon-count"]').should('contain', '1'); // Example check


       // 6. Navigate to cart page and verify item
       // cy.visit('/cart');
       // cy.wait('@getCart');
       // cy.contains('h1', /your cart/i);
       // cy.contains('.cart-item-name', /product name/i); // Example check
   });

  // Add more tests for:
  // - Viewing product details
  // - Filtering/sorting products
  // - Updating cart quantity
  // - Removing from cart
  // - Checkout process (mocking payment)
  // - Viewing order history
  // - Logout
});

// Optional: Custom command for login
// Cypress.Commands.add('login', (email, password) => {
//   cy.request('POST', 'http://localhost:5001/api/v1/auth/login', { // Use backend URL directly
//     email,
//     password,
//   }).then((response) => {
//     localStorage.setItem('authToken', response.body.token); // Store token
//     // Optionally set token in Axios instance if needed for subsequent cy.request calls
//   });
// });