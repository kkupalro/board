var util = {};

// mongoose에서 내는 에러와 mongoDB에서 내는 에러의 형태를 {항목이름: {message:"애러메시지"}}로 통일시켜주는 함수
util.parseError = function(errors){
  var parsed = {};
  if(errors.name == 'ValidationError'){
    for(var name in errors.errors){
      var validationError = errors.errors[name];
      parsed[name] = { message:validationError.message };
    }
  }
  else if(errors.code == '11000' && errors.errmsg.indexOf('username') > 0) {
    parsed.username = { message:'아이디가 이미 존재합니다!' };
  }
  else {
    parsed.unhandled = JSON.stringify(errors);
  }
  return parsed;
};

// 사용자가 로그인이 되었는지 아닌지를 판단하는 함수
util.isLoggedin = function(req, res, next){
  if(req.isAuthenticated()){
    next();
  }
  else {
    req.flash('errors', {login:'로그인을 하신 후 사용하실수 있습니다!'});
    res.redirect('/login');
  }
};

// route에 접근권한 여부를 판단하는 함수
util.noPermission = function(req, res){
  req.flash('errors', {login:"허가받지않은 사용자입니다!"});
  req.logout();
  res.redirect('/login');
};

module.exports = util;
