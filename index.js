var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var flash = require('connect-flash');
var session = require('express-session');
var passport = require('./config/passport');
var app = express();
var util = require('./util');
var dotenv = require('dotenv');
dotenv.config();
const i18next = require('i18next');//i18next 추가
const i18nextMiddleware = require('i18next-express-middleware');//express 미들웨어 추가
const Backend = require('i18next-node-fs-backend');
var helmet = require('helmet');
var assert = require('assert');
const cors = require('cors');


var dburl = process.env.DB_URL
// DB setting
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);
mongoose.connect(dburl);
var db = mongoose.connection;
db.once('open', function(){
  console.log('DB connected');
});
db.on('error', function(err){
  console.log('DB ERROR : ', err);
});

// Other settings
app.set('view engine', 'ejs');
app.use(express.static(__dirname+'/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use(methodOverride('_method'));
app.use(flash());

app.use(session({
  secret:'MySecretcsy',
  resave:true,
  saveUninitialized:true,
  cookie: {maxAge: 3600000, httpOnly: true},
  rolling: true
}));//세션 암호화

app.use(helmet.hsts({
  maxAge: 10886400000,
  includeSubDomains:true
}));//세션 보안 설정



i18next//init
.use(Backend)
.use(i18nextMiddleware.LanguageDetector)
.init({
  backend: {
    loadPath: __dirname + '/locales/{{lng}}/{{ns}}.json',
    addPath: __dirname + '/locales/{{lng}}/{{ns}}.missing.json'
  },
  fallbackLng: 'en',
  preload: ['en','ko'],
  saveMissing: true
});

app.use(i18nextMiddleware.handle(i18next));

app.use(function (req, res, next) {
  res.locals.shit = "똥이다 히히히";
  res.locals.shot_shit = function(text) {
    return text + "는 똥이야 하하하";
  };
  res.locals.t = function(lgn, key) {
    var i18n = require('i18next');
    i18n.changeLanguage(lgn);
    return i18n.t(key);
  }
  next();
})
// Passport
app.use(passport.initialize());//passport 모듈 초기화
app.use(passport.session());//passport 세션 사용

// Custom Middlewares
app.use(function(req,res,next){
  res.locals.isAuthenticated = req.isAuthenticated();//현재 로그인 되어있는지 아닌지를 return
  res.locals.currentUser = req.user;//req.user 로그인이 되면 session으로부터 user를 deserialize하여 생성됨.
  next();//req.locals라는 변수에 담아.
});

// Routes
app.use('/', require('./routes/home'));
app.use('/posts',util.getPostQueryString, require('./routes/posts'));
app.use('/users', require('./routes/users'));
app.use('/comments', util.getPostQueryString, require('./routes/comments')); // 1
app.use(cors());
// Port setting
app.listen(process.env.PORT, function(){
  console.log('server on! http://localhost:'+process.env.PORT);
});
