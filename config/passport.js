var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var User = require('../models/User');

// serialize & deserialize User
// user id만 session에 저장함 -> 성능 저하 방지
passport.serializeUser(function(user, done) {
  done(null, user.id);
});
// request마다 user정보를 db에서 읽어 user object를 생성함
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
    function(req, username, password, done) { // 로그인 시에 함수 호출
      User.findOne({username:username})
        .select({password:1})
        .exec(function(err, user) {
          if (err) return done(err);

          if (user && user.authenticate(password)){ // 입력받은 password와 DB에서 읽어온 해당 user의 password hash를 비교
            return done(null, user);
          }
          else {
            req.flash('username', username);
            req.flash('errors', {login:'아이디 혹은 비밀번호가 일치하지 않습니다!'});
            return done(null, false);
          }
        });
    }
  )
);

module.exports = passport;
