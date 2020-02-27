var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var NaverStrategy = require('passport-naver').Strategy;
var User = require('../models/User');
var dotenv = require('dotenv');
dotenv.config();

// serialize & deserialize User
passport.serializeUser(function(user, done) {
  done(null, user.id);
});
passport.deserializeUser(function(id, done) {
  User.findOne({_id:id}, function(err, user) {
    done(err, user);
  });
});

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
  clientID: process.env.NAVER_CLIENT_ID,
  clientSecret: process.env.NAVER_CLIENT_SECRET,
  callback_url:'https://picudream.herokuapp.com'
  },
function(accessToken, refreshToken, profile, cb) {
User.findOne({sns:'naver', distinguishID: profile.id}, function(err, user) {
  if (err) {
    return cb(err)
  }
  if (!user) {
    User.create({
      name: profile.displayName,
      sns: profile.provider,
      distinguishID: profile.id,
      token: accessToken
    }, function(err, user) {
      if (err) {
        return cb(err);
      }
      cb(null, user);
    });
  } else {
    var tmp = accessToken;
    var tmp2 = new Date();
    User.findByIdAndUpdate(user._id, { $set: { lastvisited: tmp2, token: tmp } }, function(err, user) {
      if (err) {
        return cb(err);
      }
      cb(null, user);
    });
  }
});
}))




module.exports = passport;
