var mongoose = require('mongoose');

// schema
var postSchema = mongoose.Schema({
  title:{type:String, required:[true,'글 제목을 입력해주세요!']},
  body:{type:String, required:[true,'글 내용을 입력해주세요!']},
  author:{type:mongoose.Schema.Types.ObjectId, ref:'user', required:true}, // user의 user.id와 post의 post.author를 연결
  createdAt:{type:Date, default:Date.now}, // default 항목으로 현재시간
  updatedAt:{type:Date},
},{versionKey: false});

// model & export
var Post = mongoose.model('post', postSchema);
module.exports = Post;
