var express = require('express'); // 설치한 express module을 불러와서 변수(express)에 담음
var mongoose = require('mongoose'); // 설치한 mongoose module을 불러와서 변수(mongoose)에 담음
var bodyParser = require('body-parser'); // 설치한 body-parser module을 불러와서 변수(bodyParser)에 담음
var methodOverride = require('method-override'); // 7 actions 중 update와 destory는 HTTP Methods 중
// put과 delete를 사용하는데, 대부분의 form은 get과 post만을 허용하므로, 해당 package를 설치하여 이를 우회함
// query로 method 값을 받아서 request의 HTTP method를 바꿔주는 역할을 함
var flash = require('connect-flash');
var session = require('express-session');
var passport = require('./config/passport'); // passport와 passport-local package는 index.js에 rqeurie 되지 않고
// config passport.js에서 require됨
var app = express(); // express를 실행하여 app object를 초기화

// DB setting
// mongoose는 mongoDB와 node.js의 오브젝트를 연결해 주는 ORM library
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);
// mongoose사용을 위한 공통코드 : https://mongoosejs.com/docs/deprecations.html
// mongoose는 없는 콜렉션을 알아서 생성함
mongoose.connect(process.env.MONGO_DB); // MONGO_DB 환경변수에 URL 저장되어있음.
// 환경변수에 저장되어있는 String과 연결함
var db = mongoose.connection; // mongoose의 db object를 가져와 db변수에 넣는 과정
// db변수에는 DB와 관련된 이벤트 리스너 함수들을 포함
db.once('open', function(){
  console.log('DB connected');
});
// db가 정상적으로 연결된 경우 해당 로그 출력 (한번만 실행)
db.on('error', function(err){
  console.log('DB ERROR : ', err);
});
// db연결중 에러가 있는 경우 해당 에러를 출력

// Other settings
app.set('view engine', 'ejs'); // ejs를 사용하기 위해 express의 view engine에 ejs를 set
app.use(express.static(__dirname+'/public')); // 현재위치/public/route를 static 폴더로 지정함
// __dirname은 node.js에서 프로그램이 실행중인 파일의 위치를 나타내는 전역 변수
app.use(bodyParser.json()); // json 형식의 데이터를 받는다는 설정
app.use(bodyParser.urlencoded({extended:true})); // urlencoded data를 extended 알고리즘을 사용해 분석함
// 위를 설정해야 form에 입력한 데이터가 bodyParser를 통해 req.body으로 생성됨.
app.use(methodOverride('_method')); // _method의 query로 들어오는 값을 HTTP method로 바꿈
// ex) localhost:3000/posts/_id?_method=delete를 받으면, _method의 값인 delete를 읽어
// 해당 request의 HTTP method를 delete로 변경함.
app.use(flash()); // req.flash 함수를 사용가능
// 1. req.flash(문자열, 저장할_값) : 문자열에 저장할_값 저장
// 2. req.flash(문자열) : 해당 문자열에 저장된 값들을 배열로 불러옴
app.use(session({secret:'MySecret', resave:true, saveUninitialized:true})); // 서버에서 접속자를 구분시키는 역할, 보안성 향상

// Passport
app.use(passport.initialize()); // passport를 초기화 시켜주는 함수
app.use(passport.session()); // passport를 session과 연결해 주는 함수

// Custom Middlewares
// middleware = app.use에 함수를 넣는 것
app.use(function(req,res,next){
  res.locals.isAuthenticated = req.isAuthenticated(); // 현재 로그인이 되어있는지 확인
  res.locals.currentUser = req.user; // session으로 부터 user를 deserialize하여 생성됨 (로그인된 user의 정보를 불러들어옴)
  next();
});

// Routes
app.use('/', require('./routes/home')); // route에 해당 요청이 오는 경우에 콜백 함수를 호출함
app.use('/posts', require('./routes/posts')); // posts route를 추가함
app.use('/users', require('./routes/users')); // users route를 추가함

// Port setting
var port = 3000; // 사용할 포트 번호를 port변수에 넣음
app.listen(port, function(){ // port변수를 이용하여 3000번 포트에 node.js 서버를 연결함
  console.log('server on! http://localhost:'+port); // 서버가 실행되면 콘솔창에 표시된 메시지
});
