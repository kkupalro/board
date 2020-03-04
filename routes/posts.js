var express  = require('express');
var router = express.Router();
var Post = require('../models/Post'); // Post 모듈을 require로 호출
var util = require('../util');

// Index
// "/"에 get 요청이 오는 경 에러가 있다면 json형태로 브라우저에 표시,
// 없다면 검색결과를 받아 view/posts/index.ejs를 render(페이지를 다이나믹하게 제작)
router.get('/', function(req, res){
  Post.find({})
    .populate('author') // Model.populate() 함수는 Relationship이 형성되어 있는 항목의 값을 생성함
    .sort('-createdAt') // 나중에 생성된 게시글이 위로 오도록 내림차순정렬
    .exec(function(err, posts){
      if(err) return res.json(err);
      res.render('posts/index', {posts:posts});
    });
});

// New
// 새로운 게시글을 만드는 form이 있는 views/posts/new.ejs를 render함
router.get('/new', util.isLoggedin, function(req, res){
  var post = req.flash('post')[0] || {};
  var errors = req.flash('errors')[0] || {};
  res.render('posts/new', { post:post, errors:errors });
});

// create
// "/"에 post 요청이 오는 경우, '/posts/new'에서 form을 전달받는 경우
// 모델.create는 DB에 data를 생성하는 함수, 첫번째 피라미터로 data의 object를 받고, 두번째로 에러처리
// 에러없이 post datar가 생성되면 /posts로 redirect함
router.post('/', util.isLoggedin, function(req, res){ // 로그인이 된 경우에만 해당 route를 사용가능
  req.body.author = req.user._id; // 게시글 작성시, 해당 값을 가져와 post의 author에 기록함
  Post.create(req.body, function(err, post){
    if(err){
      req.flash('post', req.body);
      req.flash('errors', util.parseError(err));
      return res.redirect('/posts/new');
    }
    res.redirect('/posts');
  });
});

// show
// "/:id"에 get요청이 오는 경우
// route에 (:)를 사용하면 req.params에 넣음
// Model.findOne은 DB에서 해당 model의 document를 하나 찾는 함수 = select
// 에러가 없다면 views/posts/show.ejs를 render함
router.get('/:id', function(req, res){
  Post.findOne({_id:req.params.id})
    .populate('author')
    .exec(function(err, post){
      if(err) return res.json(err);
      res.render('posts/show', {post:post});
    });
});

// edit
// '/:id/edit'에 get요청이 오는 경우
// (findOne)검색 결과를 받아 views/posts/edit.ejs로 render
// req.params.id(로그인된 user의 id) 키값인 _id값과 post.author의 값이 같으면
router.get('/:id/edit', util.isLoggedin, checkPermission, function(req, res){ // 본인이 작성한 post인 경우에만 해당 route을 사용가능
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
// '/:id'에 put요청이 오는 경우
// Model.findOneAndUpdate는 DB에서 해당 model의 document를 하나 찾아 그 data를 수정하는 함수
// 첫번째 피라미터로 조건을 object로 입력하고 두번째 피라미터로 update할 정보를 object로
// 입력data를 찾은 후 callback함수를 호출
// data 수정 후 '/posts/' + req.params.id로 redirect함
router.put('/:id', util.isLoggedin, checkPermission, function(req, res){
  req.body.updatedAt = Date.now();
  Post.findOneAndUpdate({_id:req.params.id}, req.body, {runValidators:true}, function(err, post){
    if(err){
      req.flash('post', req.body);
      req.flash('errors', util.parseError(err));
      return res.redirect('/posts/'+req.params.id+'/edit');
    }
    res.redirect('/posts/'+req.params.id);
  });
});

// destroy
// '/:id'에 delete요청이 오는 경우
// Model.deleteOne은 DB에서 해당 model의 document를 하나 찾아 삭제하는 함
router.delete('/:id', util.isLoggedin, checkPermission, function(req, res){
  Post.deleteOne({_id:req.params.id}, function(err){
    if(err) return res.json(err);
    res.redirect('/posts');
  });
});

module.exports = router;

// private functions
// 해당 게시물에 기록된 author와 로그인된 user.id를 비교해서 진행 여부 검사
function checkPermission(req, res, next){
  Post.findOne({_id:req.params.id}, function(err, post){
    if(err) return res.json(err);
    if(post.author != req.user.id) return util.noPermission(req, res);

    next();
  });
}
