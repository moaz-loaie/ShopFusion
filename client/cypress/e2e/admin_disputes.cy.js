describe('Admin Dispute Management', () => {
  beforeEach(() => {
    // Login as admin
    cy.request('POST', '/api/auth/login', {
      email: 'admin@test.com',
      password: 'password123'
    }).then((response) => {
      localStorage.setItem('token', response.body.token);
    });
    cy.visit('/admin/disputes');
  });

  it('displays and filters disputes list', () => {
    // Check initial load
    cy.get('[data-testid="loading-spinner"]').should('exist');
    cy.get('[data-testid="loading-spinner"]').should('not.exist');

    // Verify filters work
    cy.get('select[name="status"]')
      .select('open');
    cy.get('select[name="priority"]')
      .select('high');

    // Verify table data updates
    cy.get('table tbody tr')
      .should('have.length.at.least', 1)
      .each($row => {
        cy.wrap($row)
          .find('td span.statusBadge')
          .should('contain', 'Open');
        cy.wrap($row)
          .find('td span.priorityBadge')
          .should('contain', 'High');
      });
  });

  it('handles dispute resolution flow', () => {
    // Click first dispute's View button
    cy.contains('button', 'View').first().click();

    // Verify modal opens with dispute details
    cy.get('.modalContent')
      .should('be.visible')
      .within(() => {
        cy.contains('Dispute Details').should('be.visible');
        cy.contains('button', 'Close').should('be.visible');
      });

    // Close modal
    cy.contains('button', 'Close').click();
    cy.get('.modalContent').should('not.exist');

    // Test resolve action
    cy.contains('button', 'Resolve').first().click();
    cy.contains('successfully').should('be.visible');
    
    // Test reject action
    cy.contains('button', 'Reject').first().click();
    cy.contains('successfully').should('be.visible');
  });

  it('shows error states appropriately', () => {
    // Simulate network error
    cy.intercept('GET', '/api/admin/disputes*', {
      statusCode: 500,
      body: {
        status: 'error',
        message: 'Internal server error'
      }
    }).as('getDisputesFailed');

    cy.reload();
    cy.contains('Failed to load disputes').should('be.visible');
  });
});
