var util = {};

util.parseError = function(errors){
  var parsed = {};
  if(errors.name == 'ValidationError'){
    for(var name in errors.errors){
      var validationError = errors.errors[name];
      parsed[name] = { message:validationError.message };
    }
  }
  else if(errors.code == '11000' && errors.errmsg.indexOf('username') > 0) {
    parsed.username = { message:'This username already exists!' };
  }
  else {
    parsed.unhandled = JSON.stringify(errors);
  }
  return parsed;
}

util.isLoggedin = function(req,res,next){ //로그인이 되었는지 아닌지
  if(req.isAuthenticated()){
    next();
  }
  else{
    req.flash('errors', {login: 'please login first'});
    res.redirect('/login');
  }
}

util.noPermission = function(req,res){
  req.flash('errors', {login:'you dont have permission'});
  req.logout();
  res.direction('./login');
}


util.getPostQueryString = function(req, res, next){
  res.locals.getPostQueryString = function(isAppended=false, overwrites={}){//req.query로 전달 받은 query에서 page,limit을 추출하여 다시 한줄의 문자열로 만들어 반환하는것이다.
    //첫 파라미터는 생설할 query string이 기존의 query에 추가되는 query인지 아닌지 boolean으로. 추가되면 & 아니면?
    //두번째 파라미터는 req.query의 page나 limit을 overwrite하는 파라메터이다.
    var queryString = '';
    var queryArray = [];
    var page = overwrites.page?overwrites.page:(req.query.page?req.query.page:'');
    var limit = overwrites.limit?overwrites.limit:(req.query.limit?req.query.limit:'');
    var searchType = overwrites.searchType?overwrites.searchType:(req.query.searchType?req.query.searchType:''); // 1
    var searchText = overwrites.searchText?overwrites.searchText:(req.query.searchText?req.query.searchText:''); // 1
    
    if(page) queryArray.push('page='+page);
    if(limit) queryArray.push('limit='+limit);
    if(searchType) queryArray.push('searchType='+ searchType);
    if(searchText) queryArray.push('searchText=' + searchText);
  
    if(queryArray.length>0) queryString = (isAppended?'&':'?') + queryArray.join('&');
  
    return queryString;
  }
  next();
}


util.convertToTrees = function(array, idFieldName, parentIdFieldName, childrenFieldName){
  var cloned = array.slice();
  
  for(var i=cloned.length-1; i>-1; i--){
    var parentId = cloned[i][parentIdFieldName];
    
    if(parentId){
      var filtered = array.filter(function(elem){
        return elem[idFieldName].toString() == parentId.toString();
      });
      
      if(filtered.length){
        var parent = filtered[0];
        
        if(parent[childrenFieldName]){
          parent[childrenFieldName].push(cloned[i]);
        }
        else {
          parent[childrenFieldName] = [cloned[i]];
        }
        
      }
      cloned.splice(i,1);
    }
  }
  
  return cloned;
}


module.exports = util;
