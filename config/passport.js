passport = require('passport');
var User = require('../models/user');
var localStrategy = require('passport-local').Strategy;


passport.serializeUser(function (user, done) {
    done(null, user.id)
});
passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    })
})

passport.use('local.signup', new localStrategy({
    usernameField: 'email',
    passwordField: 'password',
    fullNameField: 'fullName',
    phoneNumField: 'phoneNum',
    confirmPassField: 'confirmPass',
    passReqToCallback: true
}, function (req, email, password, done,) {
    req.checkBody('email', 'Invalid Email').notEmpty().isEmail();
    req.checkBody('password', 'Invalid Password').notEmpty().isLength({ min: 3 });
    req.checkBody('confirmPass', 'Passwords do not match.').equals(req.body.password);
    req.checkBody('fullName', 'Invalid FullName').notEmpty();
    req.checkBody('phoneNum', 'Invalid Phone number').notEmpty();
    var errors = req.validationErrors();
    if (errors) {
        var messages = [];
        errors.forEach(function (error) {
            messages.push(error.msg);
        })
        return done(null, false, req.flash('error', messages))
    }
    User.findOne({ 'email': email }, function (err, user) {
        if (err) {
            return done(err);
        }
        if (user) {
            return done(null, false, { message: 'Email is already in use.' });
        }
        var newUser = new User();
        newUser.email = email;
        newUser.password = newUser.encryptPassword(password);
        newUser.fullName = req.body.fullName;
        newUser.phoneNum = String(req.body.phoneNum);
        newUser.description = ""
        newUser.status = "Active"
        newUser.role = "Customer"
        newUser.address = ""
        newUser.company = ""
        newUser.birthday = "",
        newUser.googleId = null,
        req.session.user = newUser
        console.log(newUser)
        newUser.save(function (err, result) {
            if (err) {
                return done(err)
            }
            return done(null, newUser)
        })
    })
}
))
passport.use('local.signin', new localStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true,
}, function (req, email, password, done) {
    User.findOne({ 'email': email, 'role': 'Customer' }, function (err, user) {
        if (err) {
            return done(err);
        }
        if (!user) {
            return done(null, false, { message: 'No user found.' });
        }
        if(user.googleId || user.googleId != null){
            return done(null,false,{message: 'This account must login by Gmail.!'})
        }
        if (!user.validPassword(password)) {
            return done(null, false, { message: 'Wrong password.' });
        }
        if(user.status != 'Active'){
            return done(null, false, { message: 'Your account has been locked.' });
        }
        req.session.user = user
        return done(null, user)
    });
}))