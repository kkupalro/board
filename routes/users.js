var express = require('express');
var router = express.Router();
var User = require('../models/User');
var util = require('../util'); // util을 require

// New
// user 생성시 에러가 있는 경우 new페이지에 에러와 입력한 값들을 보여줌
// 처음 new 페이지에 접근했을시, || {}를 사용해 빈 오브젝트를 넣어 user/new 페이지를 생성
router.get('/new', function(req, res){
  var user = req.flash('user')[0] || {};
  var errors = req.flash('errors')[0] || {};
  res.render('users/new', { user:user, errors:errors });
});

// create
// user 생성시에 오류가 있다면 user, error flash를 만들고 new 페이지로 redirect함
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
// 처음 접속하는 경우 DB에서 값을 찾아 form에 기본값을 생성
// update에서 오류가 발생해 돌아오는 경우 기존에 입력했던 값으로 form값들을 생성
// 이를 위해 user에는 || {}를 사용 X, user flash값이 있으면 오류가 있는 경우,
// user flash값이 없으면 처음들어온 경우로 가정하고 진행
router.get('/:username/edit', util.isLoggedin, checkPermission, function(req, res){
  var user = req.flash('user')[0];
  var errors = req.flash('errors')[0] || {};
  if(!user){
    User.findOne({username:req.params.username}, function(err, user){
      if(err) return res.json(err);
      res.render('users/edit', { username:req.params.username, user:user, errors:errors });
    });
  }
  else {
    // user flash에서 값을 받는 경우 username이 달라질수있기 때문에 username은 따로받음
    res.render('users/edit', { username:req.params.username, user:user, errors:errors });
  }
});

// update
router.put('/:username', util.isLoggedin, checkPermission, function(req, res, next){ // 로그인이 되고 자신의 데이터에 접근하는 경우에만 해당 route을 사용할수 있음
  User.findOne({username:req.params.username})
    .select('password') // password를 읽어오게함
    .exec(function(err, user){
      if(err) return res.json(err);

      // update user object
      user.originalPassword = user.password;
      user.password = req.body.newPassword? req.body.newPassword : user.password; // password를 바꾼 경우 값 변경
      for(var p in req.body){ // user[]는 실제 DB 데이터, req.body[]는 form으로 부터 입력받은 데이터
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

module.exports = router;

// private functions
// 해당 user의 id와 로그인된 user.id를 비교해서 같은 경우에만 진행함
function checkPermission(req, res, next){
  User.findOne({username:req.params.username}, function(err, user){
    if(err) return res.json(err);
    if(user.id != req.user.id) return util.noPermission(req, res);

    next();
  });
}
