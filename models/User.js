var mongoose = require('mongoose');
var bcrypt = require('bcryptjs'); // bcryptjs package를 해당 변수에 담음

// schema
var userSchema = mongoose.Schema({
  username:{
    type:String,
    required:[true,'아이디를 입력하세요!'], // 입력안했을경우, 원하는 에러메시지 출력
    match:[/^.{3,15}$/,'3 ~ 15 글자를 입력하세요!'], // 정규 표현식
    trim:true, // 문자열 앞뒤에 빈칸이 있는 경우 빈칸 제거
    unique:true
  },
  password:{
    type:String,
    required:[true,'패스워드를 입력하세요!'],
    select:false // user model을 읽어올때, 비밀번호 값을 읽어오지 못하도록 설정
  },
  name:{
    type:String,
    required:[true,'이름을 입력하세요!'],
    match:[/^.{3,15}$/,'3 ~ 15 글자를 입력하세요!'],
    trim:true
  },
  email:{
    type:String,
    required:[true,'이메일을 입력하세요!'],
    match:[/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,'유효한 이메일을 입력하세요!'],
    trim:true
  }
},{versionKey: false},{
  toObject:{virtuals:true} // DB에 저장되는 값 이외의 항목들 (회원가입, 정보수정을 위한 항목들)
});

// virtuals
userSchema.virtual('passwordConfirmation')
  .get(function(){ return this._passwordConfirmation; })
  .set(function(value){ this._passwordConfirmation=value; });

userSchema.virtual('originalPassword')
  .get(function(){ return this._originalPassword; })
  .set(function(value){ this._originalPassword=value; });

userSchema.virtual('currentPassword')
  .get(function(){ return this._currentPassword; })
  .set(function(value){ this._currentPassword=value; });

userSchema.virtual('newPassword')
  .get(function(){ return this._newPassword; })
  .set(function(value){ this._newPassword=value; });

// password validation
var passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,16}$/;
var passwordRegexErrorMessage = '8~16자리 문자열 중에 숫자랑 영문자가 반드시 하나 이상 필요합니다!';
// 비밀번호 유효성 검사
userSchema.path('password').validate(function(v) {
  var user = this;

  // create user
  // 회원가입 버튼클릭후 유효성 검사 : 비밀번호와 재비밀번호 값이 일치하는지
  if(user.isNew){
    if(!user.passwordConfirmation){
      user.invalidate('passwordConfirmation', '비밀번호 확인이 필요합니다!');
    }
    // 정규표현식을 통과하면 true
    if(!passwordRegex.test(user.password)){
      user.invalidate('password', passwordRegexErrorMessage); // false시 해당 변수로 invalidate함수 호출
    }
    else if(user.password !== user.passwordConfirmation) {
      user.invalidate('passwordConfirmation', '비밀번호가 일치하지 않습니다!');
    }
  }

  // update user
  // 회원정보 수정 유효성 검사 : 현재비밀번호가 없는지, 확인 비밀번호가 해당 회원 비밀번호랑 같은지
  // 새로운 비밀번호와 새로운 재비밀번호 값이 다른지
  if(!user.isNew){
    if(!user.currentPassword){
      user.invalidate('currentPassword', '현재비밀번호를 입력해주세요!');
    }
    // bcrypt의 compareSync함수를 사용 : 저장된 hash와 입력받은 password의 hash가 일치하는지 확인
    // 첫번째 피라미터 입력받은 비밀번호, 두번째 피라미터 user 컬렉션의 password의 hash값
    else if(!bcrypt.compareSync(user.currentPassword, user.originalPassword)){
      user.invalidate('currentPassword', '현재비밀번호가 일치하지 않습니다!');
    }

    if(user.newPassword && !passwordRegex.test(user.newPassword)){
      user.invalidate("newPassword", passwordRegexErrorMessage);
    }
    else if(user.newPassword !== user.passwordConfirmation) {
      user.invalidate('passwordConfirmation', '비밀번호가 일치하지 않습니다!');
    }
  }
});

// hash password
// 첫번째 피라미터로 설정된 이벤트'save'가 일어나기 전 콜백함수를 먼저 실행
userSchema.pre('save', function (next){
  var user = this;
  if(!user.isModified('password')){ // password가 수정됐는지 비교
    return next();
  }
  else {
    user.password = bcrypt.hashSync(user.password);
    // password를 생성하거나 수정시 bcrypt.hashSync 함수로 hash 암호화
    return next();
  }
});

// model methods
// user model의 password hash와 form로부터 입력받은 password text를 비교하는 메소드
userSchema.methods.authenticate = function (password) {
  var user = this;
  return bcrypt.compareSync(password,user.password);
};

// model & export
var User = mongoose.model('user',userSchema); // userSchema의 model을 생성함
module.exports = User;
