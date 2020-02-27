var express = require('express');
var router = express.Router();
var User = require('../models/User');
var util = require('../util');

// Index
// router.get('/', function(req, res){
//   User.find({})
//     .sort({username:1})//username으로 오름차순
//     .exec(function(err, users){
//       if(err) return res.json(err);
//       res.render('users/index', {users:users});
//     });
// });

// New
router.get('/new', function(req, res){
  var user = req.flash('user')[0] || {};
  var errors = req.flash('errors')[0] || {};
  res.render('users/new', { user:user, errors:errors });
});

// create
router.post('/', function(req, res){
  User.create(req.body, function(err, user){
    if(err){
      req.flash('user', req.body);
      req.flash('errors', util.parseError(err));
      return res.redirect('/users/new');
    }
    res.redirect('/');
  });
});

// show
router.get('/:username', util.isLoggedin, checkPermission, function(req, res){
  User.findOne({username:req.params.username}, function(err, user){
    if(err) return res.json(err);
    res.render('users/show', {user:user});
  });
});

// edit
router.get('/:username/edit',util.isLoggedin, checkPermission, function(req, res){
  var user = req.flash('user')[0];
  var errors = req.flash('errors')[0] || {};
  if(!user){
    User.findOne({username:req.params.username}, function(err, user){
      if(err) return res.json(err);
      res.render('users/edit', { username:req.params.username, user:user, errors:errors });
    });
  }
  else {
    res.render('users/edit', { username:req.params.username, user:user, errors:errors });
  }
});

// update
router.put('/:username',util.isLoggedin, checkPermission, function(req, res, next){
  User.findOne({username:req.params.username})
    .select('password')//select를 이용하면 db에서 어떤 항목을 선택할지 안할지 정할 수 있다.
    .exec(function(err, user){
      if(err) return res.json(err);

      // update user object
      user.originalPassword = user.password;
      user.password = req.body.newPassword? req.body.newPassword : user.password;//user의 update은 password를 업데이트 하는 경우와, password를 업데이트 하지 않는 경우로 나눌수 있다.
      for(var p in req.body){//user는 db에서 읽어온 data, req.body가 실제 form에서 입력된 값
        user[p] = req.body[p];
      }

      // save updated user
      user.save(function(err, user){
        if(err){
          req.flash('user', req.body);
          req.flash('errors', util.parseError(err));
          return res.redirect('/users/'+req.params.username+'/edit');
        }
        res.redirect('/users/'+user.username);
      });
  });
});

// destroy
// router.delete('/:username', function(req, res){
//   User.deleteOne({username:req.params.username}, function(err){
//     if(err) return res.json(err);
//     res.redirect('/users');
//   });
// });

module.exports = router;
//user의 id와 로그인된  user.id를 비교해서 같은경우 next 다르면 nopermission 호출 login화면으로.
function checkPermission (req,res,next) {
  User.findOne({username: req.params.username}, function(err,user) {
    if(err) return res.json(err);
    if(user.id != req.user.id) return util.noPermission(req,res);
    
    next();
  });
}
