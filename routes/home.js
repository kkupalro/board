var express = require('express');
var router = express.Router(); // router함수를 초기화
var passport = require('../config/passport');

// Home
// '/'에 get요청이 오는 경우를 router함수에 설정함
router.get('/', function(req, res){
  res.render('home/welcome');
}); // 초기화면
router.get('/about', function(req, res){
  res.render('home/about');
});

// Login
// login view를 보여주는 route
router.get('/login', function (req,res) {
  var username = req.flash('username')[0];
  var errors = req.flash('errors')[0] || {};
  res.render('home/login', {
    username:username,
    errors:errors
  });
});

// Post Login
// 보내진 form의 유효성 검사
router.post('/login',
  function(req,res,next){
    var errors = {};
    var isValid = true;

    if(!req.body.username){
      isValid = false;
      errors.username = '아이디가 필요합니다!';
    }
    if(!req.body.password){
      isValid = false;
      errors.password = '비밀번호가 필요합니다!';
    }

    if(isValid){
      next();
    }
    else {
      req.flash('errors',errors);
      res.redirect('/login');
    }
  },
  // passport local strategy를 호출하여 로그인을 진행함
  passport.authenticate('local-login', {
    successRedirect : '/posts',
    failureRedirect : '/login'
  }
));

// Logout
router.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});

// router object가 module이 되어 require시에 사용됨
module.exports = router;
