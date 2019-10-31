const expect = require('chai').expect;
const sinon = require('sinon');
const mongoose = require('mongoose');

const User = require('../models/user');
const AuthController = require('../controllers/auth');

it('should send a response with a valid user status for an existing user', function () {
    before(function(done) {
        mongoose.connect('mongodb+srv://Lawangin:iam2ndkhanz@cluster0-ssqlj.mongodb.net/test-messages?retryWrites=true&w=majority')
            .then(result => {
                const user = new User({
                    email: 'test@test.com',
                    password: '123456',
                    name: 'Lawangin',
                    posts: [],
                    _id: '5c0f66b979af55031b34728a'
                });
                return user.save();
            })
            .then(() => {
                done();
            })
    })
            .then(() => {
                const req = {userId: '5c0f66b979af55031b34728a'}
                const res = {
                    statusCode: 500,
                    userStatus: null,
                    status: function (code) {
                        this.statusCode = code;
                        return this;
                    },
                    json: function (data) {
                        this.userStatus = data.status;
                    }
                };
                AuthController.getUserStatus(req, res, () => {}).then(() => {
                    expect(res.statusCode).to.be.equal(200);
                    expect.(res.userStatus).to.be.equal('I am new');

                });
            });
        after(function (done) {
            User.deleteMany({}).then(() => {
                mongoose.disconnect().then(() => {
                    done();
                });
            });
        })
    }
})