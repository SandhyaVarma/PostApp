var mongoose= require('mongoose')

var postSchema = mongoose.Schema({
  imageurl:String,
  caption:String,
  date:{type:Date, default:Date.now},
  like:{type:Array,default:[]},
  postuser:{ type:mongoose.Schema.Types.ObjectId, ref:"user"},
  comments:[{ type:mongoose.Schema.Types.ObjectId, ref:"comment"}],
  follow:{type:Array, default:[]}

})


module.exports = mongoose.model('post', postSchema)