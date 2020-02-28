var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var NaverStrategy = require('passport-naver').Strategy;
var User = require('../models/User');
var dotenv = require('dotenv');
dotenv.config();

// serialize & deserialize User
passport.serializeUser(function(user, done) {
  done(null, user.id);
});//login시에 db에서 발견한 user를 어떻게 session 에 저장할지 정하는 부분.
passport.deserializeUser(function(id, done) {
  User.findOne({_id:id}, function(err, user) {
    done(err, user);
  });
});//request시에 session에서 어떻게 user object를 만들지를 정하는 부분.

// local strategy
passport.use('local-login',
  new LocalStrategy({
      usernameField : 'username',
      passwordField : 'password',
      passReqToCallback : true
    },
    function(req, username, password, done) {
      User.findOne({username:username})
        .select({password:1})
        .exec(function(err, user) {
          if (err) return done(err);

          if (user && user.authenticate(password)){
            return done(null, user);
          }
          else {
            req.flash('username', username);
            req.flash('errors', {login:'The username or password is incorrect.'});
            return done(null, false);
          }
        });
    }
  )
);


passport.use('naver', new NaverStrategy({
  clientID:process.env.NAVER_CLIENT_ID,
  clientSecret:process.env.NAVER_CLIENT_SECRET,
  callbackURL:'https://picudream.herokuapp.com',
    svcType: 0,
  authType:'reauthenticate'
  },
function(accessToken, refreshToken, profile, done) {
  User.findOne({
    'naver.id': profile.id
  }, function(err, user) {
    if (!user) {
      user = new User({
        name: profile.displayName,
        email: profile.emails[0].value,
        username: profile.displayName,
        provider: 'naver',
        naver: profile._json
      });
      user.save(function(err) {
        if (err) console.log(err);
        return done(err, user);
      });
    } else {
      return done(err, user);
    }
  });
}))




module.exports = passport;
