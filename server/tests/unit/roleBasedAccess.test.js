const roleBasedAccess = require('../../middleware/roleBasedAccess');
const { Op } = require('sequelize');

describe('roleBasedAccess Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      query: {}
    };
    res = {};
    next = jest.fn();
  });

  it('restricts guest users to approved products only', () => {
    req.user = null;
    
    roleBasedAccess(req, res, next);

    expect(req.query.status).toBe('approved');
    expect(next).toHaveBeenCalled();
  });

  it('restricts customers to approved products only', () => {
    req.user = { role: 'customer' };
    
    roleBasedAccess(req, res, next);

    expect(req.query.status).toBe('approved');
    expect(next).toHaveBeenCalled();
  });

  it('allows admin to see all products', () => {
    req.user = { role: 'admin' };
    req.query.status = 'pending';
    
    roleBasedAccess(req, res, next);

    expect(req.query.status).toBe('pending');
    expect(next).toHaveBeenCalled();
  });

  it('allows seller to see approved products and their own pending/rejected products', () => {
    req.user = { role: 'seller', id: 1 };
    
    roleBasedAccess(req, res, next);

    expect(req.query.where).toEqual({
      [Op.or]: [
        { status: 'approved' },
        { 
          [Op.and]: [
            { seller_id: 1 },
            { status: { [Op.in]: ['pending', 'rejected'] } }
          ]
        }
      ]
    });
    expect(next).toHaveBeenCalled();
  });

  it('allows seller to filter their own pending products', () => {
    req.user = { role: 'seller', id: 1 };
    req.query.status = 'pending';
    
    roleBasedAccess(req, res, next);

    expect(req.query.where).toEqual({
      seller_id: 1,
      status: 'pending'
    });
    expect(next).toHaveBeenCalled();
  });

  it('allows seller to filter their own rejected products', () => {
    req.user = { role: 'seller', id: 1 };
    req.query.status = 'rejected';
    
    roleBasedAccess(req, res, next);

    expect(req.query.where).toEqual({
      seller_id: 1,
      status: 'rejected'
    });
    expect(next).toHaveBeenCalled();
  });
});
