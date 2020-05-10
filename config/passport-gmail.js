const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20');
const keys = require('./key')
const User = require('../models/user')

passport.serializeUser((user, done) => {
    done(null, user.id)
});
passport.deserializeUser((id, done) => {
    User.findById(id).then((user) => {
        done(null, user);
    })
})

passport.use(new GoogleStrategy({
    callbackURL: '/user/google/redirect',
    clientID: keys.google.clientID,
    clientSecret: keys.google.clientSecret
}, (acessToken, refreshToken,profile,done) => {
    User.findOne({googleId: profile.id}).then((currentUser)=>{
        if(currentUser){
            // console.log('user is:',currentUser)
            done(null,currentUser)
        }else{
            new User({
                email: profile.emails[0].value,
                fullName: profile.displayName,
                password: "",
                phoneNum: null,
                googleId: profile.id,
                description: null,
                status: 'Active',
                role: 'Customer',
                address: null,
                company: null,
                birthday: null,
                orderList: []
            }).save().then((newUser)=>{
                done(null,newUser)
            })
        }
    })

}))