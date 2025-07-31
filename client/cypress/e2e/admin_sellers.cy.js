describe('Admin Seller Management', () => {
  beforeEach(() => {
    cy.intercept('GET', '/api/admin/sellers*').as('getSellers');
    cy.intercept('GET', '/api/admin/stats').as('getStats');
    cy.request('POST', '/api/auth/login', {
      email: 'admin@test.com',
      password: 'password123'
    }).then((response) => {
      localStorage.setItem('token', response.body.token);
    });
    cy.visit('/admin/sellers');
    cy.wait(['@getSellers', '@getStats']);
  });

  it('displays and filters sellers list', () => {
    // Check initial load
    cy.get('[data-testid="loading-spinner"]').should('exist');
    cy.get('[data-testid="loading-spinner"]').should('not.exist');
    
    // Verify sellers are displayed
    cy.contains('John Doe').should('be.visible');
    cy.contains('jane@example.com').should('be.visible');

    // Test search functionality
    cy.get('input[placeholder*="Search sellers"]')
      .type('John');
    cy.contains('John Doe').should('be.visible');
    cy.contains('Jane Smith').should('not.exist');

    // Test status filter
    cy.get('select[aria-label="Filter by status"]')
      .select('active');
    cy.get('[role="switch"][aria-checked="true"]')
      .should('have.length.at.least', 1);
  });

  it('handles seller status updates', () => {
    // Find an active seller
    cy.contains('tr', 'John Doe')
      .find('[role="switch"][aria-checked="true"]')
      .click();

    // Confirm deactivation
    cy.contains('Are you sure').should('be.visible');
    cy.contains('button', 'Confirm').click();

    // Verify status update
    cy.contains('successfully').should('be.visible');
    cy.contains('tr', 'John Doe')
      .find('[role="switch"][aria-checked="false"]')
      .should('exist');
  });

  it('handles bulk actions', () => {
    // Select all sellers
    cy.get('[aria-label="Select all sellers"]').click();
    cy.get('input[type="checkbox"]').should('be.checked');

    // Open bulk actions menu
    cy.contains('Bulk Actions').click();
    cy.contains('Deactivate Selected').click();

    // Confirm bulk action
    cy.contains('Are you sure').should('be.visible');
    cy.contains('button', 'Confirm').click();

    // Verify success message
    cy.contains('successfully updated').should('be.visible');
  });

  it('displays accurate seller statistics', () => {
    cy.get('.statsContainer').within(() => {
      // Verify total sellers
      cy.contains('Total Sellers')
        .parent()
        .find('.statNumber')
        .invoke('text')
        .then(total => {
          const totalCount = parseInt(total);
          expect(totalCount).to.be.a('number');
          expect(totalCount).to.be.at.least(0);
        });

      // Verify active sellers
      cy.contains('Active Sellers')
        .parent()
        .find('.statNumber')
        .invoke('text')
        .then(active => {
          const activeCount = parseInt(active);
          expect(activeCount).to.be.a('number');
          expect(activeCount).to.be.at.least(0);
          
          // Active should not exceed total
          cy.contains('Total Sellers')
            .parent()
            .find('.statNumber')
            .invoke('text')
            .then(total => {
              expect(activeCount).to.be.at.most(parseInt(total));
            });
        });

      // Verify pending sellers
      cy.contains('Pending Sellers')
        .parent()
        .find('.statNumber')
        .should('exist');

      // Verify suspended sellers
      cy.contains('Suspended')
        .parent()
        .find('.statNumber')
        .should('exist');
    });
  });

  it('handles pagination', () => {
    // Add more sellers if needed for pagination
    cy.get('[aria-label="Next page"]').click();
    cy.url().should('include', 'page=2');
  });

  it('handles errors gracefully', () => {
    // Simulate network error
    cy.intercept('GET', '/api/admin/sellers*', {
      statusCode: 500,
      body: {
        status: 'error',
        message: 'Internal server error'
      }
    }).as('getSellersError');
    
    cy.reload();
    cy.contains('Failed to load sellers').should('be.visible');
  });
});
