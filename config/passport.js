var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var NaverStrategy = require('passport-naver').Strategy;
var GoogleStrategy = require('passport-google-oauth20').Strategy;
var User = require('../models/User');
var dotenv = require('dotenv');
dotenv.config();

//login시에 db에서 발견한 user를 어떻게 session 에 저장할지 정하는 부분.
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

//request시에 session에서 어떻게 user object를 만들지를 정하는 부분.
passport.deserializeUser(function(id, done) {
  User.findOne({_id:id}, function(err, user) {
    done(err, user);
  })
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
  clientID:process.env.NAVER_CLIENT_ID,
  clientSecret:process.env.NAVER_CLIENT_SECRET,
  callbackURL:'http://localhost:3000//auth/naver/callback',
    svcType: 0,
  authType:'reauthenticate'
  },
  function(accessToken, refreshToken, profile, done) {
 
    User.findOne({ 'naver.id' : profile.id }, function(err, user) {
      console.log(accessToken, refreshToken, profile)
      if (err) return done(err);
      if (user) return done(null, user);
      else {
        // if there is no user found with that facebook id, create them
        var newUser = new User();
        
        // set all of the facebook information in our user model
        newUser.naver.id = profile.id;
        newUser.naver.token = accessToken;
        newUser.naver.name  = profile.email;
        newUser.naver.nickname = profile.nickname;
        if (typeof profile.emails != 'undefined' && profile.emails.length > 0)
          newUser.naver.email = profile.emails[0].value;
        
        // save our user to the database
        newUser.save(function(err) {
          if (err) throw err;
          return done(null, newUser);
        });
      }
    });
  }
  
  ));

passport.use('google', new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "https://picudream.herokuapp.com",
  },
  function(accessToken, refreshToken, profile, done) {
  
    User.findOne({ 'google.id' : profile.id }, function(err, user) {
      console.log(accessToken, refreshToken, profile)
      if (err) return done(err);
      if (user) return done(null, user);
      else {
        // if there is no user found with that facebook id, create them
        var newUser = new User();
      
        // set all of the facebook information in our user model
        newUser.google.id = profile.id;
        newUser.google.token = accessToken;
        newUser.google.name  = profile.email;
        if (typeof profile.emails != 'undefined' && profile.emails.length > 0)
          newUser.google.email = profile.emails[0].value;
        
        // save our user to the database
        newUser.save(function(err) {
          if (err) throw err;
          return done(null, newUser);
        });
      }
    });
  

  }
));

module.exports = passport;



