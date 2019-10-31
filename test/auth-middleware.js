const expect = require('chai').expect;
const jwt = require('jsonwebtoken');
const sinon = require('sinon');

const authMiddleware = require('../middleware/auth');

it('should yield a user ID after token is decoded', function() {
    const req = {
        get: function (headerName) {
            return 'Bearer zyx';
        }
    };
    sinon.stub(jwt, 'verify');
    jwt.verify.returns({userId: 'abc'});

    authMiddleware(req, {}, () => {});
    expect(req).to.have.property('userId');
    expect(req).to.have.property('userId', 'abc');
    expect(jwt.verify.called).to.be.true;
    jwt.verify.restore();
})