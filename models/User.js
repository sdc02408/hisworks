var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

// schema
var userSchema = mongoose.Schema({
  username:{
    type:String,
    //반드시 입력되어야한다.
    required:[true,'Username is required!'],
    match:[/^.{3,12}$/,'Should be 3-12 characters!'],
    trim:true,
    // unique:true    값이 중복되면 안된다.
  },
  password:{
    type:String,
    required:[true,'비밀번호를 입력하세요'],
    select:false //비밀번호 읽어오지 않아.
  },
  name:{
    type:String,
    required:[true,'이름을 입력하세요'],
    trim:true
  },
  email:{
    type:String,
    match:[/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,'이메일의 형식이 맞지 않습니다.'],
    trim:true
  },
  naver: {
    id: String,
    token: String,
    email: String,
    name: String,
    nickname: String
  },
  google: {
    id: String,
    token: String,
    email: String,
    name: String,
  },
},{
  toObject:{virtuals:true}
});

// virtuals
//db에 저장되는 값 이외의 항목이 필요할때 virtual 항목사용. 회원가입,회원정보 수정을 위해 필요한 항목이지만 ,db에 저장할 필요는 없는 것들

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
var passwordRegexErrorMessage = '최소 8글자의 숫자와 문자가 필요합니다.';

//db에 생성,수정 하기 전에 값이 유효한지 확인하는 코드
userSchema.path('password').validate(function(v) {
  var user = this; //user모델.

  // create user
  if(user.isNew){//현재 password validation의 회원가입 단계인지 회원정보 수정 단계인지 알 수 있다. 회원가입 단계인지 회원 정보 수정 단계인지.
    if(!user.passwordConfirmation){
      user.invalidate('passwordConfirmation', 'Password Confirmation is required.');
    }

    if(!passwordRegex.test(user.password)){
      user.invalidate('password', passwordRegexErrorMessage);
    }
    else if(user.password !== user.passwordConfirmation) {
      user.invalidate('passwordConfirmation', 'Password Confirmation does not matched!');
    }
  }

  // update user
  if(!user.isNew){
    if(!user.currentPassword){
      user.invalidate('currentPassword', 'Current Password is required!');
    }
    else if(!bcrypt.compareSync(user.currentPassword, user.originalPassword)){
      user.invalidate('currentPassword', 'Current Password is invalid!');
    }

    if(user.newPassword && !passwordRegex.test(user.newPassword)){//정규 표현식을 통과하는 부분이 있다면 true
      user.invalidate("newPassword", passwordRegexErrorMessage);//false면 passwordRegexErrorMessage호출
    }
    else if(user.newPassword !== user.passwordConfirmation) {
      user.invalidate('passwordConfirmation', 'Password Confirmation does not matched!');
    }
  }
});

// hash password
userSchema.pre('save', function (next){
  var user = this;
  if(!user.isModified('password')){//db에 기록된 값과 비교해서 변경된 겨우 true를
    return next();
  }
  else {
    user.password = bcrypt.hashSync(user.password);//user를 생성하거나 suer수정시 user.password의 변경이 있는 경우에는 hash값으로 변경.
    return next();
  }
});

// model methods
userSchema.methods.authenticate = function (password) {
  var user = this;
  return bcrypt.compareSync(password,user.password);
};

// model & export
var User = mongoose.model('user',userSchema);
module.exports = User;
