var mongoose= require('mongoose')

var commentSchema = mongoose.Schema({
  comment:String,
  Date:{
      type:Date,
      default:Date.now
  },
  likes:{type:Array, default:[]},
  post:{ type:mongoose.Schema.Types.ObjectId, ref:"post"},
  writer:{ type:mongoose.Schema.Types.ObjectId, ref:"user"}
})


module.exports = mongoose.model('comment', commentSchema)