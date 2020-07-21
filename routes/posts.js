var express  = require('express');
var router = express.Router();
var Post = require('../models/Post');
var User = require('../models/User');
var util = require('../util');
var Comment = require('../models/Comment');

// Index
router.get('/',async function(req, res){
  var page = Math.max(1, parseInt(req.query.page));//parseInt: query string은 문자열로 전달되기 때문에 숫자가 아닐 수도 있고 정수를 읽어내기위해
  var limit = Math.max(1, parseInt(req.query.limit));//math.max : page,limit 은 양수여야한다.
  page = !isNaN(page)?page:1;                         // 3
  limit = !isNaN(limit)?limit:10;
  
  var skip = (page-1)*limit;
  var maxPage = 0;
  var searchQuery = await createSearchQuery(req.query);
  var posts = [];
 
  if(searchQuery) {
    var count = await Post.countDocuments(searchQuery); //promise앞에 await키워드를 사용하면,해당 promise가 완료될때까지 다음 코드로 진행하지 않고 기다렸다가 해당 promise가 완료되면 resolve 된 값을 반환.
//전체 게시물 수와 게시물을 구한다.
    maxPage = Math.ceil(count/limit);
    posts = await Post.find(searchQuery)
    .populate('author')
    .sort('-createdAt') //나중에 생성된 데이터가 위로오도록
    .skip(skip)   // 8
    .limit(limit) // 8
    .exec();
  }
  res.render('posts/index', {
    posts:posts,
    currentPage:page, // 9
    maxPage:maxPage,  // 9
    limit:limit,       // 9
    searchType: req.query.searchType,// view에서 검색 form에 현재 검색에 사용한 검색타입과 검색어를 보여줄수 있게 데이터를view로 보내.
    searchText:req.query.searchText
      });
});

// New
router.get('/new',util.isLoggedin, function(req, res){
  var post = req.flash('post')[0] || {};
  var errors = req.flash('errors')[0] || {};
  res.render('posts/new', { post:post, errors:errors });
});

// create
router.post('/', util.isLoggedin, function(req, res){
  req.body.author = req.user._id;//글을 작성할때는 req.user._id를 가져와서 post의 author에 기록한다.
  Post.create(req.body, function(err, post){
    if(err){
      req.flash('post', req.body);
      req.flash('errors', util.parseError(err));
      return res.redirect('/posts/new'+res.locals.getPostQueryString()); // 1 post/routes에서 redirect가 있는 경우 함수를 사용하여 query string을 계속 유지.
    }
    res.redirect('/posts'+res.locals.getPostQueryString(false, {page:1, searchText: ''})); //2 새글 작성후 무조건 첫번째 page 새글을 작성하면 검색 결과를 query string에서 제거하여 전체게시물이 보이도록
  });
});

// show
router.get('/:id', function(req, res){
  var commentForm = req.flash('commentForm')[0] || {_id: null, form: {}};
  var commentError = req.flash('commentError')[0] || { _id:null, parentComment: null, errors:{}};
  
  Promise.all([
    Post.findOne({_id:req.params.id}).populate({ path: 'author', select: 'username' }),
    Comment.find({post:req.params.id}).sort('createdAt').populate({ path: 'author', select: 'username' })
  ])
  .then(([post, comments]) => {
    var commentTrees = util.convertToTrees(comments, '_id','parentComment','childComments');                               //2
    res.render('posts/show', { post:post, commentTrees:commentTrees, commentForm:commentForm, commentError:commentError}); //2
  })
  .catch((err) => {
    return res.json(err);
  });
});

// edit
router.get('/:id/edit', util.isLoggedin, checkPermission, function(req, res){
  var post = req.flash('post')[0];
  var errors = req.flash('errors')[0] || {};
  if(!post){
    Post.findOne({_id:req.params.id}, function(err, post){
        if(err) return res.json(err);
        res.render('posts/edit', { post:post, errors:errors });
      });
  }
  else {
    post._id = req.params.id;
    res.render('posts/edit', { post:post, errors:errors });
  }
});

// update
router.put('/:id', util.isLoggedin, checkPermission, function(req, res){
  req.body.updatedAt = Date.now(); //post를 수정된 날짜ㅏ를 updateAt에 기록
  Post.findOneAndUpdate({_id:req.params.id}, req.body, {runValidators:true}, function(err, post){
    if(err){
      req.flash('post', req.body);
      req.flash('errors', util.parseError(err));
      return res.redirect('/posts/'+req.params.id+'/edit'+res.locals.getPostQueryString()); // 1
    }
    res.redirect('/posts/'+req.params.id+res.locals.getPostQueryString()); // 1
  });
});

// destroy
router.delete('/:id', util.isLoggedin, checkPermission, function(req, res){
  Post.deleteOne({_id:req.params.id}, function(err){
    if(err) return res.json(err);
    res.redirect('/posts'+res.locals.getPostQueryString()); // 1
  });
});

module.exports = router;

//post 에서 해당 게시물에 기록된 author 와 로그인된 user.id 를 비교해서 같은 경우에만 계속 진행. 다르면 login으로
function checkPermission(req, res, next){
  Post.findOne({_id:req.params.id}, function(err, post){
    if(err) return res.json(err);
    if(post.author != req.user.id) return util.noPermission(req, res);
    
    next();
  });
}

async function createSearchQuery(queries){ // 4
  var searchQuery = {};
  if(queries.searchType && queries.searchText && queries.searchText.length >= 3){ // query에 searchtype text가존재하고 텍스트가 3글자 이상인 겨우만 searchquery를 만들고 나머지는 모든게시물 검색
    var searchTypes = queries.searchType.toLowerCase().split(',');
    var postQueries = [];
    if(searchTypes.indexOf('title')>=0){
      postQueries.push({ title: { $regex: new RegExp(queries.searchText, 'i') } });//ㄱ regex검색할수 있다. i는 대소문자 구별하지 않는다는 말
    }
    if(searchTypes.indexOf('body')>=0){
      postQueries.push({ body: { $regex: new RegExp(queries.searchText, 'i') } });
    }
    if(searchTypes.indexOf('body')>=0){
      postQueries.push({ body: { $regex: new RegExp(queries.searchText, 'i') } });
    }
    if(searchTypes.indexOf('author!')>=0){//searchtype 이 author! 인경우 searchtext가 username과 일치하는 user한명을 찾아 검색쿼리에 추가.
      var user = await User.findOne({ username: queries.searchText }).exec();
      if(user) postQueries.push({author:user._id});
    }
    else if(searchTypes.indexOf('author')>=0){//searchtype이 author인경우 regex르 이용해 searchtext가 suername에 일부분인 user를 찾아 개별적으로 $in사용해 검색쿼리를 만들어 . (author가 userids안에 포함된 경우를 찾는거)
      var users = await User.find({ username: { $regex: new RegExp(queries.searchText, 'i') } }).exec();
      var userIds = [];
      for(var user of users){
        userIds.push(user._id);
      }
      if(userIds.length>0) postQueries.push({author:{$in:userIds}});
    }
    if(postQueries.length > 0) searchQuery = {$or:postQueries}; // $or를 사용해서 검색한다.  작성자 검색의 경우 ,해당 user가 검색된 겨우 postQueries에 조건이 추가된다. 검색 조건과 ㅏ맞는 user가 존재하지 않으면
      //게시물 검색결과는 업어야한다.
    else searchQuery = null;
  }
  return searchQuery;
}
