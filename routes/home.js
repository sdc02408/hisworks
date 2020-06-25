var express = require('express');
var router = express.Router();
var passport = require('../config/passport');
var dotenv = require('dotenv');
const Path = require('path')
const Axios = require('axios')
var fs= require('fs')
var contentType = require('content-type')
var AWS = require('aws-sdk');
dotenv.config();

//aws 설정
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey:process.env.AWS_SECRET_ACCESS_KEY,
  region: 'ap-northeast-2'});
var s3 = new AWS.S3();

// const doDownload = (req,res) => {
//   const params = {
//     Bucket: process.env.AWS_BUCKET_NAME,
//     Key:req.params.filename
//   }
//
//   res.setHeader('Content-Disposition', 'attachment');
//
//   s3.getObject(params)
//     .createReadStream()
//       .on('error',function(err) {
//         res.status(500).json({error:"error -> " + err});
//       }).pipe(res);
// }

let lists = [];
  s3.listObjectsV2(
    {
      Bucket: process.env.AWS_BUCKET_NAME,
    },
    (err, data) => {
      if (err) {
        throw err;
      }
      
      let contents = data.Contents;
      contents.forEach((content) => {
        lists.push(content.Key); // "ex) content.Key => assets/images/1.png"
      });
    }
  );

router.get('/', function(req, res){
  res.render('home/welcome', {
    lists:lists,
 });
});

// router.get('/:filename', doDownload())

router.get('/about', function(req, res){
  res.render('home/about',{lgn:"kr"});
});

// Login
// router.get('/login', function (req,res) {
//   var username = req.flash('username')[0];
//   var errors = req.flash('errors')[0] || {};
//   res.render('home/login', {
//     username:username,
//     errors:errors,
//     lgn:"ko"
//   });
// });

router.get('/login', function (req,res) {
  var username = req.flash('username')[0];
  var errors = req.flash('errors')[0] || {};
  res.render('home/login', {
    username:username,
    errors:errors,
  });
});

// Post Login
router.post('/login',
  function(req,res,next){
    var errors = {};
    var isValid = true;

    if(!req.body.username){
      isValid = false;
      errors.username = 'Username is required!';
    }
    if(!req.body.password){
      isValid = false;
      errors.password = 'Password is required!';
    }

    if(isValid){
      next();
    }
    else {
      req.flash('errors',errors);
      res.redirect('/login');
    }
  },
  passport.authenticate('local-login', {
    successRedirect : '/posts',
    failureRedirect : '/login'
  }
));

//NAVER LOGIN
router.get('/auth/naver', passport.authenticate('naver',{
  successRedirect : '/posts',
  failureRedirect : '/login'
}))

router.get('/auth/naver/callback', passport.authenticate('naver',{
  successRedirect : '/posts',
  failureRedirect : '/login'
}))

//GOOGLE LOGIN
router.get('/auth/google', passport.authenticate('google',{ scope: 'https://www.google.com/m8/feeds' }));

router.get('/auth/google/callback', passport.authenticate('google',  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/');
  }));

// Logout
router.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});


module.exports = router;


